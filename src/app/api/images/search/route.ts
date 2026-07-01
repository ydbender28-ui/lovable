import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "nature";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (accessKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=20&client_id=${accessKey}`,
        { next: { revalidate: 300 } }
      );
      if (!res.ok) throw new Error(`Unsplash error ${res.status}`);
      const data = await res.json();
      const images = (data.results || []).map((img: {
        id: string;
        urls: { regular: string; thumb: string };
        alt_description?: string;
        user: { name: string; links: { html: string } };
      }) => ({
        id: img.id,
        url: img.urls.regular,
        thumb: img.urls.thumb,
        alt: img.alt_description || q,
        credit: img.user.name,
        creditUrl: img.user.links.html,
      }));
      return NextResponse.json({ images, total: data.total_pages ?? 1 });
    } catch (err) {
      console.error("Unsplash fetch failed, falling back to Picsum:", err);
    }
  }

  // Fallback: deterministic Picsum images
  const seed = q.toLowerCase().replace(/\s+/g, "-");
  const images = Array.from({ length: 20 }, (_, i) => {
    const imgId = ((page - 1) * 20 + i + 1) % 1000 || 1;
    return {
      id: `picsum-${seed}-${imgId}`,
      url: `https://picsum.photos/seed/${seed}-${imgId}/800/600`,
      thumb: `https://picsum.photos/seed/${seed}-${imgId}/400/300`,
      alt: `${q} image ${imgId}`,
      credit: "Picsum Photos",
      creditUrl: "https://picsum.photos",
    };
  });
  return NextResponse.json({ images, total: 10 });
}
