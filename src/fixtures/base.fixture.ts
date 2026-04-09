import { authTest } from "../fixtures/auth.fixture"
import { TodoClient } from "../api/TodoClient"

// Define the type for the new fixture you are adding
type TodoFixtures = {
  todoClient: TodoClient
}

// Extend the base test to include the custom classes
export const test = authTest.extend<TodoFixtures>({
  todoClient: async ({ authenticatedRequest }, use) => {
    // authenticatedRequest comes from the AuthFixture
    const client = new TodoClient(authenticatedRequest)
    await use(client)
  },
})

export { expect } from "@playwright/test"
