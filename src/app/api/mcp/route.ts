/**
 * ThatCode MCP Server — Model Context Protocol endpoint
 * Allows Claude Desktop, Cursor, VS Code, and ChatGPT to build and manage ThatCode apps.
 * Spec: https://spec.modelcontextprotocol.io/specification/
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TOOLS = [
  {
    name: "list_projects",
    description: "List all ThatCode projects for the authenticated user",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_project",
    description: "Get the current code and details of a ThatCode project",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string", description: "The project ID" } },
      required: ["project_id"],
    },
  },
  {
    name: "create_project",
    description: "Create a new ThatCode project and generate its initial code from a prompt",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        prompt: { type: "string", description: "What to build — be specific and detailed" },
        api_key: { type: "string", description: "ThatCode API key (from Settings)" },
      },
      required: ["name", "prompt", "api_key"],
    },
  },
  {
    name: "edit_project",
    description: "Edit an existing ThatCode project by describing what to change",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "The project ID to edit" },
        prompt: { type: "string", description: "What to add, change, or fix" },
        api_key: { type: "string", description: "ThatCode API key (from Settings)" },
      },
      required: ["project_id", "prompt", "api_key"],
    },
  },
  {
    name: "publish_project",
    description: "Publish a ThatCode project to a public URL",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "The project ID to publish" },
        slug: { type: "string", description: "URL slug (e.g. my-app → my-app.thatcode.dev)" },
        api_key: { type: "string", description: "ThatCode API key" },
      },
      required: ["project_id", "slug", "api_key"],
    },
  },
  {
    name: "get_published_url",
    description: "Get the live URL of a published ThatCode project",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"],
    },
  },
];

type McpRequest = {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
};

function ok(id: string | number, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function err(id: string | number, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

async function resolveUserByKey(apiKey: string) {
  // In a real implementation, store API keys in DB. For now use email-based auth token.
  // Format: "tc_<userId>"
  if (!apiKey?.startsWith("tc_")) return null;
  const userId = apiKey.slice(3);
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
}

export async function POST(req: Request) {
  const body = (await req.json()) as McpRequest;
  const { jsonrpc, id, method, params = {} } = body;

  if (jsonrpc !== "2.0") return err(id ?? 0, -32600, "Invalid Request");

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "thatcode", version: "1.0.0" },
    });
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const toolName = (params.name as string) ?? "";
    const args = (params.arguments as Record<string, string>) ?? {};
    const baseUrl = req.headers.get("origin") ?? "https://thatcode.dev";

    try {
      if (toolName === "list_projects") {
        const apiKey = args.api_key ?? (req.headers.get("x-api-key") ?? "");
        const user = await resolveUserByKey(apiKey);
        if (!user) return err(id, -32001, "Invalid API key. Get yours from ThatCode Settings.");
        const projects = await prisma.project.findMany({
          where: { ownerId: user.id },
          select: { id: true, name: true, updatedAt: true, publishSlug: true },
          orderBy: { updatedAt: "desc" },
          take: 20,
        });
        return ok(id, {
          content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
        });
      }

      if (toolName === "get_project") {
        const project = await prisma.project.findUnique({
          where: { id: args.project_id },
          include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
        });
        if (!project) return err(id, -32002, "Project not found");
        const files = project.versions[0] ? JSON.parse(project.versions[0].files) : {};
        return ok(id, {
          content: [{
            type: "text",
            text: JSON.stringify({ id: project.id, name: project.name, publishSlug: project.publishSlug, files }, null, 2),
          }],
        });
      }

      if (toolName === "create_project") {
        const user = await resolveUserByKey(args.api_key);
        if (!user) return err(id, -32001, "Invalid API key");
        const project = await prisma.project.create({
          data: { name: args.name, ownerId: user.id },
        });
        // Trigger generation
        const genRes = await fetch(`${baseUrl}/api/projects/${project.id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cookie": `mcp-user=${user.id}` },
          body: JSON.stringify({ prompt: args.prompt }),
        });
        const status = genRes.status;
        return ok(id, {
          content: [{
            type: "text",
            text: `Project created: ${project.id}\nName: ${project.name}\nEdit at: ${baseUrl}/projects/${project.id}\nGeneration status: ${status === 200 ? "started" : "check project page"}`,
          }],
        });
      }

      if (toolName === "get_published_url") {
        const project = await prisma.project.findUnique({
          where: { id: args.project_id },
          select: { publishSlug: true, customDomain: true },
        });
        if (!project) return err(id, -32002, "Project not found");
        const url = project.customDomain
          ? `https://${project.customDomain}`
          : project.publishSlug
            ? `https://thatcode.dev/${project.publishSlug}`
            : null;
        return ok(id, {
          content: [{ type: "text", text: url ?? "Not published yet" }],
        });
      }

      return err(id, -32601, `Unknown tool: ${toolName}`);
    } catch (e) {
      return err(id, -32603, e instanceof Error ? e.message : "Internal error");
    }
  }

  return err(id ?? 0, -32601, `Method not found: ${method}`);
}

export async function GET() {
  return NextResponse.json({
    name: "ThatCode MCP Server",
    version: "1.0.0",
    description: "Build, edit, and publish ThatCode apps from Claude Desktop, Cursor, VS Code, or ChatGPT",
    mcpEndpoint: "https://thatcode.dev/api/mcp",
    authentication: "Include your API key as x-api-key header or in the tool arguments as api_key",
    tools: TOOLS.map(t => t.name),
    setup: {
      claudeDesktop: {
        configFile: "~/Library/Application Support/Claude/claude_desktop_config.json",
        config: {
          mcpServers: {
            thatcode: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-fetch", "https://thatcode.dev/api/mcp"],
              env: { THATCODE_API_KEY: "tc_<your-user-id-from-settings>" },
            },
          },
        },
      },
    },
  });
}
