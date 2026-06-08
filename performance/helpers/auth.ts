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

  const user: UserCredentials = {
    email: `perf_${timeStamp}@yopmail.com`,
    password: `TestP@ssword123`,
    name: `perfuse_${timeStamp}`,
  }

  const response = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(user),
    { headers: { "Content-Type": "application/json" } },
  )

  check(response, {
    "setup | register: status 201": (res) => res.status === 201,
  })

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
