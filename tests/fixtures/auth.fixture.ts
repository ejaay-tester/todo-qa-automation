// Import Playwright's base test engine
//  and the request utility for API calls
import {
  test as base,
  expect,
  request,
  APIRequestContext,
} from "@playwright/test"

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
    const apiContext = await request.newContext()

    const uniqueName = `testuser_${Date.now()}`
    const uniqueEmail = `${uniqueName}@yopmail.com` // Unique timestamped email
    const password = `TestP@ssw0rd123`

    const registerPayload = {
      email: uniqueEmail,
      password: password,
      name: uniqueName,
    }

    console.log("Registering user...")

    const registerResponse = await apiContext.post(
      "http://localhost:3000/api/auth/register",
      {
        data: registerPayload,
      },
    )

    console.log("Register Status:", registerResponse.status())
    expect(registerResponse.status()).toBe(201)

    const registerBody = await registerResponse.json()
    console.log("Register Data:", registerBody)

    const token = registerBody.data.token

    if (!token) {
      throw new Error("No token returned on registration!")
    }

    // Pass the USER details to the test - MUST match the Type/Shape above exactly
    await use({
      id: registerBody.data._id,
      email: uniqueEmail,
      password: password,
      token: token,
    })

    // Optional: Add logic here to delete the user after the test if your API supports it
    await apiContext.dispose()
  },

  // ==========  ==========

  /**
   * FIXTURE 2: USER LOGIN
   * HANDLES USER LOGIN
   * THE FIXTURE FUNCTION: {} IS FOR DEPENDENCY FIXTURE
   * 'use' IS THE CALLBACK TO THE TEST
   */
  authenticatedRequest: async ({}, use) => {
    // 1. Create a temporary, unauthenticated request context to handle the login
    const loginContext = await request.newContext()

    // 2. Send a POST request to the login endpoint with hardcoded credentials
    const loginResponse = await loginContext.post(
      "http://localhost:3000/api/auth/login",
      {
        data: {
          email: "testuser1@yopmail.com",
          password: "TestP@ssword123",
        },
      },
    )

    // 3. Parse the JSON response body to extract the data object
    const { data } = await loginResponse.json()

    // 4. Extract the JWT token from the nested data property
    const token = data.token

    // 5. Create a NEW request context that ALWAYS includes this token
    const authContext = await request.newContext({
      // 6. Automatically inject the Bearer token into every request made via this context
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })

    // 7. 'use' acts like a bridge; it passes the 'authContext' into the test block
    // The test runs while this line is 'hanging'
    await use(authContext)

    // 8. After the test finishes (Pass or Fail), close the context to free up memory
    await authContext.dispose()
  },
})

// Re-export 'expect' so we can import everything from this one file in the test
export { expect } from "@playwright/test"
