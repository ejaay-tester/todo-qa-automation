// import { test, expect } from "@playwright/test"
import { test, expect } from "../fixtures/auth.fixture"

test.describe("Todo API Tests", () => {
  // Create a new todo
  test("Should create a new todo", async ({ request }) => {
    // Step 1: Register a new user
    // Method: POST
    // Endpoint: api/auth/register

    console.log("Registering user...")
    const registerResponse = await request.post(
      "http://localhost:3000/api/auth/register",
      {
        data: {
          email: `testuser14@yopmail.com`, // Unique email using timestamp
          password: `TestP@ssword123`,
        },
      },
    )

    console.log("Register Status:", registerResponse.status())
    expect(registerResponse.status()).toBe(201)

    const registerData = await registerResponse.json()
    console.log("Register Data:", registerData)
    const token = registerData.data.token

    // Step 2: Create a new todo with authentication
    // Method: POST
    // Endpoint: api/todos
    console.log("Creating todo...")
    const response = await request.post("http://localhost:3000/api/todos", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: "First todo title",
        description: "first todo description",
        completed: "false",
      },
    })
    console.log("Todo Status:", response.status())
    expect(response.status()).toBe(201)

    const todoResponse = await response.json()
    console.log("Todo Data:", todoResponse)
    // const todo = todoResponse.data

    expect(todoResponse.data).toHaveProperty("_id")
    expect(todoResponse.data.title).toBe("First todo title")
  })

  test.only("Should get all todos", async ({ authenticatedRequest }) => {
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
