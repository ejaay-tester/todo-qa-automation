export type Todo = {
  _id: string
  title: string
  description?: string
  completed: boolean
  priority?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export type TodoPayload = {
  title: string
  description?: string
  completed: boolean
}
