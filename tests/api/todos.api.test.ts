import { test, expect } from "@playwright/test"

test.describe("Todo API Tests", () => {
  // Create a new todo
  test("Should create a new todo", async ({ request }) => {
    // Step 1: Register a new user

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
})
