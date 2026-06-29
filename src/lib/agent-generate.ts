import Anthropic from "@anthropic-ai/sdk";
import { UI_COMPONENT_LIST } from "./ui-components";
import { SECTION_COMPONENT_LIST } from "./section-components";
import { EXTRA_COMPONENT_LIST } from "./extra-components";
import type { ProjectFiles } from "./generate";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert React/TypeScript developer building web apps inside a browser-based sandbox (Sandpack).

## Environment
- React 18 + TypeScript, Tailwind CSS for styling
- Entry point: /App.tsx (must have a default export)
- Files live at paths like /App.tsx, /index.css, /components/Foo.tsx
- Pre-built section components are available at /components/sections/* — use them instead of writing from scratch
- Pre-built UI components at /components/ui/*
- NO Node.js, NO server-side code, NO imports from npm (only React, react-dom, and the pre-built components are available)

## Pre-built Section Components
${SECTION_COMPONENT_LIST}

## Pre-built UI Components
${UI_COMPONENT_LIST}

## Extra Components
${EXTRA_COMPONENT_LIST}

## Rules
1. ALWAYS read a file before editing it — never guess at existing content
2. Use list_files() if unsure what exists in the project
3. Write complete, valid TypeScript — no placeholders, no TODOs
4. Use Tailwind classes for all styling; avoid inline styles
5. Keep /App.tsx as the single top-level component that composes sections
6. For color/theme changes: if existing code uses CSS variables (e.g. bg-[hsl(var(--background))]), edit /index.css only. If it uses hardcoded Tailwind classes (e.g. bg-white), edit the TSX files directly.
7. Call done() when all files are written — include a short 1-2 sentence summary of what you built/changed.
8. Do not output any text outside of tool calls — all communication is via tools.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "list_files",
    description: "Returns a list of all file paths currently in the project.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "read_file",
    description: "Reads the content of a file in the project. Call this before editing any file.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path like /App.tsx or /components/Foo.tsx" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Creates or overwrites a file with the given content. The preview updates immediately after each write.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path like /App.tsx" },
        content: { type: "string", description: "Complete file content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "done",
    description: "Call this when you have finished all edits. Signals completion.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: { type: "string", description: "1-2 sentence summary of what was built or changed" },
      },
      required: ["summary"],
    },
  },
];

export interface AgentGenerateResult {
  files: ProjectFiles;
  summary: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

export async function agentGenerate(
  prompt: string,
  existingFiles: ProjectFiles | null,
  onStatus: (text: string) => void,
  onFileWrite: (path: string, content: string) => void,
): Promise<AgentGenerateResult> {
  const model = "claude-sonnet-4-6";
  const workingFiles: ProjectFiles = { ...(existingFiles ?? {}) };

  const userMessage = existingFiles
    ? `User request: ${prompt}\n\nCurrent project has ${Object.keys(existingFiles).length} files. Use list_files() to see them, then read the relevant ones before making changes.`
    : `User request: ${prompt}\n\nThis is a brand new project — no files exist yet. Create /App.tsx and /index.css to build this app.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let summary = "Done!";
  let iterations = 0;
  const MAX_ITERATIONS = 20;

  onStatus("Claude is thinking…");

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model,
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Add assistant response to message history
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") break;

    // Process tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let finished = false;

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const { name, id, input } = block as Anthropic.ToolUseBlock;
      let result: string;

      if (name === "list_files") {
        const paths = Object.keys(workingFiles);
        result = paths.length > 0 ? paths.join("\n") : "(no files yet — this is a new project)";

      } else if (name === "read_file") {
        const path = (input as { path: string }).path;
        result = workingFiles[path] ?? `File not found: ${path}`;
        onStatus(`Reading ${path}…`);

      } else if (name === "write_file") {
        const { path, content } = input as { path: string; content: string };
        workingFiles[path] = content;
        onFileWrite(path, content);
        onStatus(`Writing ${path}…`);
        result = `Written successfully: ${path}`;

      } else if (name === "done") {
        summary = (input as { summary: string }).summary;
        finished = true;
        result = "ok";

      } else {
        result = `Unknown tool: ${name}`;
      }

      toolResults.push({ type: "tool_result", tool_use_id: id, content: result });
    }

    // Send tool results back
    messages.push({ role: "user", content: toolResults });

    if (finished) break;
  }

  onStatus("Saving…");

  return {
    files: workingFiles,
    summary,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    modelUsed: model,
  };
}
