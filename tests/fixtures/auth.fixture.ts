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
export const test = base.extend<AuthFixture>({
  /**
   * FIXTURE 1: USER REGISTRATION
   * - Handles user registration
   * - Creates a fresh user every time
   * - DOES NOT return token
   */
  registeredUser: async ({ request }, use) => {
    const generateUser = (ts = Date.now()) => ({
      email: `testuser_${ts}@yopmail.com`,
      password: "TestP@ssword123",
      name: `testuser_${ts}`,
    })

    // Call the function to get the actual user object
    const userData = generateUser()

    console.log("Registering user...")

    const registerResponse = await request.post("/api/auth/register", {
      data: userData,
    })

    if (!registerResponse.ok()) {
      throw new Error(`Registration failed: ${registerResponse.status()}`)
    }

    console.log("Register Status:", registerResponse.status())

    // Get the data once
    const responseBody = await registerResponse.json()

    // Log the actual data
    console.log("Register Data:", responseBody)

    const id = responseBody.data.user.id || responseBody.data.user._id

    // Use the properties from the created userData object
    // MUST match the Type/Shape above exactly
    await use({
      id,
      email: userData.email,
      password: userData.password,
    })
  },

  // ==========  ==========

  /**
   * FIXTURE 2: AUTHENTICATED REQUEST
   * - Logs in using registeredUser
   * - Injects token into request context
   */
  authenticatedRequest: async ({ registeredUser, request: apiClient }, use) => {
    console.log("Loggin in user...")

    const loginResponse = await apiClient.post("/api/auth/login", {
      data: {
        email: registeredUser.email,
        password: registeredUser.password,
      },
    })

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${loginResponse.status()}`)
    }

    const loginBody = await loginResponse.json()

    const token = loginBody?.data?.token

    if (!token) {
      throw new Error("No token returned from login!")
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

// Re-export 'expect' so we can import everything from this one file in the test
export { expect } from "@playwright/test"
