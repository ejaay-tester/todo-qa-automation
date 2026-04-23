import { expect } from "@playwright/test"
import { authTest } from "../fixtures/auth.fixture"
import { TodoClient } from "../api/TodoClient"

// Define the type for the new fixture you are adding
type TodoFixtures = {
  todoClient: TodoClient
  cleanup: string[] // This will store IDs for deletion
}

// Extend the base test to include the custom classes
export const test = authTest.extend<TodoFixtures>({
  todoClient: async ({ authenticatedRequest }, use) => {
    // authenticatedRequest comes from the AuthFixture
    const client = new TodoClient(authenticatedRequest)
    await use(client)
  },

  // Define the cleanup fixture
  cleanup: async ({ todoClient, authenticatedRequest }, use) => {
    const ids: string[] = []
    await use(ids)

    // Cleanup runs automatically AFTER the test, isolated to THIS test only
    for (const id of ids) {
      // Perform deletion
      await todoClient.delete(id).catch(() => {})

      // Verify using the raw request context
      // We use authenticatedRequest directly because it returns the raw response object
      const response = await authenticatedRequest.get(`/api/todos/${id}`)

      console.log(`[CLEANUP] ID: ${id} | Status ${response.status()}`)

      // Now 'status()' will work because 'response' is an APIResponse
      expect(
        response.status(),
        `Verify resource ${id} is no longer accessible (404)`,
      ).toBe(404)
    }
  },
})

export { expect } from "@playwright/test"
