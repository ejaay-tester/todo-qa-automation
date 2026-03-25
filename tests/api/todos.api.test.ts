// import { test, expect } from "@playwright/test"
import { test, expect } from "../fixtures/auth.fixture"

test.describe("Todo API Tests", () => {
  /**
   * CREATE TODO
   * Method: POST
   * Endpoint: /api/todos
   */
  test.only("Should create a new todo", async ({ authenticatedRequest }) => {
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

  test("Should get all todos", async ({ authenticatedRequest }) => {
    // Fetch all todos with auth token
    // Method: POST
    // Endpoint: api/todos
    const response = await authenticatedRequest.get("/api/todos")

    expect(response.status()).toBe(200)
    const responseBody = await response.json()

    const todos = responseBody.data
    expect(Array.isArray(todos)).toBeTruthy()
    expect(todos.length).toBeGreaterThan(0)

    console.log(todos)
  })
})
