import { test as authTest, expect } from "../fixtures/auth.fixture"
import { TodoClient } from "../api/TodoClient"

/**
 * TodoFixtures extends AuthTestFixtures with two additional fixtures:
 *
 * todoClient - a typed API client pre-configured with the authenticated HTTP session.
 *              Use it in tests to call todo endpoints directly without constructing
 *              request manually.
 *
 * cleanup    - an array of todo IDs created during test. Push IDs into this array
 *              as you create todos; the fixture deletes them all in parallel after
 *              the test finishes (pass or fail).
 *
 * Usage in test:
 *    const todo = await todoClient.create({ title: "Buy milk"})
 *    cleanup.push(todo.id)
 */
type TodoFixtures = {
  todoClient: TodoClient
  cleanup: string[] // This will store IDs for deletion
}

// Extend the base test to include the custom classes
const test = authTest.extend<TodoFixtures>({
  todoClient: async ({ authenticatedRequest }, use) => {
    // authenticatedRequest comes from the AuthFixture
    const client = new TodoClient(authenticatedRequest)
    await use(client)
    // No dispose - authenticatedRequest owns and disposes the underlying context
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

export { test, expect }
