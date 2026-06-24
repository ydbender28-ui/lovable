"use client";

import { useEffect } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { UI_COMPONENTS } from "@/lib/ui-components";

export type SandpackErr = {
  message: string;
  line?: number;
  column?: number;
  path?: string;
  title?: string;
};

function ErrorWatcher({ onError }: { onError: (e: SandpackErr | null) => void }) {
  const { sandpack } = useSandpack();
  const err = sandpack.error;
  useEffect(() => {
    onError(err && err.message ? err : null);
  }, [err?.message, err?.path, err?.line, onError]);
  return null;
}

// Tailwind CSS via CDN — injected into every preview
const TAILWIND_INDEX = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
            secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
            destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
            muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
            accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
            card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
          },
          borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
        },
      },
    }
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

// Extract npm dependencies from import statements in the code
function extractDependencies(files: Record<string, string>): Record<string, string> {
  const deps: Record<string, string> = {};
  const builtins = new Set(["react", "react-dom", "react/jsx-runtime"]);
  for (const content of Object.values(files)) {
    const imports = content.matchAll(/import\s+.*?\s+from\s+['"]([^./][^'"]*)['"]/g);
    for (const m of imports) {
      const pkg = m[1].startsWith("@") ? m[1].split("/").slice(0, 2).join("/") : m[1].split("/")[0];
      if (!builtins.has(pkg) && !deps[pkg]) {
        deps[pkg] = "latest";
      }
    }
  }
  return deps;
}

export default function Preview({
  files,
  onError,
  view,
}: {
  files: Record<string, string>;
  onError: (e: SandpackErr | null) => void;
  view: "preview" | "code";
}) {
  // Inject Tailwind HTML + pre-built UI components
  const allFiles = {
    ...UI_COMPONENTS,
    ...files,
    "/public/index.html": files["/public/index.html"] ?? TAILWIND_INDEX,
  };

  // Auto-detect npm dependencies from imports
  const customDeps = extractDependencies(files);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <SandpackProvider
      template="react-ts"
      files={allFiles}
      theme="light"
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
      customSetup={Object.keys(customDeps).length > 0 ? { dependencies: customDeps } : undefined}
    >
      <ErrorWatcher onError={onError} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ height: "100%", display: view === "code" ? "none" : "block" }}>
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: "100%" }}
          />
        </div>
        <div style={{ height: "100%", display: view === "code" ? "block" : "none" }}>
          <SandpackCodeEditor showTabs showLineNumbers style={{ height: "100%" }} />
        </div>
      </div>
    </SandpackProvider>
    </div>
  );
}
