// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = ["https://controlcajas.mercadoelineas.com"];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = allowedOrigins.includes(origin);

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set(
      "Access-Control-Allow-Origin",
      isAllowed ? origin : allowedOrigins[0],
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  // For normal requests, we'll attach CORS headers in the response
  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Fallback to a specific origin or omit entirely in production
    response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
  }

  return response;
}

// Only apply to your API routes
export const config = {
  matcher: "/api/:path*",
};
