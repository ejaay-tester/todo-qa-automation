/**
 * UNIQUE DATA GENERATOR
 * Example Outputs:
 * Title: "Buy Groceries 9K2X1"
 * Description: "Task details for AF82Q"
 */
export const generateUniqueString = (prefix: string): string => {
  // Math.random(): generates a random decimal (e.g., 0.123456...)
  // .toString(36): converts that number to Base-36(uses 0-9 and a-z), turning the decimal
  // into string of random letters/numbers
  // .toUpperCase(): makes it look like a clean ID (e.g., A1B2C)
  // .slice(): skips the 0. at the start of the decimal and grabs exactly 5 characters
  const randomSuffix = Math.random().toString(36).toUpperCase().slice(2, 7)
  return `${prefix}-${randomSuffix}`
}

// export function generateUniqueString(prefix: string) {
//   return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
// }
