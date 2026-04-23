import { APIRequestContext, APIResponse, expect } from "@playwright/test"
import * as allure from "allure-js-commons"
import { Todo, TodoPayload } from "../types/todo.type"

export class TodoClient {
  private readonly endpoint = "/api/todos"

  constructor(private request: APIRequestContext) {}

  /**
   * GENERIC REQUEST HANDLER
   * This handles
   * Allure Reporting,
   * Fail-Fast Assertions,
   * JSON parsing,
   * and Type Casting
   * for all methods
   */

  private async handleRequest<T>(
    method: string,
    url: string,
    response: APIResponse,
    payload?: any,
  ): Promise<T> {
    return await allure.step(`${method} ${url}`, async () => {
      // 1. Attach Request Payload if it exists
      if (payload) {
        await allure.attachment(
          "Request Payload",
          JSON.stringify(payload, null, 2),
          "application/json",
        )
      }

      // 2. Parse Response (Safety check for empty body like 204 No Content)
      const body =
        response.status() !== 204
          ? await response.json().catch((error) => {
              throw new Error(`Failed to parse JSON: (${error})`)
            })
          : {}

      // 3. Attach Response Body
      await allure.attachment(
        "Response Body",
        JSON.stringify(body, null, 2),
        "application/json",
      )

      // 4. Fail-Fast Assertions
      // Validates status range 200-299
      expect(
        response.ok(),
        `${method} ${url} failed with status ${response.status()}`,
      ).toBeTruthy()

      // 5. Data Integrity Check
      if (response.status() !== 204) {
        expect(body, "API response missing 'data' property").toHaveProperty(
          "data",
        )

        // Array Check
        // If the expected type is an array, verify the response data is also an array
        if (Array.isArray(body.data)) {
          expect(
            body.data,
            `Expected ${method} ${url} to return an array in todos`,
          ).toBeInstanceOf(Array)
        }
      }

      return body.data as T
    })
  }

  /**
   * CRUD METHODS
   */

  // CREATE
  async create(payload: TodoPayload): Promise<Todo> {
    const response = await this.request.post(this.endpoint, { data: payload })
    return this.handleRequest<Todo>("POST", this.endpoint, response, payload)
  }

  // READ
  async getAll(): Promise<Todo[]> {
    const response = await this.request.get(this.endpoint)
    return this.handleRequest<Todo[]>("GET", this.endpoint, response)
  }

  async get(id: string): Promise<Todo> {
    const url = `${this.endpoint}/${id}`
    const response = await this.request.get(url)
    return this.handleRequest<Todo>("GET", url, response)
  }

  // UPDATE
  async update(id: string, payload: Partial<TodoPayload>): Promise<Todo> {
    const url = `${this.endpoint}/${id}`
    const response = await this.request.put(url, { data: payload })
    return this.handleRequest<Todo>("PUT", url, response, payload)
  }

  // DELETE
  async delete(id: string): Promise<void> {
    const url = `${this.endpoint}/${id}`
    const response = await this.request.delete(url)
    await this.handleRequest<void>("DELETE", url, response)
  }
}
