// import { test, expect } from "@playwright/test"
import { test, expect } from "../fixtures/auth.fixture"

test.describe("Todo API Tests", () => {
  // Create a new todo
  test.only("Should create a new todo", async ({ registeredUser, request }) => {
    console.log("Creating new todo...")
    const createTodoResponse = await request.post(
      "http://localhost:3000/api/todos",
      {
        headers: {
          Authorization: `Bearer ${registeredUser.token}`,
        },
        data: {
          title: "Second todo title",
          description: "Second todo description",
          completed: false,
        },
      },
    )

    console.log("Todo Status:", createTodoResponse.status())
    expect(createTodoResponse.status()).toBe(201)

    const createTodoBody = await createTodoResponse.json()
    console.log("Todo Data:", createTodoBody)
    // const createdTodoData = createTodoBody.data

    expect(createTodoBody.data).toHaveProperty("_id")
    expect(createTodoBody.data.title).toBe("Second todo title")
  })

  test("Should get all todos", async ({ authenticatedRequest }) => {
    // Fetch all todos with auth token
    // Method: POST
    // Endpoint: api/todos
    const response = await authenticatedRequest.get(
      "http://localhost:3000/api/todos",
    )

    expect(response.status()).toBe(200)
    const responseBody = await response.json()

    const todos = responseBody.data
    expect(Array.isArray(todos)).toBeTruthy()
    expect(todos.length).toBeGreaterThan(0)

    console.log(todos)
  })
})
