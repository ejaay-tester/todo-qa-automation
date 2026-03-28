import { test, expect } from "../../fixtures/auth.fixture"
import { Todo, CreateTodoPayload } from "../../types/todo.type"

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
    // ===== ARRANGE =====
    console.log("Creating new todo...")

    const todoPayloads: CreateTodoPayload[] = [
      {
        title: "Register new user",
        description: "register new user description",
        completed: false,
      },
      {
        title: "Login new user",
        description: "login new user description",
        completed: false,
      },
      {
        title: "Create new todos for the user",
        completed: false,
      },
      {
        title: "Fetch all todos of the user",
        completed: false,
      },
    ]

    const createdTodos: Todo[] = []

    for (const payload of todoPayloads) {
      const response = await authenticatedRequest.post("/api/todos", {
        data: payload,
      })

      expect(response.status()).toBe(201)

      const createdTodo: Todo = (await response.json()).data
      createdTodos.push(createdTodo)

      console.log(`Created todo: ${createdTodo.title} (${createdTodo._id})`)
    }

    // ===== ACT =====
    const response = await authenticatedRequest.get("/api/todos")
    expect(response.status()).toBe(200)

    const fetchedTodos: Todo[] = (await response.json()).data

    // ===== ASSERT =====
    // Validate Structure
    expect(Array.isArray(fetchedTodos)).toBeTruthy()
    expect(fetchedTodos.length).toBeGreaterThan(0)

    // Precompute IDs (clean + efficient)
    const createdTodoIds = createdTodos.map((todo) => todo._id)
    const fetchedTodoIds = fetchedTodos.map((todo) => todo._id)

    // Validate existence
    createdTodoIds.forEach((id) => {
      expect(fetchedTodoIds).toContain(id)
    })

    // Validate data integrity
    createdTodos.forEach((created) => {
      const match = fetchedTodos.find((todo) => todo._id === created._id)

      expect(match).toBeTruthy()
      expect(match?.title).toBe(created.title)
    })

    // Validate ownership
    const userId = createdTodos[0].userId
    fetchedTodos.forEach((todo) => {
      expect(todo.userId).toBe(userId)
    })

    console.log(`Fetched ${fetchedTodos.length} todos`)
  })

  /**
   * FETCH SINGLE TODO
   * - Method: GET | Endpoint: /api/todos/:id
   * - Test Type: Happy Path
   * - Flow: Create todo -> Fetch by ID -> Validate data
   */
  test.only("Should get a todo by ID", async ({ authenticatedRequest }) => {
    // ===== ARRANGE =====
    console.log("Creating new todo")

    const payloads: CreateTodoPayload[] = [
      {
        title: "First todo title",
        description: "First todo description",
        completed: false,
      },
      {
        title: "Second todo title",
        description: "Second todo description",
        completed: false,
      },
      {
        title: "Third todo title",
        description: "Third todo description",
        completed: false,
      },
    ]

    const createdTodos: Todo[] = []

    for (const payload of payloads) {
      const response = await authenticatedRequest.post("/api/todos", {
        data: payload,
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
  test("Should update a todo", async () => {})

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
