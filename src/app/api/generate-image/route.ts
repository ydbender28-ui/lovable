import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Image generation not configured" }, { status: 503 });
  }

  try {
    // Start prediction
    const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "wait" },
      body: JSON.stringify({ input: { prompt, num_outputs: 1, output_format: "webp", output_quality: 80, aspect_ratio: "1:1" } }),
    });

    if (!startRes.ok) {
      const err = await startRes.json();
      return NextResponse.json({ error: err.detail ?? "Generation failed" }, { status: 500 });
    }

    const prediction = await startRes.json();

    // If already done (Prefer: wait worked)
    if (prediction.status === "succeeded" && prediction.output?.[0]) {
      return NextResponse.json({ url: prediction.output[0] });
    }

    // Poll until done
    const predId = prediction.id;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const poll = await pollRes.json();
      if (poll.status === "succeeded" && poll.output?.[0]) {
        return NextResponse.json({ url: poll.output[0] });
      }
      if (poll.status === "failed") {
        return NextResponse.json({ error: poll.error ?? "Generation failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Timed out" }, { status: 504 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
