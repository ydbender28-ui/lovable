"use client";

import { useEffect } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";

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

export default function Preview({
  files,
  onError,
  view,
}: {
  files: Record<string, string>;
  onError: (e: SandpackErr | null) => void;
  view: "preview" | "code";
}) {
  return (
    <SandpackProvider template="react" files={files} theme="light">
      <ErrorWatcher onError={onError} />
      <div style={{ height: "100%" }}>
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
  );
}
