import http from "k6/http"
import { check } from "k6"

const BASE_URL: string = __ENV.BASE_URL || "http://localhost:3000"

// ----- PUBLIC TYPES -----
// Exported - consumed by callers (todos.smoke.ts setup())
export interface UserCredentials {
  id: string
  email: string
  password: string
  name: string
}

export interface LoginResult {
  token: string
}

// ----- PRIVATE TYPES -----
// Not exported - internal HTTP response parsing only, never leave this file
interface RegisterResponseBody {
  data: {
    user: { id: string; email: string }
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface LoginResponseBody {
  data: {
    user: { id: string; email: string }
    token: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

// REGISTER USER
export function registerUser(): UserCredentials {
  const timeStamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)

  const user: Omit<UserCredentials, "id"> = {
    email: `perf_user_${timeStamp}_${randomSuffix}@yopmail.com`,
    password: `TestP@ssword_${randomSuffix}123!`,
    name: `perf_user_${timeStamp}`,
  }

  const response = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(user),
    { headers: { "Content-Type": "application/json" } },
  )

  const body = response.json() as RegisterResponseBody

  const passed = check(response, {
    "SETUP /api/auth/register: status 201": (res) => res.status === 201,
    "SETUP /api/auth/register: has user data": (res) => {
      if (res.status !== 201) return false // guard before parsing
      return body?.data?.user?.id !== undefined
    },
  })

  if (!passed) {
    throw new Error(`[REGISTER ERROR] (${response.status}): ${response.body}`)
  }

  const id = body?.data?.user?.id

  if (!id) {
    throw new Error(
      `[REGISTER ERROR] (${response.status}): User registered but no user id returned in response.`,
    )
  }

  return { ...user, id }
}

// LOGIN USER
export function login(email: string, password: string): LoginResult {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } },
  )

  const body = response.json() as LoginResponseBody

  check(response, {
    "SETUP /api/auth/login: status 200": (res) => res.status === 200,
    // Validate token shape, not just existence
    "SETUP /api/auth/login: token is string": () =>
      typeof body?.data?.token === "string" && body.data.token.length > 0,
  })

  const token = body?.data?.token

  if (!token) {
    throw new Error(
      `[AUTHENTICATION ERROR] (${response.status}): Session expired or token missing.`,
    )
  }

  return { token }
}
