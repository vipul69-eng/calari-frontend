/* eslint-disable @typescript-eslint/no-explicit-any */
export interface User {
  id?: string
  email: string
  plan: "basic" | "pro" | "creator"
  profile: Record<string, any> // JSONB type
}
