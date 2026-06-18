import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  // Route *.thatcode.dev subdomains to /p/[slug]
  if (hostname.endsWith(".thatcode.dev")) {
    const subdomain = hostname.replace(/\.thatcode\.dev$/, "");
    if (subdomain && subdomain !== "www") {
      const url = req.nextUrl.clone();
      url.pathname = `/p/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/dashboard", "/projects"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthed) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
