import { test, expect } from "../../fixtures/auth.fixture"
import { Todo, CreateTodoPayload } from "../../types/todo.type"
import { generateUniqueString } from "../../utils/data.util"

test.describe("Todos API - CRUD", () => {
  /**
   * IDEAL TEST FLOW PATTERN
   * Every test should follow: Arrange -> Act -> Assert
   */

  /**
   * CREATE TODO
   * - Method: POST | Endpoint: /api/todos
   * - Test Type: Happy Path
   * - Assertions: 201, response contains _id, data matches payload
   */
  test("Should create a new todo", async ({ authenticatedRequest }) => {
    console.log("Creating new todo...")
    const createTodoResponse = await authenticatedRequest.post("/api/todos", {
      data: {
        title: "First todo title",
        description: "First todo description",
        completed: false,
      },
    })

    console.log("Todo Status:", createTodoResponse.status())
    expect(createTodoResponse.status()).toBe(201)

    const createTodoBody = await createTodoResponse.json()
    console.log("Todo Data:", createTodoBody)

    expect(createTodoBody.data).toHaveProperty("_id")
    expect(createTodoBody.data.title).toBe("First todo title")
  })

  /**
   * CREATE TODO
   * - Method: POST | Endpoint: /api/todos
   * - Test Type: Negative - Validation Cases
   * - Expect: 400, validation error message
   */
  test("Should fail when title is missing", async ({
    authenticatedRequest,
  }) => {})

  test("Should fail with empty payload", async ({ authenticatedRequest }) => {})

  /**
   * CREATE TODO
   * - Method: POST | Endpoint: /api/todos
   * - Test Type: Negative - Auth Cases
   * - Expect: 401 Unauthorized
   */
  test("Should fail without token", async ({ request }) => {})

  /**
   * FETCH ALL TODOS
   * - Method: GET | Endpoint: /api/todos
   * - Test Type: Happy Path
   * - Assertions: 200, array response, only user's todos
   */
  test("Should return all todos for user", async ({ authenticatedRequest }) => {
    /**
     * ARRANGE
     * Setup the test data and environment
     */
    console.log("Creating new todo...")

    const todoPayloads: CreateTodoPayload[] = []

    // 1. Generate 3 unique tasks to be used as our 'test batch'
    for (let i = 1; i <= 3; i++) {
      todoPayloads.push({
        title: generateUniqueString(`todo-${i}`),
        description: generateUniqueString(`desc-${i}`),
        completed: false,
      })
    }

    const createdTodos: Todo[] = []

    // 2. Submit the generated tasks to the database via API and save the responses
    for (const todo of todoPayloads) {
      const response = await authenticatedRequest.post("/api/todos", {
        data: todo,
      })

      // Ensure each task was successfully created (HTTP Status 201)
      expect(response.status()).toBe(201)

      const createdTodo: Todo = (await response.json()).data
      createdTodos.push(createdTodo)

      console.log(
        `Created todo: ${createdTodo.title} | ${createdTodo.description} | (${createdTodo._id}) `,
      )
    }

    /**
     * ACT
     * Execute the actual system behavior being tested
     */

    // 3. Request the full list of tasks from the database for this user
    const response = await authenticatedRequest.get("/api/todos")

    // Ensure the request was successful (HTTP Status 200)
    expect(response.status()).toBe(200)

    const body = await response.json()

    // Ensure the response body contains the expected data field
    expect(body).toHaveProperty("data")

    const fetchedTodos: Todo[] = body.data

    /**
     * ASSERT
     * Verify the results are correct (The Quality Check)
     */

    // 4. Structure Check
    // Verify we received a list/array and the count is correct
    expect(Array.isArray(fetchedTodos)).toBeTruthy()
    expect(fetchedTodos.length).toBeGreaterThanOrEqual(createdTodos.length) // Ensures no missing or extra tasks

    // 5. Data Integrity & Existence
    // "Is the data we fetch is identical to what we sent?"
    createdTodos.forEach((created) => {
      // Find the specific task in the retrieved/fetched list using its ID
      const match = fetchedTodos.find((fetched) => fetched._id === created._id)

      expect(match).toBeDefined() // Verify the tasks exists in the results
      expect(match).toMatchObject({
        // Verify Title, Description, and Status match exactly
        title: created.title,
        description: created.description,
        completed: created.completed,
      })
    })

    // 6. Ownership Check (Ensures no extra data leaked in)
    // Verify that the fetched tasks list contains only the items we just created
    const createdTodoIds = createdTodos.map((created) => created._id)
    fetchedTodos.forEach((fetched) => {
      expect(createdTodoIds).toContain(fetched._id)
    })

    console.log(`Successfully validated ${fetchedTodos.length} todos`)
  })

  /**
   * FETCH SINGLE TODO
   * - Method: GET | Endpoint: /api/todos/:id
   * - Test Type: Happy Path
   * - Flow: Create todo -> Fetch by ID -> Validate data
   */
  test("Should get a todo by ID", async ({ authenticatedRequest }) => {
    // ===== ARRANGE =====
    console.log("Creating new todo")

    const todoPayloads: CreateTodoPayload[] = []

    for (let i = 1; i <= 3; i++) {
      todoPayloads.push({
        title: generateUniqueString(`todo-${i}`),
        description: generateUniqueString(`desc-${i}`),
        completed: false,
      })
    }

    const createdTodos: Todo[] = []

    for (const todo of todoPayloads) {
      const response = await authenticatedRequest.post("/api/todos", {
        data: todo,
      })

      expect(response.status()).toBe(201)

      const body = await response.json()

      expect(body).toHaveProperty("data")
      expect(body.data._id).toBeDefined()

      const createdTodo: Todo = body.data
      createdTodos.push(createdTodo)

      console.log(`Created todo: ${createdTodo.title} (${createdTodo._id})`)
    }

    expect(createdTodos.length).toBeGreaterThanOrEqual(3)

    const targetTodo = createdTodos[2]
    const targetTodoId = targetTodo._id

    // ===== ACT =====
    const response = await authenticatedRequest.get(
      `/api/todos/${targetTodoId}`,
    )
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty("data")
    expect(body.data._id).toBeDefined()

    const fetchedTodo: Todo = body.data

    // ===== ASSERT =====
    expect(fetchedTodo._id).toBe(targetTodoId)
    expect(fetchedTodo.title).toBe(targetTodo.title)
    expect(fetchedTodo.description).toBe(targetTodo.description)
    expect(fetchedTodo.userId).toBe(targetTodo.userId)

    console.log(
      `Fetched Todo ID: ${fetchedTodo._id} | Expected Todo ID: ${targetTodoId}`,
    )
  })

  /**
   * FETCH SINGLE TODO
   * - Method: GET | Endpoint: /api/todos/:id
   * - Test Type: Negative
   * - Expect: 404
   */
  test("Should return 404 for non-existing todo", async () => {})

  /**
   * UPDATE TODO
   * - Method: PUT/PATCH | Endpoint: /api/todos/:id
   * - Test Type: Happy Path
   * - Flow: Create todo -> Update it -> Validate updated fields
   */
  test.only("Should update a todo and reflect changes in the full list", async ({
    authenticatedRequest,
  }) => {
    /**
     * ARRANGE
     * Setup the test data and environment
     */
    console.log("Creating new todo...")

    const todoPayloads: CreateTodoPayload[] = []

    // 1. Generate unique todos to be used for update todo
    for (let i = 1; i <= 3; i++) {
      todoPayloads.push({
        title: generateUniqueString(`todo-${i}`),
        description: generateUniqueString(`desc-${i}`),
        completed: false,
      })
    }

    const todos: Todo[] = []

    // 2. Submit generated todos to the database via API POST method and save the responses
    for (const todo of todoPayloads) {
      const response = await authenticatedRequest.post("/api/todos", {
        data: todo,
      })

      // Ensure each todo was successfully created (HTTP Status 201)
      expect(response.status()).toBe(201)

      const body = await response.json()
      const createdTodo: Todo = body.data
      todos.push(createdTodo)

      console.log(
        `Created todo: ${createdTodo._id} | ${createdTodo.title} | ${createdTodo.description} | ${createdTodo.completed}`,
      )
    }
    expect(todos.length).toBeGreaterThanOrEqual(todoPayloads.length)

    const targetTodoId = todos[0]._id
    const updatedTodoPayload = {
      title: generateUniqueString(`updated-title`),
      description: generateUniqueString(`updated-desc`),
      completed: true,
    }

    /**
     * ACT
     * Update the created todo
     */

    // 3. Update the specific todo details of the user
    const updateResponse = await authenticatedRequest.put(
      `/api/todos/${targetTodoId}`,
      {
        data: updatedTodoPayload,
      },
    )

    // Ensure the request was successful (HTTP Status 200)
    expect(updateResponse.status()).toBe(200)

    const updateBody = await updateResponse.json()
    expect(updateBody).toHaveProperty("data")

    const updatedTodo = updateBody.data

    console.log(
      `Updated todo: ${updatedTodo._id} | ${updatedTodo.title} | ${updatedTodo.description} | ${updatedTodo.completed}`,
    )

    /**
     * ASSERT  & VERIFY LIST
     */

    // 4. Ensure that the _id of the updatedTodo was match the targetTodoId
    expect(updatedTodo._id).toBe(targetTodoId)

    // 5. Verify the response, if it match the updated payload
    expect(updatedTodo).toMatchObject(updatedTodoPayload)

    // 6. Verify the updated todo list
    const listResponse = await authenticatedRequest.get("/api/todos")
    expect(listResponse.status()).toBe(200)

    const listBody = await listResponse.json()
    expect(listBody).toHaveProperty("data")
    const allTodos = listBody.data

    // 7. Verify the record is correct within the list
    const updatedTodoInList = allTodos.find(
      (todo: Todo) => todo._id === targetTodoId,
    )

    // Check if the updated todo was exist on the full todo list
    expect(
      updatedTodoInList,
      "Updated todo should exist in the full list",
    ).toBeDefined()

    // Ensure that the updated todo details was the same on the update payload
    expect(updatedTodoInList).toMatchObject(updatedTodoPayload)

    // Ensure we did not lose the other todos
    expect(allTodos.length).toBeGreaterThanOrEqual(todos.length)

    // Log the entire list to see all records
    console.log("--- Full Todo List ---")
    allTodos.forEach((todo: Todo, index: number) => {
      console.log(
        `[${index}] - ${todo._id} | ${todo.title} | ${todo.description} | ${todo.completed} `,
      )
    })

    console.log(`Successfully updated and verified todo: ${targetTodoId}`)
  })

  /**
   * UPDATE TODO
   * - Method: PUT/PATCH | Endpoint: /api/todos/:id
   * - Test Type: Negative
   * - Expect: 404
   */
  test("Should fail updating non-existing todo", async () => {})

  /**
   * UPDATE TODO
   * - Method: PUT/PATCH | Endpoint: /api/todos/:id
   * - Test Type: Negative
   * - Expect: 403 Forbidden
   */
  test("Should not allow updating another user's todo", async () => {})

  /**
   * DELETE TODO
   * - Method: DELETE | Endpoint: /api/todos/:id
   * - Test Type: Happy Path
   * - Flow: Create todo -> Delete it -> Verify deletion (GET -> 404)
   */
  test("Should delete a todo", async () => {})

  /**
   * DELETE TODO
   * - Method: DELETE | Endpoint: /api/todos/:id
   * - Test Type: Negative
   * - Expect: 404 and 403
   */
  test("Should fail deleting non-existing todo", async () => {})
  test("Should not delete another user's todo", async () => {})

  /**
   * Test Type: Cross-User Security Test | Data Isolation
   * Flow: Create User A -> Create Todo | Create User B -> Fetch Todos
   * Assert: User B does NOT see User A data
   */
  test("User A should NOT see User B todos", async () => {})

  /**
   * Test Type: Edge Cases
   * Large Input, Special Characters, Boolean Logic
   */
  test("Should handle very long title", async () => {})
  test("Should accept special characters", async () => {})
  test("Should toggle completed status", async () => {})
})
