import http, { RefinedResponse, ResponseType, Params } from "k6/http"

// --- REQUEST TYPES ---
// What you SEND to the API - no _id, server generates it
export interface TodoPayload {
  title: string
  description?: string
  completed: boolean
}

// --- RESPONSE TYPES ---
// What you GET BACK from the API - includes _id, title, description, completed
export interface Todo {
  _id: string // server-generated, always present in responses
  title: string
  description?: string
  completed: boolean
  [key: string]: unknown // JSONObject compatibility
}

export interface TodoResponseBody {
  data: Todo
  [key: string]: unknown // JSONObject compatibility
}

export interface TodoListResponseBody {
  data: Todo[]
  [key: string]: unknown // JSONObject compatibility
}

// --- CLIENT ---
const BASE_URL: string = __ENV.BASE_URL || "http://localhost:3000"

export class TodoClient {
  private readonly params: Params

  constructor(token: string) {
    this.params = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  }

  // accepts TodoPayload (no _id) - correct for a create request
  create(payload: TodoPayload): RefinedResponse<ResponseType> {
    return http.post(`${BASE_URL}/api/todos`, JSON.stringify(payload), {
      ...this.params, // pass the whole params object
      tags: { name: "POST /api/todos" }, // tag for grouped metrics
    })
  }

  getAll(): RefinedResponse<ResponseType> {
    return http.get(`${BASE_URL}/api/todos`, {
      ...this.params,
      tags: { name: "GET /api/todos" },
    })
  }

  getById(id: string): RefinedResponse<ResponseType> {
    return http.get(`${BASE_URL}/api/todos/${id}`, {
      ...this.params,
      tags: { name: "GET /api/todos/:id" },
    })
  }

  // accepts Partial<TodoPayload> - correct for an update request
  update(
    id: string,
    payload: Partial<TodoPayload>,
  ): RefinedResponse<ResponseType> {
    return http.put(`${BASE_URL}/api/todos/${id}`, JSON.stringify(payload), {
      ...this.params,
      tags: { name: "PUT /api/todos/:id" },
    })
  }

  delete(id: string): RefinedResponse<ResponseType> {
    return http.del(`${BASE_URL}/api/todos/${id}`, null, {
      ...this.params,
      tags: { name: "DELETE /api/todos/:id" },
    })
  }
}
