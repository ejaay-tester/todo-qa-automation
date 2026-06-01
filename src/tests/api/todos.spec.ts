import { test, expect } from "../../fixtures/base.fixture"
import { TodoFactory } from "../../factories/TodoFactory"
import { Todo, TodoPayload } from "../../types/todo.type"
import { RawErrorResponse } from "../../api/TodoClient"

test.describe("Todos API", () => {
  /**
   * CREATE TODO
   * - Method: POST | Endpoint: /api/todos
   */
  test.describe("POST /api/todos", () => {
    // Happy Path
    // Assertions: 201, response contains _id, matches payload
    test("should create a todo and return all required fields @smoke", async ({
      todoClient,
      cleanup,
    }) => {
      // Generate payload once at the start of the test scope
      const payload = TodoFactory.createTodoPayload()

      const todo = await test.step("Act: Create todo via API", async () => {
        // The API Client should handle .json() and .status() checks internally
        const created = (await todoClient.create(payload)) as Todo
        cleanup.push(created._id)
        return created
      })

      /**
       * ASSERT
       * Focus on validating the BUSINESS logic, not the technical details
       */
      await test.step("Assert: Verify the created todo matches payload", async () => {
        expect(
          todo._id,
          `[REQUIREMENT] Response must contain a valid unique identifier (_id)`,
        ).toBeDefined()

        // Verify all sent data matches what was returned
        // MatchObject is pro-level: it ignores extra fields like 'createdAt
        expect(
          todo,
          `[REQUIREMENT] Created todo (${todo._id}) must match the sent payload`,
        ).toMatchObject(payload)

        expect(
          todo.completed,
          `[REQUIREMENT] New todo (${todo._id}) must default completed to false`,
        ).toBe(false)

        expect(
          todo.createdAt,
          "[REQUIREMENT] Response must contain createdAt timestamp",
        ).toBeDefined()

        expect(
          todo.updatedAt,
          "[REQUIREMENT] Response must contain updatedAt timestamp",
        ).toBeDefined()
      })
    })

    // Negative - Validation
    // Expect 400, Validation error message
    test("should return 400 when title is missing @smoke", async ({
      todoClient,
    }) => {
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

    test("should return 400 when title is an empty string @smoke", async ({
      todoClient,
    }) => {
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

    test("should return 400 when title is null @smoke", async ({
      todoClient,
    }) => {
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

    test("should return 400 when title contains only whitespace @smoke", async ({
      todoClient,
    }) => {
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

    test("should return 400 when payload is empty @smoke", async ({
      todoClient,
    }) => {
      const response =
        await test.step("Act: Create todo without payload", async () => {
          return todoClient.create(
            {} as TodoPayload,
            false,
          ) as Promise<RawErrorResponse>
        })

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
    test("should return 401 when Authorization header is missing @smoke", async ({
      unauthenticatedRequest,
    }) => {
      const payload = TodoFactory.createTodoPayload()

      const response =
        await test.step("Act: Create todo without a token", async () => {
          return unauthenticatedRequest.post("/api/todos", {
            data: payload as TodoPayload,
          })
        })

      await test.step("Assert: Verify 401 status and error message", async () => {
        const body = await response.json()

        expect(
          response.status(),
          "[REQUIREMENT] No authorization token must return 401 HTTP Status",
        ).toBe(401)

        expect(
          body.message,
          "[REQUIREMENT] Response must contain a validation error message",
        ).toBeDefined()

        expect(body.success, "[REQUIREMENT] Success flag must be false").toBe(
          false,
        )
      })
    })

    test("should return 401 when token is invalid or expired @smoke", async ({
      expiredTokenRequest,
    }) => {
      const payload = TodoFactory.createTodoPayload()

      const response =
        await test.step("Act: Create todo with invalid/expired token", async () => {
          return expiredTokenRequest.post("/api/todos", {
            data: payload as TodoPayload,
          })
        })

      await test.step("Assert: Verify 401 status and error message", async () => {
        const body = await response.json()

        expect(
          response.status(),
          "[REQUIREMENT] Invalid/expired token must return 401 HTTP Status",
        ).toBe(401)

        expect(
          body.message,
          "[REQUIREMENT] Response must contain a validation error message",
        ).toBeDefined()

        expect(body.success, "[REQUIREMENT] Success flag must be false").toBe(
          false,
        )
      })
    })

    // Edge Cases
    // Large input, special characters, boolean logic
    test("should persist a title at maximum length without truncation @smoke", async ({
      todoClient,
      cleanup,
    }) => {
      // ARRANGE
      const payload = TodoFactory.edgeCasePayload.veryLongTitle()

      // ACT
      const todo =
        await test.step("Act: Create todo with very long title", async () => {
          const created = (await todoClient.create(payload)) as Todo
          cleanup.push(created._id)
          return created
        })

      // ASSERT
      await test.step("Assert: Verify todo was created and title persisted", async () => {
        expect(
          todo._id,
          "[REQUIREMENT] Response must contain a valid _id",
        ).toBeDefined()

        expect(
          todo.title,
          "[REQUIREMENT] Very long title must be stored as is",
        ).toBe(payload.title)

        expect(
          todo.title.length,
          "[REQUIREMENT] Title length must match input length",
        ).toBe(3000)
      })
    })

    test("should store and return special characters exactly as sent @smoke", async ({
      todoClient,
      cleanup,
    }) => {
      // ARRANGE
      const payload = TodoFactory.edgeCasePayload.specialCharacters()

      // ACT
      const todo =
        await test.step("Act: Create todo with special characters in title", async () => {
          const created = (await todoClient.create(payload)) as Todo
          cleanup.push(created._id)
          return created
        })

      await test.step("Assert: Verify special characters are preserved", async () => {
        expect(
          todo._id,
          "[REQUIREMENT] Response must contain a valid _id",
        ).toBeDefined()

        expect(
          todo.title,
          "[REQUIREMENT] Special characters must be stored and returned as is",
        ).toBe(payload.title)
      })
    })

    test("should store and return unicode characters exactly as sent @smoke", async ({
      todoClient,
      cleanup,
    }) => {
      // ARRANGE
      const payload = TodoFactory.edgeCasePayload.unicodeTitle()

      // ACT
      const todo =
        await test.step("Act: Create todo with unicode characters in title", async () => {
          const created = (await todoClient.create(payload)) as Todo
          cleanup.push(created._id)
          return created
        })

      // ASSERT
      await test.step("Assert: Verify unicode characters are preserved", async () => {
        expect(
          todo._id,
          "[REQUIREMENT] Response must contain a valid _id",
        ).toBeDefined()

        expect(
          todo.title,
          "[REQUIREMENT] Unicode characters must be stored and returned as is",
        ).toBe(payload.title)
      })
    })

    test("should accept and persist completed: true on creation @smoke", async ({
      todoClient,
      cleanup,
    }) => {
      // ARRANGE
      const payload = TodoFactory.edgeCasePayload.completedTrue()

      // ACT
      const todo =
        await test.step("Act: Create todo with completed set to true", async () => {
          const created = (await todoClient.create(payload)) as Todo
          cleanup.push(created._id)
          return created
        })

      // ASSERT
      await test.step("Assert: Verify completed true is accepted and persisted", async () => {
        expect(
          todo._id,
          "[REQUIREMENT] Response must contain a valid _id",
        ).toBeDefined()

        expect(
          todo.completed,
          "[REQUIREMENT] Completed true must be stored and returned as true",
        ).toBe(true)
      })
    })
  })

  /**
   * FETCH ALL TODOS
   * - Method: GET | Endpoint: /api/todos
   */

  test.describe("GET /api/todos", () => {
    // Happy Path
    // Assertions: 200, array response, only user's todos
    test("should return only the authenticated user's todos @smoke", async ({
      todoClient,
      cleanup,
    }) => {
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
    test("should persist updated fields in both response and full list @smoke", async ({
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
    test("should delete the todo and return 404 on subsequent fetch @smoke", async ({
      todoClient,
      cleanup,
    }) => {
      // ARRANGE: Setup the data
      const createdTodo = await test.step("Setup: Create todo", async () => {
        const payload = TodoFactory.createTodoPayload()

        const created = await todoClient.create(payload)
        const todo = created as Todo

        cleanup.push(todo._id) // Safety net, registered todo_id to the cleanup fixture before delete attempt

        return todo
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
