import http from "k6/http"
import { check } from "k6"

const BASE_URL: string = __ENV.BASE_URL || "http://localhost:3000"

export interface UserCredentials {
  email: string
  password: string
  name: string
}

// REGISTER USER
export function registerUser(): UserCredentials {
  const timeStamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)

  const user: UserCredentials = {
    email: `perf_user_${timeStamp}_${randomSuffix}@yopmail.com`,
    password: `TestP@ssword_${randomSuffix}123!`,
    name: `perf_user_${timeStamp}`,
  }

  const response = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(user),
    { headers: { "Content-Type": "application/json" } },
  )

  const passed = check(response, {
    "setup | register: status 201": (res) => res.status === 201,
    "setup | register: has user data": (res) => {
      if (res.status !== 201) return false // guard before parsing
      const body = response.json() as {
        data: { user: { id: string; email: string } }
      }
      return body?.data?.user?.id !== undefined
    },
  })

  if (!passed) {
    throw new Error(`[REGISTER ERROR] (${response.status}): ${response.body}`)
  }

  return user
}

// LOGIN USER
export function login(email: string, password: string): string {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } },
  )

  check(response, {
    "setup | login: status 200": (res) => res.status === 200,
    // Validate token shape, not just existence
    "setup | login: token is string": (res) => {
      const body = res.json() as { data: { token: string } }
      return typeof body?.data?.token === "string" && body.data.token.length > 0
    },
  })

  const body = response.json() as { data: { token: string } }
  const token = body?.data?.token

  if (!token) {
    throw new Error(
      `[AUTHENTICATION ERROR] (${response.status}): Session expired or token missing.`,
    )
  }

  return token
}
