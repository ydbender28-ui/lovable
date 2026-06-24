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
  // Inject pre-built UI + section components
  const allFiles: Record<string, string> = {
    ...UI_COMPONENTS,
    ...SECTION_COMPONENTS,
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
