import http, { RefinedResponse, ResponseType, Params } from "k6/http"

// Own performance-layer type - decoupled from src/
export interface Todo {
  _id: string
  title: string
  description?: string
  completed: boolean
}

export interface TodoResponseBody {
  data: Todo
}

export interface TodoListResponseBody {
  data: Todo[]
}

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

  create(payload: Todo): RefinedResponse<ResponseType> {
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

  update(id: string, payload: Partial<Todo>): RefinedResponse<ResponseType> {
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
