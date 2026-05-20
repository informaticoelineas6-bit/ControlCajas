import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const allowedOrigins = ["https://controlcajas.mercadoelineas.com"];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = allowedOrigins.includes(origin);
  const allowOrigin = isAllowed ? origin : allowedOrigins[0];

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Strip any client-provided x-usuario to prevent identity spoofing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-usuario");

  // Verify Bearer token and forward the identity as a trusted internal header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const usuario = await verifyToken(authHeader.slice(7));
    if (usuario) {
      requestHeaders.set("x-usuario", JSON.stringify(usuario));
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
