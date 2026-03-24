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
    token: string
  }

  authenticatedRequest: APIRequestContext
}

// Extend the base test to include the custom 'authenticatedRequest' fixture
export const test = base.extend<AuthFixture>({
  /**
   * FIXTURE 1: USER REGISTRATION
   * HANDLES USER REGISTRATION
   * CREATES A FRESH USER EVERY TIME
   */
  registeredUser: async ({}, use) => {
    const unauthenticatedRequest = await request.newContext()

    const generateUser = (ts = Date.now()) => ({
      email: `testuser_${ts}@yopmail.com`,
      password: "TestP@ssword123",
      name: `testuser_${ts}`,
    })

    // Call the function to get the actual user object
    const userData = generateUser()

    console.log("Registering user...")

    const registerResponse = await unauthenticatedRequest.post(
      "/api/auth/register",
      {
        data: userData,
      },
    )
    if (registerResponse.status() !== 201) {
      throw new Error(`Registration failed: ${registerResponse.status()}`)
    }
    console.log("Register Status:", registerResponse.status())

    // Get the data once
    const responseBody = await registerResponse.json()

    // Log the actual data
    console.log("Register Data:", responseBody)

    // Destructure the id and token from the data object
    const {
      data: { _id: id, email, token },
    } = responseBody

    if (!token) {
      throw new Error("No token returned on registration!")
    }

    // Use the properties from the created userData object
    // MUST match the Type/Shape above exactly
    await use({
      id,
      email,
      password: userData.password,
      token,
    })

    // Optional: Add logic here to delete the user after the test if your API supports it
    await unauthenticatedRequest.dispose()
  },

  // ==========  ==========

  /**
   * FIXTURE 2: USER LOGIN
   * HANDLES USER LOGIN
   * THE FIXTURE FUNCTION: {} IS FOR DEPENDENCY FIXTURE
   * 'use' IS THE CALLBACK TO THE TEST
   */
  authenticatedRequest: async ({ registeredUser }, use) => {
    // Create a NEW request context that ALWAYS includes this token
    const authenticatedRequestContext = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${registeredUser.token}`,
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
