export interface Todo {
  _id: string
  title: string
  description?: string
  completed: boolean
  priority?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export type CreateTodoPayload = {
  title: string
  description?: string
  completed: boolean
}
