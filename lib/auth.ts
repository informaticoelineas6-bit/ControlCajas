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
export function usuarioCookie(request: NextRequest): Usuario | null {
  const usuarioCookie = request.cookies.get("usuario");
  let usuario: Usuario | null = null;
  if (usuarioCookie) {
    try {
      usuario = JSON.parse(usuarioCookie.value);
      if (!usuario) {
        return null;
      }
    } catch {
      return null;
    }
  }
  return usuario ?? null;
}
