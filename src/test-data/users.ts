export function generateUser() {
  return {
    email: `testuser_${Date.now()}@yopmail.com`,
    password: "TestP@ssword123",
    name: `testuser_${Date.now()}`,
  }
}
