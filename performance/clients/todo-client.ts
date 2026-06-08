import http, { RefinedResponse, ResponseType, Params } from "k6/http"

// Own performance-layer type - decoupled from src/
export interface TodoPayload {
  title: string
  description?: string
  completed: boolean
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

  create(payload: TodoPayload): RefinedResponse<ResponseType> {
    return http.post(
      `${BASE_URL}/api/todos`,
      JSON.stringify(payload),
      this.params, // pass the whole params object
    )
  }

  getAll(): RefinedResponse<ResponseType> {
    return http.get(`${BASE_URL}/api/todos`, this.params)
  }

  getById(id: string): RefinedResponse<ResponseType> {
    return http.get(`${BASE_URL}/api/todos/${id}`, this.params)
  }

  update(
    id: string,
    payload: Partial<TodoPayload>,
  ): RefinedResponse<ResponseType> {
    return http.put(
      `${BASE_URL}/api/todos/${id}`,
      JSON.stringify(payload),
      this.params,
    )
  }

  delete(id: string): RefinedResponse<ResponseType> {
    return http.del(`${BASE_URL}/api/todos/${id}`, null, this.params)
  }
}
