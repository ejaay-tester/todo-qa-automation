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
  cleanup: async ({ todoClient }, use) => {
    const ids: string[] = []
    await use(ids)

    if (ids.length > 0) {
      // Fire all deletions at once
      const results = await Promise.allSettled(
        ids.map((id) => todoClient.delete(id)),
      )

      // Log if any specific deletion failed
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `[CLEANUP ERROR] ID ${ids[index]} failed: `,
            result.reason,
          )
        }
      })

      console.log(
        `[CLEANUP COMPLETED] Attempted parallel deletion of ${ids.length} items.`,
      )

      expect(
        results.length,
        `Deleted todos: (${results.length}) | Created Todos: (${ids.length})`,
      ).toBe(ids.length)
    }
  },
})

export { expect } from "@playwright/test"
