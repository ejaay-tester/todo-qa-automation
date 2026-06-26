import { check, sleep } from "k6"
import http from "k6/http"
import { Rate } from "k6/metrics"
import { Options } from "k6/options"
import { registerUser, login } from "../helpers/auth"
import { TodoClient } from "../clients/todo-client"
import { defaultThresholds } from "../options/thresholds"

// Treat 404 as expected globally for this scenario, since the
// delete-verification step intentionally requests a removed resource
http.setResponseCallback(http.expectedStatuses(200, 201, 204, 404))

// CUSTOM METRICS
const errorRate = new Rate("todo_error_rate")

// SCENARIO OPTIONS
export const options: Options = {
  scenarios: {
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
    },
  },

  // This controls which percentiles appear in the terminal summary
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],

  thresholds: {
    ...defaultThresholds,

    // Use the tag name to create per-endpoint metrics in the terminal
    "http_req_duration{name: POST /api/todos}": ["p(95)<400"],
    "http_req_duration{name: GET /api/todos}": ["p(95)<300"],
    "http_req_duration{name: GET /api/todos/:id}": ["p(95)<300"],
    "http_req_duration{name: PUT /api/todos/:id}": ["p(95)<400"],
    "http_req_duration{name: DELETE /api/todos/:id}": ["p(95)<300"],

    todo_error_rate: ["rate<0.01"],
  },
}

// SETUP - RUNS ONCE BEFORE ALL VUS
interface UserData {
  token: string
}

export function setup(): UserData {
  const user = registerUser()
  const token = login(user.email, user.password)
  return { token }
}

// DEFAULT - EACH VU RUNS THIS IN A LOOP
export default function ({ token }: UserData): void {
  const client = new TodoClient(token)
  const virtualUserId = __VU
  const iteration = __ITER
  const todoTitle = `Smoke todo title VU-${virtualUserId} | Iteration-${iteration}`
  const todoDescription = `Smoke todo description`
  const updatedTodoTitle = `Updated todo title VU-${virtualUserId} | Iteration-${iteration}`
  const updatedTodoDescription = `Updated todo description`

  // CREATE TODO
  const createResponse = client.create({
    title: todoTitle,
    description: todoDescription,
    completed: false,
  })

  const createBody = createResponse.json() as {
    data: { _id: string; title: string; completed: boolean }
  }

  const createTodoPassed = check(createResponse, {
    "POST /api/todos: status 201": (res) => res.status === 201,
    "POST /api/todos: has_id": () => createBody?.data?._id !== undefined,
    "POST /api/todos: title matches": () =>
      createBody?.data?.title === todoTitle,
    "POST /api/todos: completed false": () =>
      createBody?.data?.completed === false,
  })
  errorRate.add(!createTodoPassed)

  const todoId = createBody?.data?._id
  if (!todoId) return // guard - skip remaining step if create todo fails

  // GET ALL TODO
  const getAllResponse = client.getAll()

  const getAllBody = getAllResponse.json() as { data: unknown[] }

  const getAllTodoPassed = check(getAllResponse, {
    "GET /api/todos: status 200": (res) => res.status === 200,
    "GET /api/todos: returns array": () => Array.isArray(getAllBody?.data),
  })
  errorRate.add(!getAllTodoPassed)

  // GET BY ID
  const getByIdResponse = client.getById(todoId)

  const getByIdBody = getByIdResponse.json() as {
    data: { _id: string; title: string }
  }

  const getByIdPassed = check(getByIdResponse, {
    "GET /api/todos/:id: status 200": (res) => res.status === 200,
    "GET /api/todos/:id: correct _id": () => getByIdBody?.data?._id === todoId,
  })
  errorRate.add(!getByIdPassed)

  // UPDATE TODO
  const updateResponse = client.update(todoId, {
    title: updatedTodoTitle,
    description: updatedTodoDescription,
    completed: true,
  })

  const updateBody = updateResponse.json() as {
    data: {
      _id: string
      title: string
      description: string
      completed: boolean
    }
  }

  const updatePassed = check(updateResponse, {
    "PUT /api/todos/:id: status 200": (res) => res.status === 200,
    "PUT /api/todos/:id: title updated": () =>
      updateBody?.data?.title ===
      `Updated todo title VU-${virtualUserId} | Iteration-${iteration}`,
    "PUT /api/todos/:id: description updated": () =>
      updateBody?.data?.description === `Updated todo description`,
    "PUT /api/todos/:id: completed true": () =>
      updateBody?.data?.completed === true,
  })
  errorRate.add(!updatePassed)

  // DELETE TODO
  const deleteResponse = client.delete(todoId)

  const deleteTodoPassed = check(deleteResponse, {
    "DELETE /api/todos/:id: status 204": (res) => res.status === 204,
  })
  errorRate.add(!deleteTodoPassed)

  // VERIFY DELETION
  const verifyDeleteResponse = client.getById(todoId)
  check(verifyDeleteResponse, {
    "GET /api/todos/:id after delete: status 404": (res) => res.status === 404,
  })

  sleep(1)
}
