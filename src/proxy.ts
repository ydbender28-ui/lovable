import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  // Route *.thatcode.xyz subdomains to /p/[slug]
  if (hostname.endsWith(".thatcode.xyz")) {
    const subdomain = hostname.replace(/\.thatcode\.dev$/, "");
    if (subdomain && subdomain !== "www") {
      const url = req.nextUrl.clone();
      url.pathname = `/p/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  // Route custom domains to /p/[slug] via /custom-domain/[host] lookup
  const isKnownHost = hostname === "thatcode.xyz" || hostname === "www.thatcode.xyz" || hostname.endsWith(".thatcode.xyz") || hostname === "localhost";
  if (!isKnownHost && !hostname.endsWith(".vercel.app")) {
    const url = req.nextUrl.clone();
    url.pathname = `/p-custom/${encodeURIComponent(hostname)}`;
    return NextResponse.rewrite(url);
  }

  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/dashboard", "/projects", "/agents"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p)) && !pathname.startsWith("/a/");

  if (isProtected && !isAuthed) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
