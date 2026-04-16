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
  private async parseResponseJson(response: APIResponse): Promise<any> {
    try {
      // Just return the JSON
      return await response.json()
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`)
    }
  }

  /**
   * CRUD METHODS
   */

  // CREATE
  async create(payload: TodoPayload): Promise<Todo> {
    // Use allure.step for technical API details
    return await allure.step(`POST /api/todos`, async () => {
      // Log what we sent
      await allure.attachment(
        "Request Payload",
        JSON.stringify(payload, null, 2),
        "application/json",
      )

      const response = await this.request.post("/api/todos", {
        data: payload,
      })

      expect(response.status(), "POST /api/todos should return 201").toBe(201)

      // Parse JSON (This happens inside the parseResponseJson helper)
      const body = await this.parseResponseJson(response)

      expect(
        body,
        "POST response should contain 'data' property",
      ).toHaveProperty("data")

      // Attach response (Evidence for the report)
      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      return body.data
    })
  }

  // READ
  async getAll(): Promise<Todo[]> {
    return await allure.step(`GET /api/todos`, async () => {
      const response = await this.request.get("/api/todos")

      expect(response.status(), "GET /api/todos should return 200").toBe(200)

      const body = await this.parseResponseJson(response)

      expect(
        body,
        "POST response should contain 'data' property",
      ).toHaveProperty("data")

      expect(
        Array.isArray(body.data),
        "Expected an array of todos",
      ).toBeTruthy()

      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      return body.data
    })
  }

  async get(id: string): Promise<Todo> {
    return await allure.step(`GET /api/todos/${id}`, async () => {
      const response = await this.request.get(`/api/todos/${id}`)

      expect(response.status(), `GET /api/todos/${id} should return 200`).toBe(
        200,
      )

      const body = await this.parseResponseJson(response)

      expect(
        body,
        "POST response should contain 'data' property",
      ).toHaveProperty("data")

      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      return body.data
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

      expect(response.status(), `PUT /api/todos/${id} should return 200`).toBe(
        200,
      )

      const body = await this.parseResponseJson(response)

      expect(
        body,
        "POST response should contain 'data' property",
      ).toHaveProperty("data")

      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      return body.data
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
