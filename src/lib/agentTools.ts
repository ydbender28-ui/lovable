// Tool types the user can configure on an agent

export type AgentTool = {
  id: string;
  name: string;         // snake_case, used by Claude: "check_inventory"
  description: string;  // plain English — Claude reads this to decide when to call
  parameters: ToolParam[];
  type: "webhook" | "fetch_url" | "browse_web" | "send_email";
  // webhook / fetch_url config
  url?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  // send_email
  toEmail?: string;
};

export type ToolParam = {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
};

// Convert our tool definition to Claude's tool schema format
export function toClaudeTool(t: AgentTool) {
  const props: Record<string, { type: string; description: string }> = {};
  const required: string[] = [];
  for (const p of t.parameters) {
    props[p.name] = { type: p.type, description: p.description };
    if (p.required) required.push(p.name);
  }
  return {
    name: t.name,
    description: t.description,
    input_schema: { type: "object" as const, properties: props, required },
  };
}

// Built-in tools always available (no user config needed)
export const BUILTIN_TOOLS: AgentTool[] = [
  {
    id: "__fetch_url",
    name: "fetch_url",
    description: "Make an HTTP request to any URL and return the response. Use this to call APIs, read data from endpoints, or interact with web services.",
    type: "fetch_url",
    parameters: [
      { name: "url", type: "string", description: "The full URL to request", required: true },
      { name: "method", type: "string", description: "HTTP method: GET, POST, PUT, DELETE (default: GET)", required: false },
      { name: "body", type: "string", description: "Request body as JSON string (for POST/PUT)", required: false },
      { name: "headers", type: "string", description: "Request headers as JSON string e.g. {\"Authorization\": \"Bearer xyz\"}", required: false },
    ],
  },
  {
    id: "__browse_web",
    name: "browse_web",
    description: "Fetch and read the text content of any webpage. Use this to look up information, check websites, read documentation, or extract data from web pages.",
    type: "browse_web",
    parameters: [
      { name: "url", type: "string", description: "The webpage URL to read", required: true },
    ],
  },
];

// Execute a single tool call from Claude
export async function executeTool(
  tool: AgentTool,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (tool.type) {
      case "browse_web": {
        const url = input.url as string;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ThatCode-Agent/1.0)" },
          signal: AbortSignal.timeout(15000),
        });
        const html = await res.text();
        // Strip HTML tags and compress whitespace
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s{2,}/g, " ")
          .trim()
          .slice(0, 8000); // cap at 8k chars
        return `[${res.status} ${url}]\n${text}`;
      }

      case "fetch_url": {
        const url = input.url as string;
        const method = (input.method as string) || "GET";
        const body = input.body as string | undefined;
        const headersStr = input.headers as string | undefined;

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (tool.headers) Object.assign(headers, tool.headers);
        if (headersStr) {
          try { Object.assign(headers, JSON.parse(headersStr)); } catch { /* ignore */ }
        }

        const res = await fetch(url, {
          method,
          headers,
          body: body && method !== "GET" ? body : undefined,
          signal: AbortSignal.timeout(20000),
        });

        const text = await res.text();
        let result = text;
        try { result = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep as text */ }
        return `[${res.status} ${method} ${url}]\n${result.slice(0, 6000)}`;
      }

      case "webhook": {
        if (!tool.url) return "Error: webhook URL not configured";
        const method = tool.method || "POST";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (tool.headers) Object.assign(headers, tool.headers);

        // Substitute {param} placeholders in URL for GET requests
        let url = tool.url;
        for (const [k, v] of Object.entries(input)) {
          url = url.replace(`{${k}}`, encodeURIComponent(String(v)));
        }

        const res = await fetch(url, {
          method,
          headers,
          body: method !== "GET" ? JSON.stringify(input) : undefined,
          signal: AbortSignal.timeout(20000),
        });

        const text = await res.text();
        let result = text;
        try { result = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep as text */ }
        return `[${res.status}]\n${result.slice(0, 6000)}`;
      }

      case "send_email": {
        // Requires a configured email service — for now just log and return success
        const to = tool.toEmail || (input.to as string);
        const subject = input.subject as string || "Message from AI Agent";
        const body = input.body as string || "";
        if (!to) return "Error: no recipient email configured";
        // TODO: integrate with SendGrid/Resend when SENDGRID_API_KEY or RESEND_API_KEY is set
        const apiKey = process.env.SENDGRID_API_KEY;
        if (apiKey) {
          const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: to }] }],
              from: { email: "noreply@thatcode.dev", name: "ThatCode Agent" },
              subject,
              content: [{ type: "text/plain", value: body }],
            }),
          });
          return res.ok ? `Email sent to ${to}` : `Email failed: ${await res.text()}`;
        }
        return `[Simulated] Email to ${to}\nSubject: ${subject}\n${body}`;
      }

      default:
        return "Unknown tool type";
    }
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
