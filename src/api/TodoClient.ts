import { APIRequestContext, APIResponse, expect } from "@playwright/test"
import * as allure from "allure-js-commons"
import { Todo, TodoPayload } from "../types/todo.type"

export class TodoClient {
  constructor(private request: APIRequestContext) {}

  /**
   * PRIVATE HELPER: Safe JSON Parsing
   * This method handles both the .json() parsing
   * and the validation of the data structure (checking for the data property)
   * in one reusable place
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
    // Use allure.step for technical API details
    return await allure.step(`POST /api/todos`, async () => {
      // Attach the request/response for easy debugging in Allure
      await allure.attachment(
        "Request Payload",
        JSON.stringify(payload, null, 2),
        "application/json",
      )

      const response = await this.request.post("/api/todos", {
        data: payload,
      })

      // Parse and Attach Response before asserting
      // This ensures if status is 500, we see the error body in Allure
      const data = await this.parseResponseJson<Todo>(response, "POST")
      await allure.attachment(
        "Response Body",
        JSON.stringify(data, null, 2),
        "application/json",
      )

      // Assert last
      expect(response.status(), "POST /api/todos should return 201").toBe(201)

      return data
    })
  }

  // READ
  async getAll(): Promise<Todo[]> {
    return await allure.step(`GET /api/todos`, async () => {
      const response = await this.request.get("/api/todos")

      const data = await this.parseResponseJson<Todo[]>(response, "GET ALL")
      await allure.attachment(
        "Response Body",
        JSON.stringify(data, null, 2),
        "application/json",
      )

      expect(response.status(), "GET /api/todos should return 200").toBe(200)
      expect(Array.isArray(data), "Expected an array of todos").toBeTruthy()

      return data
    })
  }

  async get(id: string): Promise<Todo> {
    return await allure.step(`GET /api/todos/${id}`, async () => {
      const response = await this.request.get(`/api/todos/${id}`)

      const data = await this.parseResponseJson<Todo>(response, "GET")
      await allure.attachment(
        "Response Body",
        JSON.stringify(data, null, 2),
        "application/json",
      )

      expect(response.status(), `GET /api/todos/${id} should return 200`).toBe(
        200,
      )

      return data
    })
  }

  // UPDATE
  async update(id: string, payload: TodoPayload): Promise<Todo> {
    return await allure.step(`PUT /api/todos/${id}`, async () => {
      await allure.attachment(
        "Request Payload",
        JSON.stringify(payload, null, 2),
        "application/json",
      )

      const response = await this.request.put(`/api/todos/${id}`, {
        data: payload,
      })

      const data = await this.parseResponseJson<Todo>(response, "PUT")
      await allure.attachment(
        "Response Body",
        JSON.stringify(data, null, 2),
        "application/json",
      )

      expect(response.status(), `PUT /api/todos/${id} should return 200`).toBe(
        200,
      )

      return data
    })
  }

  // DELETE
  async delete(id: string): Promise<void> {
    return await allure.step(`DELETE /api/todos/${id}`, async () => {
      const response = await this.request.delete(`/api/todos/${id}`)

      expect(
        response.status(),
        `DELETE /api/todos/${id} should return 204`,
      ).toBe(204)
    })
  }
}
