import { check, sleep } from "k6"
import { Trend, Rate } from "k6/metrics"
import { Options } from "k6/options"
import { registerUser, login } from "../helpers/auth"
import { TodoClient } from "../clients/todo-client"
import { defaultThresholds } from "../options/thresholds"

// CUSTOM METRICS
const createDuration = new Trend("todo_create_duration", true)
const getAllDuration = new Trend("todo_get_all_duration", true)
const deleteDuration = new Trend("todo_delete duration", true)
const errorRate = new Trend("todo_error_rate")

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
  },
}

// SETUP - RUNS ONCE BEFORE ALL VUS
interface UserData {
  token: string
}

export function setupUserData(): UserData {
  const user = registerUser()
  const token = login(user.email, user.password)
  return { token }
}

// DEFAULT - EACH VU RUNS THIS IN A LOOP
export default function ({ token }: UserData): void {
  const client = new TodoClient(token)

  // CREATE TODO
  const createTodo = client.create({
    title: `Smoke todo ${Date.now()}`,
    description: `k6 Smoke Test`,
    completed: false,
  })

  createDuration.add(createTodo.timings.duration)

  const createTodoPassed = check(createTodo, {
    "POST /api/todos: status 201": (res) => res.status === 201,
    "POST /api/todos: has_id": (res) =>
      (res.json() as { data: { _id: string } })?.data?._id !== undefined,
  })
  errorRate.add(!createTodoPassed)

  const todoId = (createTodo.json() as { data: { _id: string } })?.data?._id
  if (!todoId) return // guard - skip remaining step if create todo fails

  // GET ALL TODO
  const getAllTodo = client.getAll()
  getAllDuration.add(getAllTodo.timings.duration)

  const getAllTodoPassed = check(getAllTodo, {
    "GET /api/todos: status 200": (res) => res.status === 200,
    "GET /api/todos: returns array": (res) =>
      Array.isArray((res.json() as { data: unknown[] })?.data),
  })
  errorRate.add(!getAllTodoPassed)

  // DELETE TODO
  const deleteTodo = client.delete(todoId)
  deleteDuration.add(deleteTodo.timings.duration)

  const deleteTodoPassed = check(deleteTodo, {
    "DELETE /api/todos/:id: status 204": (res) => res.status === 204,
  })
  errorRate.add(!deleteTodoPassed)

  sleep(1)
}
