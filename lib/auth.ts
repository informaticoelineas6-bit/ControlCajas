import bcryptjs from "bcryptjs";
import { NextRequest } from "next/server";
import { Usuario } from "./constants";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcryptjs.compare(password, hashedPassword);
}

// JWT helper functions using Web Crypto API (edge-runtime compatible)

type TokenPayload = Pick<Usuario, "nombre" | "rol">;

function b64urlEncode(str: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlFromBuffer(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(str: string): string {
  const bytes = Uint8Array.from(
    atob(str.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );
  return new TextDecoder().decode(bytes);
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signToken(usuario: TokenPayload): Promise<string> {
  const header = b64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64urlEncode(
    JSON.stringify({
      nombre: usuario.nombre,
      rol: usuario.rol,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  );
  const data = `${header}.${payload}`;
  const key = await hmacKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return `${data}.${b64urlFromBuffer(sig)}`;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const key = await hmacKey();
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(`${header}.${payload}`),
    );
    if (!valid) return null;
    const claims = JSON.parse(b64urlDecode(payload));
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return { nombre: claims.nombre, rol: claims.rol };
  } catch {
    return null;
  }
}

// getUsuario: checks Bearer token (cross-origin) or httpOnly cookie (same-origin).
// Use this in every route handler instead of usuarioCookie.
export async function getUsuario(request: NextRequest): Promise<Usuario | null> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const usuario = await verifyToken(authHeader.slice(7));
    if (usuario) return usuario;
  }
  return usuarioCookie(request);
}

// usuarioCookie: synchronous cookie-only read, kept for same-origin pages.
export function usuarioCookie(request: NextRequest): Usuario | null {
  const cookieVal = request.cookies.get("usuario");
  if (!cookieVal) return null;
  try {
    const usuario = JSON.parse(cookieVal.value) as Usuario;
    return usuario ?? null;
  } catch {
    return null;
  }
}
