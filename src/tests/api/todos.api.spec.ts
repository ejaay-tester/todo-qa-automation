import { test, expect } from "../../fixtures/base.fixture"
import { TodoFactory } from "../../factories/TodoFactory"
import { Todo, CreateTodoPayload } from "../../types/todo.type"

test.describe("Todos API - CRUD", () => {
  /**
   * UPDATE TODO
   * - Method: PUT/PATCH | Endpoint: /api/todos/:id
   * - Test Type: Happy Path
   * - Flow: Create todo -> Update it -> Validate updated fields
   */
  test.only("Should update a todo and reflect changes in the full list", async ({
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

        const updatePayload = {
          ...initialPayload,
          title: "Updated Title",
          description: "Updated Description",
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
        return await todoClient.update(createdTodo._id, updatePayload)
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
        "The updated todo should exist in the full list",
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
