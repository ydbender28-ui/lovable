"use client";

import { useEffect } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { UI_COMPONENTS } from "@/lib/ui-components";
import { SECTION_COMPONENTS } from "@/lib/section-components";
import { EXTRA_COMPONENTS } from "@/lib/extra-components";

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
  view: "preview" | "code" | "console";
}) {
  // Inject Tailwind CDN + pre-built components
  const allFiles: Record<string, string> = {
    "/public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>App</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        muted: 'hsl(var(--muted))',
        accent: 'hsl(var(--accent))',
        border: 'hsl(var(--border))',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      }
    }
  }
}
</script>
</head>
<body><div id="root"></div>
<script>
// Global error handler — prevent blank screens from component errors
window.addEventListener('error', function(e) {
  if (document.getElementById('root').innerHTML === '') {
    document.getElementById('root').innerHTML = '<div style="padding:40px;font-family:sans-serif"><h2>Something went wrong</h2><p style="color:#666">Click "Fix error" above to resolve</p></div>';
  }
});
</script>
</body>
</html>`,
    ...UI_COMPONENTS,
    ...SECTION_COMPONENTS,
    ...EXTRA_COMPONENTS,
    ...files,
  };

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
        <div style={{ height: "100%", display: view === "preview" ? "block" : "none" }}>
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: "100%" }}
          />
        </div>
        <div style={{ height: "100%", display: view === "code" ? "block" : "none" }}>
          <SandpackCodeEditor showTabs showLineNumbers style={{ height: "100%" }} />
        </div>
        <div style={{ height: "100%", display: view === "console" ? "block" : "none" }}>
          <SandpackConsole style={{ height: "100%" }} />
        </div>
      </div>
    </SandpackProvider>
    </div>
  );
}
