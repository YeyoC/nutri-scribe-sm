import { z } from "zod";

// ── Input sanitization ──
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, "") // strip angle brackets (XSS)
    .replace(/javascript:/gi, "") // strip JS protocol
    .replace(/on\w+\s*=/gi, "") // strip inline event handlers
    .trim();
}

// ── Validation schemas ──
export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(1, "Contraseña requerida").max(128),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128)
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[a-z]/, "Incluye al menos una minúscula")
    .regex(/[0-9]/, "Incluye al menos un número")
    .regex(/[^A-Za-z0-9]/, "Incluye al menos un carácter especial (!@#$...)"),
  displayName: z
    .string()
    .trim()
    .min(2, "Nombre muy corto")
    .max(100, "Nombre muy largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-']+$/, "Nombre contiene caracteres no válidos"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const aiTextSchema = z
  .string()
  .trim()
  .min(3, "Escribe al menos 3 caracteres")
  .max(1000, "Máximo 1000 caracteres")
  .transform(sanitizeText);

export const searchSchema = z
  .string()
  .trim()
  .max(200, "Búsqueda muy larga")
  .transform(sanitizeText);

// ── Simple client-side rate limiter ──
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    return false; // rate limited
  }

  valid.push(now);
  rateLimitMap.set(key, valid);
  return true;
}

// ── Password strength indicator ──
export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Débil", color: "bg-destructive" };
  if (score <= 4) return { score, label: "Media", color: "bg-yellow-500" };
  return { score, label: "Fuerte", color: "bg-green-500" };
}
