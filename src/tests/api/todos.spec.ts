import { test, expect } from "../../fixtures/base.fixture"
import { TodoFactory } from "../../factories/TodoFactory"

test.describe("Todos API", () => {
  /**
   * CREATE TODO
   * - Method: POST | Endpoint: /api/todos
   */
  test.describe("POST /api/todos", () => {
    // Happy Path
    // Assertions: 201, response contains _id, matches payload
    test("creates todo with valid data", async ({ todoClient, cleanup }) => {
      // Generate payload once at the start of the test scope
      const payload = TodoFactory.createTodoPayload()

      /**
       * ARRANGE & ACT
       * We combine these because in API testing, 'creating' is the action
       */
      const createdTodo =
        await test.step("Act: Create todo via API", async () => {
          // The API Client should handle .json() and .status() checks internally

          const todo = await todoClient.create(payload)
          cleanup.push(todo._id)
          return todo
        })

      /**
       * ASSERT
       * Focus on validating the BUSINESS logic, not the technical details
       */
      await test.step("Assert: Verify the created todo matches payload", async () => {
        // Verify the unique identifier exists
        expect(
          createdTodo._id,
          `[REQUIREMENT] API response must contain a valid unique identifier (_id)`,
        ).toBeDefined()

        // Verify all sent data matches what was returned
        // MatchObject is pro-level: it ignores extra fields like 'createdAt
        expect(
          createdTodo,
          `[REQUIREMENT] Created todo (${createdTodo._id}) must match the sent payload`,
        ).toMatchObject(payload)

        // Verify specific state
        expect(
          createdTodo.completed,
          `[REQUIREMENT] New todo (${createdTodo._id}) must default to 'false' completed status`,
        ).toBe(false)
      })
    })

    // Negative - Validation Cases
    // Expect: 400, Validation error message
    // test("fail todo creation when title is missing", async () => {})
    // test("fail todo creation with empty payload", async () => {})

    // Negative - Auth Cases
    // Expect: 401 Unauthorized
    // test("fail todo creation without token", async () => {})

    // Edge Cases
    // Large input, special characters, boolean logic
    // test("accepts very long title", async () => {})
    // test("accepts special characters", async () => {})
    // test("toggle completed status", async () => {})
  })

  /**
   * FETCH ALL TODOS
   * - Method: GET | Endpoint: /api/todos
   */

  test.describe("GET /api/todos", () => {
    // Happy Path
    // Assertions: 200, array response, only user's todos
    test("returns list of all user todos", async ({ todoClient, cleanup }) => {
      // Arrange: Create multiple todos and capture them in an array[]
      const createdTodos =
        await test.step("Setup: Seed 3 todos for user", async () => {
          const todoList = []

          for (let i = 0; i < 3; i++) {
            const payload = TodoFactory.createTodoPayload()
            const todo = await todoClient.create(payload)
            todoList.push(todo)
            cleanup.push(todo._id)
          }
          return todoList
        })

      // Act: Fetch todos of the user
      const fetchedAllTodos =
        await test.step("Act: Fetch todos of the user", async () => {
          return await todoClient.getAll()
        })

      // Assert: Verify integrity
      await test.step("Assert: Verify data integrity", async () => {
        // Place logs at the start of assertion

        // Perform the verification logic
        for (const created of createdTodos) {
          const found = fetchedAllTodos.find((todo) => todo._id === created._id)

          expect(
            found,
            `[REQUIREMENT] Created todo (${created._id}) must persist in the collection fetch`,
          ).toBeDefined()

          expect(
            found,
            `[REQUIREMENT] Data integrity check - Todo (${created._id}) properties must match the original payload`,
          ).toMatchObject(created)
        }

        expect(
          fetchedAllTodos.length,
          "[REQUIREMENT] Total count must include all newly created items",
        ).toBeGreaterThanOrEqual(createdTodos.length)
      })
    })

    // Happy Path
    // Flow: Create Todo -> Fetch by ID -> Validate data
    // test("returns todo by ID", async () => {})

    // Negative
    // Expect: 404
    // test("returns 404 for non-existing todo", async () => {})

    // Cross-User Security Test | Data Isolation
    // Flow: Create User A -> Create Todo -> Create User B -> Fetch Todos
    // Assert: User B does NOT see User A todos
    // test("User A should  NOT see User B todos, vice versa", async () => {})
  })

  /**
   * UPDATE TODO
   * - Method: PUT/PATCH | Endpoint: /api/todos/:id
   */
  test.describe("PUT /api/todos/:id", () => {
    // Happy Path
    // Flow: Create Todo -> Update -> Validate updated fields
    test("updates todo and reflect changes in full list", async ({
      todoClient,
      cleanup,
    }) => {
      // ARRANGE: Setup the data and environment
      const { createdTodo, updatePayload } =
        await test.step("Setup: Create todo/s", async () => {
          const initialPayload = TodoFactory.createTodoPayload()

          const createdTodo = await todoClient.create(initialPayload)
          cleanup.push(createdTodo._id)

          const updatePayload = {
            ...initialPayload,
            title: "Updated Title 123",
            description: "Updated Description 456",
            completed: true,
          }
          return { createdTodo, updatePayload }
        })

      // ACT: Update the specific todo
      const updatedTodo =
        await test.step("Act: Update specific todo", async () => {
          // Pass the update payload directly
          const updatedTodo = await todoClient.update(
            createdTodo._id,
            updatePayload,
          )

          return updatedTodo
        })

      //ASSERT: Verify the updated todo list
      await test.step("Assert: Verify update in response and full list", async () => {
        // Get data and log first - always ensures you see the state before it crash
        const allTodos = await todoClient.getAll()

        // Extra Safety: Check that the ID returned in the update response
        // matches the ID that was originally created
        expect(
          updatedTodo._id,
          `[REQUIREMENT] ID Consistency Check - Response ID (${updatedTodo._id}) must match Origin ID (${createdTodo._id})`,
        ).toBe(createdTodo._id)

        // Check Payload: Check if the content (title, desc, etc.) matches
        expect(
          updatedTodo,
          `[REQUIREMENT] Updated todo (${updatedTodo._id}) must match the sent updated payload`,
        ).toMatchObject(updatePayload)

        // Verify persistence in the global list
        const updatedTodoInList = allTodos.find(
          (todo) => todo._id === createdTodo._id,
        )

        // Check if the updated todo exists on the full todo list
        expect(
          updatedTodoInList,
          `[REQUIREMENT] Persistence Check - Updated todo (${createdTodo._id}) must persist in the collection`,
        ).toBeDefined()

        // Ensure that the updated todo details are the same on the update payload
        expect(
          updatedTodoInList,
          `[REQUIREMENT] Consistency Check - Global list must reflect updated data for todo (${createdTodo._id})`,
        ).toMatchObject(updatePayload)
      })
    })

    // Negative
    // Expect: 404
    // test("fail updating non-existing todo", async () => {})
    // test("fail updating another user's todo", async () => {})
  })

  /**
   * DELETE TODO
   * - Method: DELETE | Endpoint: /api/todos/:id
   */
  test.describe("DELETE /api/todos/:id", () => {
    // Happy Path
    // Flow: Create Todo -> Delete -> Verify deletion (HTTP 204)
    // test("removes specific todo of a user", async () => {})
    // Negative
    // Expect 404 and 403
    // test("fail deleting non-existing todo", async () => {})
    // test("fail deleting another user's todo", async () => {})
  })
})
