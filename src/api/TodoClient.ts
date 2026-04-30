import { APIRequestContext, APIResponse, expect } from "@playwright/test"
import * as allure from "allure-js-commons"
import { Todo, TodoPayload } from "../types/todo.type"

export class TodoClient {
  private readonly endpoint = "/api/todos"

  constructor(private request: APIRequestContext) {}

  /**
   * PRIVATE HELPER
   * This handles low-level
   * network/connection failures
   * before the API even responds
   */
  private async executeRequest(
    requestFn: () => Promise<APIResponse>,
  ): Promise<APIResponse> {
    try {
      return await requestFn()
    } catch (error) {
      throw new Error(
        `[NETWORK FAILURE] - The API is unreachable. Check if the server is running. \n` +
          `• Check if your server is running.\n` +
          `• Check if your URL is correct.\n` +
          `• Raw Error: ${error}`,
      )
    }
  }

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

      // Global Error Handler
      if (!response.ok()) {
        const status = response.status()
        const errorBody = await response.text() // Get raw text in case it's not JSON

        const errorMessage = `❌ API Error: ${method} ${url}
        Status: ${status}
        Response: ${errorBody.substring(0, 500)}`.trim()

        if (status >= 500) {
          throw new Error(
            `[SERVER ERROR] (5xx): The API is likely down or crashing.\n${errorMessage}`,
          )
        } else if (status === 401 || status === 403) {
          throw new Error(
            `[AUTHENTICATION ERROR] (4xx): Session expired or permissions missing.\n${errorMessage}`,
          )
        }

        // Fallback for other non-ok statuses
        expect(response.ok(), errorMessage).toBeTruthy()
      }

      // 2. Parse Response (Safety check for empty body like 204 No Content)
      const body =
        response.status() !== 204
          ? await response.json().catch((error) => {
              throw new Error(`Failed to parse JSON: (${error})`)
            })
          : {}

      // 3. Attach Response Body
      if (response.status() !== 204) {
        await allure.attachment(
          "Response Body",
          JSON.stringify(body, null, 2),
          "application/json",
        )
      } else {
        await allure.attachment(
          "Response Body",
          "No Content (204 Successful Deletion)",
          "text/plain",
        )
      }

      // 4. Fail-Fast Assertions

      // Validates status range 200-299
      // We pass the whole response to expect(response).toBeOK()
      // If it fails, Playwright automatically generates a professional error message
      // including the status code and URL
      expect(
        response,
        `Verify ${method} ${url} returns success status`,
      ).toBeOK()

      // Data Integrity Check
      if (response.status() !== 204) {
        expect(
          body,
          `Check if ${method} response contains 'data' property`,
        ).toHaveProperty("data")

        // Array Check
        // If the expected type is an array, verify the response data is also an array
        if (Array.isArray(body.data)) {
          expect(
            body.data,
            `Verify 'data' is an array for ${method} collection`,
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
    // Wrap the request in safeCall
    const response = await this.executeRequest(() =>
      this.request.post(this.endpoint, { data: payload }),
    )

    return this.handleRequest<Todo>("POST", this.endpoint, response, payload)
  }

  // READ
  async getAll(): Promise<Todo[]> {
    const response = await this.executeRequest(() =>
      this.request.get(this.endpoint),
    )
    return this.handleRequest<Todo[]>("GET", this.endpoint, response)
  }

  async get(id: string, failOnNotFound = true): Promise<Todo | null> {
    const url = `${this.endpoint}/${id}`
    const response = await this.executeRequest(() => this.request.get(url))

    // Additional logic for DELETE tests
    if (!failOnNotFound && response.status() === 404) return null

    return this.handleRequest<Todo>("GET", url, response)
  }

  // UPDATE
  async update(id: string, payload: Partial<TodoPayload>): Promise<Todo> {
    const url = `${this.endpoint}/${id}`
    const response = await this.executeRequest(() =>
      this.request.put(url, { data: payload }),
    )
    return this.handleRequest<Todo>("PUT", url, response, payload)
  }

  // DELETE
  async delete(id: string): Promise<void> {
    const url = `${this.endpoint}/${id}`
    const response = await this.executeRequest(() => this.request.delete(url))
    await this.handleRequest<void>("DELETE", url, response)
  }
}
