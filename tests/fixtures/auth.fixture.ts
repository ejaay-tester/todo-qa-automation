// Import Playwright's base test engine
//  and the request utility for API calls
import { APIRequestContext, test as base, request } from "@playwright/test"

// Define the type/shape of auth fixture
// so TS knows what authenticatedRequest is
type AuthFixture = {
  authenticatedRequest: APIRequestContext
}

// Extend the base test to include the custom 'authenticatedRequest' fixture
export const test = base.extend<AuthFixture>({
  // The fixture function: {} is for dependency fixture
  // 'use' is the callback to the test
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
