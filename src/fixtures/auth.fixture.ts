// Import Playwright's base test engine
//  and the request utility for API calls
import { test as base, request, APIRequestContext } from "@playwright/test"

// Define the type/shape of auth fixture
// so TS knows what authenticatedRequest is
type AuthFixture = {
  registeredUser: {
    id: string
    email: string
    password: string
  }

  authenticatedRequest: APIRequestContext
}

// Extend the base test to include the custom 'authenticatedRequest' fixture
const test = base.extend<AuthFixture>({
  /**
   * FIXTURE 1: USER REGISTRATION
   * - Handles user registration
   * - Creates a fresh user every time
   * - DOES NOT return token
   */
  registeredUser: async ({ request }, use) => {
    const userData = {
      email: `testuser_${Date.now()}@yopmail.com`,
      password: "TestP@ssword123",
      name: `testuser_${Date.now()}`,
    }

    // Call the function to get the actual user object
    // const userData = generateUser()

    console.log("Registering user...")

    let response
    try {
      response = await request.post("/api/auth/register", {
        data: userData,
      })
    } catch (error) {
      throw new Error(
        `[Connection Failure] - API is unreachable. Check if the server is running. \n${error}`,
      )
    }

    if (!response.ok()) {
      const status = response.status()
      const errorBody = await response.text()
      const errorMessage = `❌ API Error: POST /api/auth/register
      Status: ${status}
      Response: ${errorBody.substring(0, 500)}`.trim()

      if (status >= 500) {
        throw new Error(
          `[SERVER ERROR] (5xx): The API is likely down or crashing.\n${errorMessage}`,
        )
      } else if (status === 429) {
        throw new Error(
          `[ERROR] (4xx): Too many request. Try again in a few minutes.\n${errorMessage}`,
        )
      }
    }

    console.log(`✅ Success user registration (${response.status()})`)

    // Get the data once
    const body = await response.json()

    // Log the actual data
    console.log(`Registered user: ${body.data.user.email}`)

    const id = body.data.user.id
    const email = userData.email
    const password = userData.password

    // Use the properties from the created userData object
    // MUST match the Type/Shape above exactly
    await use({
      id,
      email,
      password,
    })
  },

  // ==========  ==========

  /**
   * FIXTURE 2: AUTHENTICATED REQUEST
   * - Logs in using registeredUser
   * - Injects token into request context
   */
  authenticatedRequest: async ({ registeredUser, request: apiClient }, use) => {
    console.log("User logging in...")

    let response
    try {
      response = await apiClient.post("/api/auth/login", {
        data: {
          email: registeredUser.email,
          password: registeredUser.password,
        },
      })
    } catch (error) {
      throw new Error(
        `[Connection Failure] - Login failed because server is down. \n${error}`,
      )
    }

    if (!response.ok()) {
      const status = response.status()
      const errorBody = await response.text()
      const errorMessage = `❌ API Error: POST /api/auth/login
      Status: ${status}
      Response: ${errorBody.substring(0, 500)}`.trim()

      if (status >= 500) {
        throw new Error(
          `[SERVER ERROR] (5xx): The API is likely down or crashing.\n${errorMessage}`,
        )
      } else if (status === 429) {
        throw new Error(
          `[ERROR] (4xx): Too many request. Try again in a few minutes.\n${errorMessage}`,
        )
      }
    }
    console.log(`✅ Successful user login (${response.status()})`)

    const body = await response.json()

    console.log(`Logged-in user: ${body.data.user.email}`)

    const token = body.data.token

    if (!token) {
      throw new Error(
        `[AUTHENTICATION ERROR] (${response.status()}): Session expired or token missing.`,
      )
    }

    const authenticatedRequestContext = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })

    // 'use' acts like a bridge; it passes the 'authenticatedRequestContext' into the test block
    // The test runs while this line is 'hanging'
    await use(authenticatedRequestContext)

    // After the test finishes (Pass or Fail), close the context to free up memory
    await authenticatedRequestContext.dispose()
  },
})

export const authTest = test
// Re-export 'expect' so we can import everything from this one file in the test
export { expect } from "@playwright/test"
