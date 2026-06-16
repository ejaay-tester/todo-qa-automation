import { check, sleep } from "k6"
import { Trend, Rate } from "k6/metrics"
import { Options } from "k6/options"
import { registerUser, login } from "../helpers/auth"
import { TodoClient } from "../clients/todo-client"
import { defaultThresholds } from "../options/thresholds"

// CUSTOM METRICS
const createDuration = new Trend("todo_create_duration", true)
const getAllDuration = new Trend("todo_get_all_duration", true)
const deleteDuration = new Trend("todo_delete_duration", true)
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
  thresholds: {
    ...defaultThresholds,
    todo_create_duration: ["p(95)<400"],
    todo_get_all_duration: ["p(95)<300"],
    todo_delete_duration: ["p(95)<300"],
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

  // CREATE TODO
  const createResponse = client.create({
    title: `Smoke todo VU-${virtualUserId} | Iteration-${iteration}`,
    description: `k6 Smoke Test`,
    completed: false,
  })
  createDuration.add(createResponse.timings.duration)

  const createBody = createResponse.json() as {
    data: { _id: string; title: string; completed: boolean }
  }

  const createTodoPassed = check(createResponse, {
    "POST /api/todos: status 201": (res) => res.status === 201,
    "POST /api/todos: has_id": () => createBody?.data?._id !== undefined,
    "POST /api/todos: title matches": () =>
      createBody?.data?.title ===
      `Smoke todo VU-${virtualUserId} | Iteration-${iteration}`,
    "POST /api/todos: completed false": () =>
      createBody?.data?.completed === false,
  })
  errorRate.add(!createTodoPassed)

  const todoId = createBody?.data?._id
  if (!todoId) return // guard - skip remaining step if create todo fails

  // GET ALL TODO
  const getAllResponse = client.getAll()
  getAllDuration.add(getAllResponse.timings.duration)

  const getAllBody = getAllResponse.json() as { data: unknown[] }

  const getAllTodoPassed = check(getAllResponse, {
    "GET /api/todos: status 200": (res) => res.status === 200,
    "GET /api/todos: returns array": () => Array.isArray(getAllBody?.data),
  })
  errorRate.add(!getAllTodoPassed)

  // DELETE TODO
  const deleteResponse = client.delete(todoId)
  deleteDuration.add(deleteResponse.timings.duration)

  const deleteTodoPassed = check(deleteResponse, {
    "DELETE /api/todos/:id: status 204": (res) => res.status === 204,
  })
  errorRate.add(!deleteTodoPassed)

  sleep(1)
}
