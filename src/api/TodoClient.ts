import { APIRequestContext, APIResponse, expect } from "@playwright/test"
import { Todo, TodoPayload } from "../types/todo.type"

export class TodoClient {
  constructor(private request: APIRequestContext) {}

  /**
   * PRIVATE HELPER: Safe JSON Parsing
   * Separates the parsing action from error handling for better readability
   */
  private async parseResponseJson<T>(
    response: APIResponse,
    method: string,
  ): Promise<T> {
    let body: any

    try {
      // Attempt the Action
      body = await response.json()
    } catch (error) {
      // Handle the Error with high-context details
      const status = response.status()
      throw new Error(
        `[${method}] failed: Response is not a valid JSON.
        Status: ${status} | Error: ${error}`,
      )
    }

    // Secondary Validation: Ensure the expected 'data' key exists
    expect(
      body,
      `${method} response should contain a 'data' property`,
    ).toHaveProperty("data")
    return body.data as T // Cast the 'data' property to the requested type
  }

  /**
   * CRUD METHODS
   */

  // CREATE
  async create(payload: TodoPayload): Promise<Todo> {
    const response = await this.request.post("/api/todos", { data: payload })
    expect(response.status(), "POST /api/todos should return 201").toBe(201)
    return this.parseResponseJson<Todo>(response, "POST")
  }

  // READ
  async getAll(): Promise<Todo[]> {
    const response = await this.request.get("/api/todos")
    expect(response.status(), "GET /api/todos should return 200").toBe(200)
    const data = await this.parseResponseJson<Todo[]>(response, "GET ALL")

    expect(Array.isArray(data), "Expected an array of todos").toBeTruthy()
    return data
  }

  async get(id: string): Promise<Todo> {
    const response = await this.request.get(`/api/todos/${id}`)
    expect(response.status(), `GET /api/todos/${id} should return 200`).toBe(
      200,
    )
    return this.parseResponseJson<Todo>(response, "GET")
  }

  // UPDATE
  async update(id: string, payload: TodoPayload): Promise<Todo> {
    const response = await this.request.put(`/api/todos/${id}`, {
      data: payload,
    })
    expect(response.status(), `PUT /api/todos/${id} should return 200`).toBe(
      200,
    )
    return this.parseResponseJson<Todo>(response, "PUT")
  }

  // DELETE
  async delete(id: string): Promise<void> {
    const response = await this.request.delete(`/api/todos/${id}`)
    expect(response.status(), `DELETE /api/todos/${id} should return 204`).toBe(
      204,
    )
  }
}
