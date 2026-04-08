import { APIRequestContext, expect } from "@playwright/test"

export class TodoClient {
  constructor(private request: APIRequestContext) {}

  async createTodo(payload: any) {
    const response = await this.request.post("/api/todos", { data: payload })
    expect(response.status(), "POST /api/todos should return 201").toBe(201)
    return (await response.json()).data
  }

  async updateTodo(id: string, payload: any) {
    const response = await this.request.put(`/api/todos/${id}`, {
      data: payload,
    })
    expect(response.status(), "PUT /api/todos/:id should return 200").toBe(200)
    return (await response.json()).data
  }

  async getAllTodo() {
    const response = await this.request.get("/api/todos")
    expect(response.status(), "GET /api/todos should return 200").toBe(200)
    return (await response.json()).data
  }

  async getTodo(id: string) {
    const response = await this.request.get(`/api/todos/${id}`)
    expect(response.status(), "GET /api/todos/:id should return 200").toBe(200)
    return (await response.json()).data
  }

  async deleteTodo(id: string) {
    const response = await this.request.delete(`/api/todos/${id}`)
    expect(response.status(), "DELETE /api/todos/:id should return 204").toBe(
      204,
    )
  }
}
