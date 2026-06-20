import { NextResponse } from "next/server";
import dns from "dns/promises";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain")?.toLowerCase().trim();
  if (!domain) return NextResponse.json({ verified: false });

  try {
    // Step 1: DNS resolves to Vercel
    const isApex = domain.split(".").length === 2;
    let dnsOk = false;
    if (isApex) {
      const records = await dns.resolve4(domain).catch(() => [] as string[]);
      dnsOk = records.includes("76.76.21.21");
    } else {
      const records = await dns.resolveCname(domain).catch(() => [] as string[]);
      dnsOk = records.some(r =>
        r.includes("thatcode.dev") || r.includes("vercel") || r.includes("76.76.21")
      );
    }

    if (!dnsOk) return NextResponse.json({ verified: false, reason: "dns" });

    // Step 2: HTTP fetch actually returns our app (not a Vercel error page)
    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (!res) return NextResponse.json({ verified: false, reason: "unreachable" });

    // Vercel returns 530 or similar for misconfigured domains
    const verified = res.ok || res.status === 200 || res.status === 304;
    return NextResponse.json({ verified, reason: verified ? "ok" : `http_${res.status}` });

  } catch {
    return NextResponse.json({ verified: false, reason: "error" });
  }
}
