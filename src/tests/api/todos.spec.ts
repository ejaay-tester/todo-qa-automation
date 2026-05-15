import { test, expect } from "../../fixtures/base.fixture"
import { TodoFactory } from "../../factories/TodoFactory"
import { Todo, TodoPayload } from "../../types/todo.type"
import { RawErrorResponse } from "../../api/TodoClient"
import { create } from "node:domain"
import { todo } from "node:test"

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

          const todo = (await todoClient.create(payload)) as Todo
          cleanup.push(todo._id)
          return todo
        })

      /**
       * ASSERT
       * Focus on validating the BUSINESS logic, not the technical details
       */
      await test.step("Assert: Verify the created todo matches payload", async () => {
        expect(
          createdTodo._id,
          `[REQUIREMENT] Response must contain a valid unique identifier (_id)`,
        ).toBeDefined()

        // Verify all sent data matches what was returned
        // MatchObject is pro-level: it ignores extra fields like 'createdAt
        expect(
          createdTodo,
          `[REQUIREMENT] Created todo (${createdTodo._id}) must match the sent payload`,
        ).toMatchObject(payload)

        expect(
          createdTodo.completed,
          `[REQUIREMENT] New todo (${createdTodo._id}) must default completed to false`,
        ).toBe(false)

        expect(
          createdTodo.createdAt,
          "[REQUIREMENT] Response must contain createdAt timestamp",
        ).toBeDefined()

        expect(
          createdTodo.updatedAt,
          "[REQUIREMENT] Response must contain updatedAt timestamp",
        ).toBeDefined()
      })
    })

    // Negative - Validation
    // Expect 400, Validation error message
    test("fails when title is missing", async ({ todoClient }) => {
      const response =
        await test.step("Act: Create todo with missing title", async () => {
          return todoClient.create(
            TodoFactory.invalidPayload.missingTitle(),
            false,
          ) as Promise<RawErrorResponse>
        })

      await test.step("Assert: Verify 400 status and error message", async () => {
        expect(
          response.status,
          "[REQUIREMENT] Missing title must return 400 HTTP Status",
        ).toBe(400)

        expect(
          response.body.message,
          "[REQUIREMENT] Response must contain a validation error message",
        ).toBeDefined()

        expect(
          response.body.success,
          "[REQUIREMENT] Success flag must be false",
        ).toBe(false)
      })
    })

    test("fails when title is empty string", async ({ todoClient }) => {
      const response =
        await test.step("Act: Create todo with empty title", async () => {
          return todoClient.create(
            TodoFactory.invalidPayload.emptyTitle(),
            false,
          ) as Promise<RawErrorResponse>
        })

      await test.step("Assert: Verify 400 status and error message", async () => {
        expect(
          response.status,
          "[REQUIREMENT] Empty title must return 400 HTTP Status",
        ).toBe(400)

        expect(
          response.body.message,
          "[REQUIREMENT] Response must contain a validation error message",
        ).toBeDefined()

        expect(
          response.body.success,
          "[REQUIREMENT] Success flag must be false",
        ).toBe(false)
      })
    })

    test("fails when title is null", async ({ todoClient }) => {
      const response =
        await test.step("Act: Create todo with null title ", async () => {
          return todoClient.create(
            TodoFactory.invalidPayload.nullTitle(),
            false,
          ) as Promise<RawErrorResponse>
        })

      await test.step("Assert: Verify 400 status and error message", async () => {
        expect(
          response.status,
          "[REQUIREMENT] Null title must return 400 HTTP Status",
        ).toBe(400)
        expect(
          response.body.message,
          "[REQUIREMENT] Response must contain a validation error message",
        ).toBeDefined()
        expect(
          response.body.success,
          "[REQUIREMENT] Success flag must be false",
        ).toBe(false)
      })
    })

    test("fails when whitespace-only title is sent", async ({ todoClient }) => {
      const response =
        await test.step("Act: Create todo with whitespace-only title", async () => {
          return todoClient.create(
            TodoFactory.invalidPayload.whiteSpaceOnlyTitle(),
            false,
          ) as Promise<RawErrorResponse>
        })

      await test.step("Assert: Verify 400 status and error message", async () => {
        expect(
          response.status,
          "[REQUIREMENT] Whitespace-only title must return 400 HTTP Status",
        ).toBe(400)
        expect(
          response.body.message,
          "[REQUIREMENT] Response must contain a validation error message",
        ).toBeDefined()
        expect(
          response.body.success,
          "[REQUIREMENT] Success flag must be false",
        ).toBe(false)
      })
    })

    test("fails when payload is empty", async ({ todoClient }) => {
      const response =
        await test.step("Act: Create todo without payload", async () => {
          return todoClient.create(
            {} as TodoPayload,
            false,
          ) as Promise<RawErrorResponse>
        })

      console.log(response.body.message)
      console.log(response.body.success)
      await test.step("Assert: Verify 400 status and error message", async () => {
        expect(
          response.status,
          "[REQUIREMENT] Empty payload must return 400 HTTP Status",
        ).toBe(400)

        expect(
          response.body.message,
          "[REQUIREMENT] Response must contain a validation error message",
        ).toBeDefined()

        expect(
          response.body.success,
          "[REQUIREMENT] Success flag must be false",
        ).toBe(false)
      })
    })

    // Negative - Auth Cases
    // Expect: 401 Unauthorized
    // test("fails without auth token", async () => {})
    // test("fails with invalid/expired token", async () => {})

    // Edge Cases
    // Large input, special characters, boolean logic
    // test("accepts very long title", async () => {})
    // test("accepts special characters in title", async () => {})
    // test("accepts unicode characters in title", async () => {})
    // test("creates todo with completed status set to true", async () => {})
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
          // Generate an array of 3 payload objects
          const payloads = Array.from({ length: 3 }, () =>
            TodoFactory.createTodoPayload(),
          )

          // Map those payloads to API creation promises
          const todos = payloads.map(
            (payload) => todoClient.create(payload) as Promise<Todo>,
          )

          // Wait for all creations to finish
          const results = await Promise.all(todos)

          // Track IDs for cleanup
          results.forEach((todo) => cleanup.push(todo._id))

          return results
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

          const createdTodo = (await todoClient.create(initialPayload)) as Todo
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
          const updatedTodo = (await todoClient.update(
            createdTodo._id,
            updatePayload,
          )) as Todo

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
    test("removes specific todo of a user", async ({ todoClient }) => {
      // ARRANGE: Setup the data
      const createdTodo = await test.step("Setup: Create todo", async () => {
        const payload = TodoFactory.createTodoPayload()
        return (await todoClient.create(payload)) as Todo
      })

      // ACT: Delete specific todo
      await test.step("Act: Delete specific todo", async () => {
        await todoClient.delete(createdTodo._id)
      })

      // ASSERT: Verify the todo is actually gone
      await test.step("Assert: Verify todo is no longer exists", async () => {
        const response = await todoClient.get(createdTodo._id, false)

        expect(
          response,
          `[REQUIREMENT] Deleted todo should not persist in the collection/database`,
        ).toBeNull()
      })
    })

    //   // Negative
    //   // Expect 404 and 403
    //   // test("fail deleting non-existing todo", async () => {})
    //   // test("fail deleting another user's todo", async () => {})
    // })
  })
})
