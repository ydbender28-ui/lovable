import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || "0".repeat(64),
  "hex"
);

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decrypt(data: string): string {
  const [ivHex, tagHex, encrypted] = data.split(":");
  if (!ivHex || !tagHex || !encrypted) return data;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return data;
  }
}

export function isEncrypted(data: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]{32}:/.test(data);
}
