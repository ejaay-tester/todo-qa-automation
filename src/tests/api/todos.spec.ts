import { test, expect } from "../../fixtures/base.fixture"
import { TodoFactory } from "../../factories/TodoFactory"
import { Todo } from "../../types/todo.type"

test.describe("Todos API - CRUD", () => {
  test.describe("POST /api/todos", () => {
    /**
     * CREATE TODO
     * - Method: POST | Endpoint: /api/
     * - Test Type: Happy Path
     * - Assertions: 201, response contains _id, data matches payload
     */
    test("POST /todos > creates todo with valid data", async ({
      todoClient,
    }) => {
      // Generate payload once at the start of the test scope
      const payload = TodoFactory.createTodoPayload()

      /**
       * ARRANGE & ACT
       * We combine these because in API testing, 'creating' is the action
       */
      const createdTodo =
        await test.step("Act: Create todo via API", async () => {
          // The API Client should handle .json() and .status() checks internally
          console.log("Creating new todo...")
          return await todoClient.create(payload)
        })

      console.log(
        `Created todo: ${createdTodo._id} - ${createdTodo.title} | ${createdTodo.description} | ${createdTodo.completed}`,
      )

      /**
       * ASSERT
       * Focus on validating the BUSINESS logic, not the technical details
       */
      await test.step("Assert: Verify the created todo matches payload", async () => {
        // Verify the unique identifier exists
        expect(
          createdTodo._id,
          "API response missing unique identifier (_id)",
        ).toBeDefined()

        // Verify all sent data matches what was returned
        // MatchObject is pro-level: it ignores extra fields like 'createdAt
        expect(
          createdTodo,
          "Created resource data mismatch: Response does not match sent payload",
        ).toMatchObject(payload)

        // Verify specific state
        expect(
          createdTodo.completed,
          "New todo state mismatch: Default 'completed' status must be false",
        ).toBe(false)
      })
    })
  })

  /**
   * FETCH ALL TODOS
   * - Method: GET | Endpoint: /api/todos/
   * - Test Type: Happy Path
   * - Assertions: 200, array response, only user's todos
   */
  test("GET /todos > returns list of all user todos", async ({
    todoClient,
  }) => {
    // Arrange: Create multiple todos and capture them in an array[]
    const createdTodos =
      await test.step("Setup: Seed 3 todos for user", async () => {
        const todoList = []

        console.log("Creating new todo...")
        for (let i = 0; i < 3; i++) {
          const payload = TodoFactory.createTodoPayload()
          const todo = await todoClient.create(payload)
          todoList.push(todo)

          console.log(
            `Created todo: ${todo._id} - ${todo.title} | ${todo.description} | ${todo.completed}`,
          )
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
      console.log("--- Full Todo List ---")
      fetchedAllTodos.forEach((todo, index) => {
        console.log(
          `[${index}] - ${todo._id} | ${todo.title} | ${todo.description} | ${todo.completed}`,
        )
      })

      // Perform the verification logic
      for (const created of createdTodos) {
        const found = fetchedAllTodos.find((todo) => todo._id === created._id)

        expect(
          found,
          `Persistence error: Todo [${created._id}] not found in collection fetch`,
        ).toBeDefined()
        expect(
          found,
          `Data integrity error: Collection item [${created._id}] properties do not match original`,
        ).toMatchObject(created)
      }

      expect(
        fetchedAllTodos.length,
        "Collection count mismatch: Total todos is less than the number of items created",
      ).toBeGreaterThanOrEqual(createdTodos.length)
    })
  })

  /**
   * UPDATE TODO
   * - Method: PUT/PATCH | Endpoint: /api/todos/:id
   * - Test Type: Happy Path
   * - Flow: Create todo -> Update it -> Validate updated fields
   */
  test("PUT /todos/:id > updates todo and reflect changes in full list", async ({
    todoClient,
  }) => {
    // ARRANGE: Setup the data and environment
    const { createdTodo, updatePayload } =
      await test.step("Setup: Create todo/s", async () => {
        const initialPayload = TodoFactory.createTodoPayload()

        console.log("Creating new todo...")
        const createdTodo = await todoClient.create(initialPayload)
        console.log(
          `Created Todo: ${createdTodo._id} - ${createdTodo.title} | ${createdTodo.description} | ${createdTodo.completed}`,
        )

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
        console.log("Updating todo...")
        const updatedTodo = await todoClient.update(
          createdTodo._id,
          updatePayload,
        )
        console.log(
          `Updated Todo: ${updatedTodo._id} - ${updatedTodo.title} | ${updatedTodo.description} | ${updatedTodo.completed}`,
        )
        return updatedTodo
      })

    //ASSERT: Verify the updated todo list
    await test.step("Assert: Verify update in response and full list", async () => {
      // Get data and log first - always ensures you see the state before it crash
      const allTodos = await todoClient.getAll()
      console.log("Fetching all todos...")
      console.log("--- Full Todo List ---")
      allTodos.forEach((todo: Todo, index: number) => {
        console.log(
          `[${index}] - ${todo._id} | ${todo.title} | ${todo.description} | ${todo.completed} `,
        )
      })

      // Extra Safety: Check that the ID returned in the update response
      // matches the ID that was originally created
      expect(
        updatedTodo._id,
        "ID Mismatch: The update response returned a different ID than expected",
      ).toBe(createdTodo._id)

      // Check Payload: Check if the content (title, desc, etc.) matches
      expect(
        updatedTodo,
        "Update failure: API response does not reflect requested changes",
      ).toMatchObject(updatePayload)

      // Verify persistence in the global list
      const updatedTodoInList = allTodos.find(
        (todo: Todo) => todo._id === createdTodo._id,
      )

      // Check if the updated todo exists on the full todo list
      expect(
        updatedTodoInList,
        `Persistence error: Updated todo [${createdTodo._id}] missing from collection`,
      ).toBeDefined()

      // Ensure that the updated todo details are the same on the update payload
      expect(
        updatedTodoInList,
        "Data integrity error: Global list does not reflect the specific todo update",
      ).toMatchObject(updatePayload)
    })
  })
})
