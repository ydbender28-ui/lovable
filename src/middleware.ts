import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0]; // strip port if any

  // Route *.thatcode.dev subdomains to /p/[slug]
  if (hostname.endsWith(".thatcode.dev")) {
    const subdomain = hostname.replace(/\.thatcode\.dev$/, "");
    // Skip www and the apex (shouldn't happen with wildcard but be safe)
    if (subdomain && subdomain !== "www") {
      const url = req.nextUrl.clone();
      url.pathname = `/p/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
