import { GENERATED_PASSWORD_LENGTH } from "@/lib/constants";

const CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

export function generateRandomPassword(
  length = GENERATED_PASSWORD_LENGTH,
): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}
