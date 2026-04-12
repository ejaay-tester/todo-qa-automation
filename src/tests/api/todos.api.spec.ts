import { test, expect } from "../../fixtures/base.fixture"
import { TodoFactory } from "../../factories/TodoFactory"
import { Todo } from "../../types/todo.type"

test.describe("Todos API - CRUD", () => {
  /**
   * CREATE TODO
   * - Method: POST | Endpoint: /api/
   * - Test Type: Happy Path
   * - Assertions: 201, response contains _id, data matches payload
   */
  test("Should create todo", async ({ todoClient }) => {
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
        "Response should contain a valid _id",
      ).toBeDefined()

      // Verify all sent data matches what was returned
      // MatchObject is pro-level: it ignores extra fields like 'createdAt
      expect(
        createdTodo,
        "Returned todo should match the initial payload",
      ).toMatchObject(payload)

      // Verify specific state
      expect(createdTodo.completed).toBe(false)
    })
  })

  /**
   * FETCH ALL TODOS
   * - Method: GET | Endpoint: /api/todos/
   * - Test Type: Happy Path
   * - Assertions: 200, array response, only user's todos
   */
  test.only("Should return all todos for user", async ({ todoClient }) => {
    // Arrange: Create multiple todos and capture them in an array[]
    const createdTodos =
      await test.step("Setup: Create multiple todos", async () => {
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
          `Created todo [${created._id}] should be in the list`,
        ).toBeDefined()
        expect(found).toMatchObject(created)
      }

      expect(fetchedAllTodos.length).toBeGreaterThanOrEqual(createdTodos.length)
    })
  })

  /**
   * UPDATE TODO
   * - Method: PUT/PATCH | Endpoint: /api/todos/:id
   * - Test Type: Happy Path
   * - Flow: Create todo -> Update it -> Validate updated fields
   */
  test("Should update a todo and reflect changes in the full list", async ({
    todoClient,
  }) => {
    /**
     * ARRANGE
     * Setup the test data and environment
     */
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

    /**
     * ACT
     * Update the specific todo
     */
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

    /**
     * ASSERT
     * Verify the updated todo list
     */
    await test.step("Assert: Verify update in response and full list", async () => {
      // Ensure that the _id of the updatedTodo was match the updatePayload
      expect(
        updatedTodo,
        "Response should match the updated payload",
      ).toMatchObject(updatePayload)

      // Fetch full list using the client
      const allTodos = await todoClient.getAll()
      const updatedTodoInList = allTodos.find(
        (todo: Todo) => todo._id === createdTodo._id,
      )

      // Check if the updated todo was exist on the full todo list
      expect(
        updatedTodoInList,
        `Todo with ID ${createdTodo._id} should exist in the full list`,
      ).toBeDefined()

      // Ensure that the updated todo details was the same on the update payload
      expect(
        updatedTodoInList,
        "The updated todo should match the updated payload values",
      ).toMatchObject(updatePayload)

      // Ensure we did not lose the other todos
      // expect(
      //   allTodos.length,
      //   "Total todos count should remain consistent after update",
      // ).toBeGreaterThanOrEqual(createdTodo.length)

      // Log the entire list to see all records
      console.log("Fetching todos...")
      console.log("--- Full Todo List ---")
      allTodos.forEach((todo: Todo, index: number) => {
        console.log(
          `[${index}] - ${todo._id} | ${todo.title} | ${todo.description} | ${todo.completed} `,
        )
      })
    })
  })
})
