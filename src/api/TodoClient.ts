import { APIRequestContext, APIResponse, expect } from "@playwright/test"
import * as allure from "allure-js-commons"
import { Todo, TodoPayload } from "../types/todo.type"

export class TodoClient {
  constructor(private request: APIRequestContext) {}

  /**
   * PRIVATE HELPER:
   * Helper is for the logic
   * This method handles the .json() parsing (safe json parsing)
   * Parsing the full response
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
   * Main methods are for assertions
   * and reporting
   */

  // CREATE
  async create(payload: TodoPayload): Promise<Todo> {
    // Use allure.step for technical API details
    return await allure.step(`POST /api/todos`, async () => {
      // Attach Request (Always safe)
      await allure.attachment(
        "Request Payload",
        JSON.stringify(payload, null, 2),
        "application/json",
      )

      const response = await this.request.post("/api/todos", {
        data: payload,
      })

      // Get the Body but don't validate yet
      // Parse JSON (This happens inside the parseResponseJson helper)
      const body = await this.parseResponseJson(response)

      // Attach Response (Evidence for the report)
      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      // Aseert Status (FAIL-FAST #1)
      // If status is 500, test stops here. You have the attachment above to see why
      expect(response.status(), "POST /api/todos should return 201").toBe(201)

      // Validate Data Structure (FAIL-FAST #2)
      // Now check if the 'data' property exists
      expect(
        body,
        "POST response should contain 'data' property",
      ).toHaveProperty("data")

      return body.data
    })
  }

  // READ
  async getAll(): Promise<Todo[]> {
    return await allure.step(`GET /api/todos`, async () => {
      const response = await this.request.get("/api/todos")

      const body = await this.parseResponseJson(response)
      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      expect(response.status(), "GET /api/todos should return 200").toBe(200)

      expect(
        body,
        "GET response should contain 'data' property",
      ).toHaveProperty("data")

      expect(
        Array.isArray(body.data),
        "Expected an array of todos",
      ).toBeTruthy()

      return body.data
    })
  }

  async get(id: string): Promise<Todo> {
    return await allure.step(`GET /api/todos/${id}`, async () => {
      const response = await this.request.get(`/api/todos/${id}`)

      const body = await this.parseResponseJson(response)
      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      expect(response.status(), `GET /api/todos/${id} should return 200`).toBe(
        200,
      )

      expect(
        body,
        "GET response should contain 'data' property",
      ).toHaveProperty("data")

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

      const body = await this.parseResponseJson(response)
      await allure.attachment(
        "Response Body",
        JSON.stringify(body.data, null, 2),
        "application/json",
      )

      expect(response.status(), `PUT /api/todos/${id} should return 200`).toBe(
        200,
      )

      expect(
        body,
        "PUT response should contain 'data' property",
      ).toHaveProperty("data")

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
