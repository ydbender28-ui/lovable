import { NextResponse } from "next/server";
import dns from "dns/promises";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain")?.toLowerCase().trim();
  if (!domain) return NextResponse.json({ verified: false });

  try {
    // Check CNAME resolves to domains.thatcode.dev or Vercel IPs
    const isApex = domain.split(".").length === 2;
    if (isApex) {
      const records = await dns.resolve4(domain);
      const verified = records.includes("76.76.21.21");
      return NextResponse.json({ verified });
    } else {
      const records = await dns.resolveCname(domain);
      const verified = records.some(r =>
        r.includes("thatcode.dev") || r.includes("vercel") || r.includes("76.76.21")
      );
      return NextResponse.json({ verified });
    }
  } catch {
    return NextResponse.json({ verified: false });
  }
}
