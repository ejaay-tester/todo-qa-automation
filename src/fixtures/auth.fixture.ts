// Import Playwright's base test engine
//  and the request utility for API calls
import {
  test as base,
  request as apiRequest,
  APIRequestContext,
} from "@playwright/test"
import { generateUser } from "../test-data/users"

// ========== TYPES ==========
/**
 * Define the type/shape of auth fixture
 * so TypeScript knows what are the
 * registeredUser, authenticatedRequest,
 */
type AuthFixture = {
  registeredUser: {
    id: string
    email: string
    password: string
  }
  authenticatedRequest: APIRequestContext
  unauthenticatedRequest: APIRequestContext
  expiredTokenRequest: APIRequestContext
}

// ========== SHARED HELPER ==========
/**
 * Centralized response guard.
 * Throws a descriptive error for any non-ok response
 * so fixtures fail-fast instead of crashing later
 * with confusing stack traces.
 */
async function assertResponse(
  response: Awaited<ReturnType<APIRequestContext["post"]>>,
  endpoint: string,
): Promise<void> {
  if (response.ok()) return
  const status = response.status()
  const body = await response.text()
  const excerpt = body.substring(0, 500)
  const base = `❌ API Error: ${endpoint}\nStatus: ${status}\nResponse: ${excerpt}`

  if (status >= 500) throw new Error(`[SERVER ERROR 5xx] ${base}`)
  if (status === 429) throw new Error(`[RATE LIMITED 429] ${base}`)
  throw new Error(`[CLIENT ERROR ${status}] ${base}`) // catch-all - no silent fall-through
}

// ========== FIXTURES ==========
// Extend the base test to include the custom 'authenticatedRequest' fixture
const test = base.extend<AuthFixture>({
  /**
   * FIXTURE 1: USER REGISTRATION
   * Handles user registration
   * Creates a fresh user every time
   * DOES NOT return token
   */
  registeredUser: async ({ request }, use) => {
    const userData = generateUser()

    console.log("Registering user...")

    let response
    try {
      response = await request.post("/api/auth/register", {
        data: userData,
      })
    } catch (error) {
      throw new Error(
        `[CONNECTION FAILURE] POST /api/auth/register - API is unreachable, check if the server is running. \n${error}`,
      )
    }

    await assertResponse(response, "POST /api/auth/register")

    // Get the data once
    const body = await response.json()

    // Log the actual data
    console.log(`✅ Registered user: ${body.data.user.email}`)

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

    // Teardown - runs after the test finishes (pass or fail)
    console.log(`🧹 Deleting test user: ${email}`)
    await request
      .delete(`api/users/${id}`)
      .catch((err) =>
        console.warn(`⚠️ Could not delete test user ${email}: ${err}`),
      )
  },

  // ==========  ==========

  /**
   * FIXTURE 2: AUTHENTICATED REQUEST
   * Logs in using registeredUser
   * Injects token into request context
   */
  authenticatedRequest: async ({ registeredUser, request }, use) => {
    console.log("Logging in...")

    let response
    try {
      response = await request.post("/api/auth/login", {
        data: {
          email: registeredUser.email,
          password: registeredUser.password,
        },
      })
    } catch (error) {
      throw new Error(
        `[CONNECTION FAILURE] POST /api/auth/login - API is unreachable, check if the server is running. \n${error}`,
      )
    }

    await assertResponse(response, "POST /api/auth/login")

    const body = await response.json()
    const token: string | undefined = body.data?.token

    // Token check moved before success log - a missing token is a failure
    if (!token) {
      throw new Error(
        `[AUTHENTICATION ERROR] (${response.status()}): Session expired or token missing.`,
      )
    }

    console.log(`✅ Logged-in user: ${body.data.user.email}`)

    const authenticatedRequestContext = await apiRequest.newContext({
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
