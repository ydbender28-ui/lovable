import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStandaloneHtml } from "@/lib/buildHtml";

async function deployToNetlify(
  html: string,
  projectName: string,
  onStatus: (text: string) => void
): Promise<string> {
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!token) throw new Error("NETLIFY_AUTH_TOKEN not configured. Add it to your .env file.");

  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

  onStatus("Creating Netlify site...");

  // Try clean name first; if taken (422) fall back to slug with short suffix
  async function createSite(name: string) {
    return fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }

  let createRes = await createSite(slug);
  if (createRes.status === 422) {
    const suffix = Math.random().toString(36).slice(2, 6);
    createRes = await createSite(`${slug}-${suffix}`);
  }
  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Netlify site creation failed: ${body}`);
  }
  const site = (await createRes.json()) as { id: string; ssl_url?: string; url?: string };

  // Compute SHA1 digest of index.html for file-digest deploy
  const { createHash } = await import("crypto");
  const sha1 = createHash("sha1").update(html).digest("hex");

  onStatus("Creating deploy...");
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: { "/index.html": sha1 } }),
  });
  if (!deployRes.ok) {
    const body = await deployRes.text();
    throw new Error(`Netlify deploy creation failed: ${body}`);
  }
  const deploy = (await deployRes.json()) as { id: string; state?: string; required?: string[] };

  // Upload the file (Netlify's required list tells us if it needs uploading)
  if (!deploy.required || deploy.required.includes(sha1)) {
    onStatus("Uploading your app...");
    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
        body: html,
      }
    );
    if (!uploadRes.ok) {
      const body = await uploadRes.text();
      throw new Error(`Netlify file upload failed: ${body}`);
    }
  }

  // Poll until deploy is ready
  onStatus("Going live...");
  let state = deploy.state ?? "uploading";
  let attempts = 0;
  while (state !== "ready" && state !== "error" && attempts < 40) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (statusRes.ok) {
      const statusData = (await statusRes.json()) as { state?: string };
      state = statusData.state ?? state;
    }
    attempts++;
    onStatus(`Going live... (${state})`);
  }

  if (state === "error") throw new Error("Netlify deploy failed during processing.");

  // Fetch final deploy to get the guaranteed-live URL
  onStatus("Deploy complete!");
  const finalRes = await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (finalRes.ok) {
    const finalDeploy = (await finalRes.json()) as { ssl_url?: string; url?: string };
    return finalDeploy.ssl_url ?? finalDeploy.url ?? site.ssl_url ?? `https://${slug}.netlify.app`;
  }
  return site.ssl_url ?? `https://${slug}.netlify.app`;
}

export async function POST(_req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.versions[0]) return NextResponse.json({ error: "No generated version yet" }, { status: 400 });

  const files = JSON.parse(project.versions[0].files);
  const html = buildStandaloneHtml(files, project.name);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const url = await deployToNetlify(html, project.name, (text) => {
          send("status", { text });
        });

        await prisma.project.update({
          where: { id },
          data: { publishSlug: url, publishedAt: new Date() },
        });

        send("done", { url });
      } catch (err) {
        send("error", { error: err instanceof Error ? err.message : "Publish failed" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await prisma.project.updateMany({
    where: { id, ownerId: session.user.id },
    data: { publishSlug: null, publishedAt: null },
  });

  return NextResponse.json({ ok: true });
}
