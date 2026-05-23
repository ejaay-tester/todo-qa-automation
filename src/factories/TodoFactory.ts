import { TodoPayload } from "../types/todo.type"
/**
 * UNIQUE DATA GENERATOR
 * Example Outputs:
 * Title: "Buy Groceries 9K2X1"
 * Description: "Task details for AF82Q"
 */
export const TodoFactory = {
  // Valid payload generator
  createTodoPayload(overrides?: Partial<TodoPayload>): TodoPayload {
    // Math.random(): generates a random decimal (e.g., 0.123456...)
    // .toString(36): converts that number to Base-36(uses 0-9 and a-z), turning the decimal
    // into string of random letters/numbers
    // .toUpperCase(): makes it look like a clean ID (e.g., A1B2C)
    // .slice(): skips the 0. at the start of the decimal and grabs exactly 5 characters
    const randomSuffix = Math.random().toString(36).toUpperCase().slice(2, 7)

    return {
      title: `Todo-${randomSuffix}`,
      description: `Desc-${randomSuffix}`,
      completed: false,
      ...overrides,
    }
  },

  // Invalid payloads for negative/validation tests
  invalidPayload: {
    missingTitle: (): TodoPayload =>
      ({
        description: "Missing title description",
        completed: false,
      }) as TodoPayload,

    emptyTitle: (): TodoPayload =>
      ({
        title: "",
        description: "Empty title description",
        completed: false,
      }) as TodoPayload,

    nullTitle: (): TodoPayload =>
      ({
        title: null,
        description: "Null title description",
        completed: false,
      }) as unknown as TodoPayload,

    whiteSpaceOnlyTitle: (): TodoPayload => ({
      title: "     ",
      description: "White spaces title description",
      completed: false,
    }),

    emptyPayload: (): TodoPayload => ({}) as unknown as TodoPayload,

    missingComplete: (): TodoPayload =>
      ({
        title: "Missing completed title",
        description: "Missing completed description",
      }) as unknown as TodoPayload,

    completedTrue: (): TodoPayload =>
      ({
        title: "Completed true title",
        description: "Completed true description",
        completed: true,
      }) as TodoPayload,
  },

  // Edge-cases payloads
  edgeCasePayload: {
    veryLongTitle: (): TodoPayload => ({
      title: "A".repeat(3000),
      description: "Very long title description",
      completed: false,
    }),

    specialCharacters: (): TodoPayload => ({
      title: "!@#$%^&*()<>?/|{}[]~`",
      description: "Special characters title description",
      completed: false,
    }),

    unicodeTitle: (): TodoPayload => ({
      title: "日本語タイトル 한국어العربية",
      description: "Unicode title description",
      completed: false,
    }),
  },
}
