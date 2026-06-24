import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, numResults = 5 } = await req.json();
  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

  // Use Brave Search API (free tier: 2000 queries/month)
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Web search not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${numResults}`,
      { headers: { "X-Subscription-Token": apiKey, Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();

    const results = (data.web?.results ?? []).map((r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
