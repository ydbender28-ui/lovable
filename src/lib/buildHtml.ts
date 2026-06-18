import ts from "typescript";

export type ProjectFiles = Record<string, string>;

const REACT_CDN = "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js";
const REACT_DOM_CDN = "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js";

let _reactCache: { react: string; reactDom: string } | null = null;

export async function fetchReactScripts(): Promise<{ react: string; reactDom: string }> {
  if (_reactCache) return _reactCache;
  const [react, reactDom] = await Promise.all([
    fetch(REACT_CDN).then((r) => r.text()),
    fetch(REACT_DOM_CDN).then((r) => r.text()),
  ]);
  _reactCache = { react, reactDom };
  return _reactCache;
}

function stripModuleSyntax(code: string): string {
  return code
    .replace(/^import\s[^\n]+\n?/gm, "")
    .replace(/^export\s+default\s+(?=function|class|const|let|var|async)/gm, "")
    .replace(/^export\s+default\s+\w[\w.]*\s*;?\s*$/gm, "")
    .replace(/^export\s+(?=const|let|var|function|class|type|interface|enum)/gm, "")
    .replace(/^export\s*\{[^}]*\}\s*(?:from\s*['"][^'"]+['"])?\s*;?\s*$/gm, "");
}

function transpileTSX(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      esModuleInterop: false,
      allowSyntheticDefaultImports: true,
    },
    fileName: "App.tsx",
  });
  return result.outputText;
}

function buildAppCode(projectFiles: ProjectFiles): { code: string; componentName: string; styles: string; title: string } {
  const src: ProjectFiles = {};
  for (const [p, c] of Object.entries(projectFiles)) {
    src[p.replace(/^\//, "")] = c;
  }

  const rawHtml = src["index.html"] ?? "";
  const styleMatch = rawHtml.match(/<style>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : "body{background:#0a0a0f;color:#f4f4f5}";
  const title = rawHtml.match(/<title>(.*?)<\/title>/i)?.[1] ?? "App";

  const tsxFiles = Object.keys(src)
    .filter((p) => p.match(/\.tsx?$/) && !p.match(/\/(main|index)\.(tsx?)$/))
    .sort((a, b) => (a.includes("App") ? 1 : 0) - (b.includes("App") ? 1 : 0));

  const rawApp = src["src/App.tsx"] ?? src[tsxFiles[tsxFiles.length - 1]] ?? "";
  const exportDefaultMatch =
    rawApp.match(/^export\s+default\s+(?:function|class)\s+(\w+)/m) ||
    rawApp.match(/^export\s+default\s+(\w+)\s*;/m);
  const componentName = exportDefaultMatch?.[1] ?? "App";

  const reactGlobals = `var { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, useLayoutEffect, useId, useTransition, useDeferredValue } = React;`;

  const strippedCode = tsxFiles
    .map((p) => stripModuleSyntax(src[p]))
    .join("\n\n");

  const tsxSource = reactGlobals + "\n" + strippedCode;

  let code: string;
  try {
    code = transpileTSX(tsxSource);
  } catch {
    code = tsxSource;
  }

  return { code, componentName, styles, title };
}

// Used for publish — inlines React so it works with no external deps
export function buildPublishHtml(
  projectFiles: ProjectFiles,
  projectName: string,
  reactScripts: { react: string; reactDom: string }
): string {
  const { code, componentName, styles, title } = buildAppCode(projectFiles);

  const errorBoundary = `class __EB extends React.Component{constructor(p){super(p);this.state={e:null};}static getDerivedStateFromError(e){return{e};}componentDidCatch(e){var el=document.getElementById('__err');el.style.display='block';el.textContent='Render error: '+e.message+'\\n'+(e.stack||'');}render(){if(this.state.e)return null;return this.props.children;}}`;
  const renderCall = `${errorBoundary}\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__EB,null,React.createElement(${componentName},null)));`;
  const fullCode = (code + "\n" + renderCall).replace(/<\/script>/gi, "<\\/script>");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title || projectName}</title>
  <style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}${styles}</style>
</head>
<body>
  <div id="root"><div style="display:flex;align-items:center;justify-content:center;height:100vh;font:16px/1 -apple-system,sans-serif;color:#71717a">Loading…</div></div>
  <div id="__err" style="display:none;position:fixed;inset:0;background:#1a0000;color:#ff8080;font:13px/1.6 monospace;padding:32px;z-index:9999;white-space:pre-wrap;overflow:auto;cursor:pointer" onclick="this.style.display='none'"></div>
  <script>${reactScripts.react}</script>
  <script>${reactScripts.reactDom}</script>
  <script>
    window.addEventListener('error',function(e){
      var el=document.getElementById('__err');
      el.style.display='block';
      el.textContent='Runtime error: '+e.message+'\\n\\n'+(e.error&&e.error.stack||'');
    });
    window.addEventListener('unhandledrejection',function(e){
      var el=document.getElementById('__err');
      el.style.display='block';
      el.textContent='Unhandled promise rejection: '+(e.reason&&e.reason.message||e.reason||'unknown');
    });
    ${fullCode}
  </script>
</body>
</html>`;
}

// Used for local export download — uses CDN (needs internet)
export function buildStandaloneHtml(projectFiles: ProjectFiles, projectName: string): string {
  const { code, componentName, styles, title } = buildAppCode(projectFiles);

  const errorBoundary = `class __EB extends React.Component{constructor(p){super(p);this.state={e:null};}static getDerivedStateFromError(e){return{e};}componentDidCatch(e){var el=document.getElementById('__err');el.style.display='block';el.textContent='Render error: '+e.message+'\\n'+(e.stack||'');}render(){if(this.state.e)return null;return this.props.children;}}`;
  const renderCall = `${errorBoundary}\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__EB,null,React.createElement(${componentName},null)));`;
  const fullCode = (code + "\n" + renderCall).replace(/<\/script>/gi, "<\\/script>");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title || projectName}</title>
  <style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}${styles}</style>
</head>
<body>
  <div id="root"><div style="display:flex;align-items:center;justify-content:center;height:100vh;font:16px/1 -apple-system,sans-serif;color:#71717a">Loading…</div></div>
  <div id="__err" style="display:none;position:fixed;inset:0;background:#1a0000;color:#ff8080;font:13px/1.6 monospace;padding:32px;z-index:9999;white-space:pre-wrap;overflow:auto;cursor:pointer" onclick="this.style.display='none'"></div>
  <script>
    function showErr(msg){var el=document.getElementById('__err');el.style.display='block';el.textContent=msg;}
    window.addEventListener('error',function(e){showErr('Runtime error: '+e.message+'\\n\\n'+(e.error&&e.error.stack||''));});
    window.addEventListener('unhandledrejection',function(e){showErr('Promise error: '+(e.reason&&e.reason.message||String(e.reason)));});
    setTimeout(function(){
      if(typeof React==='undefined'){showErr('React failed to load from CDN.\\nCheck your internet connection or try again.');}
      else if(document.getElementById('root').children.length===0||document.getElementById('root').textContent==='Loading…'){showErr('React loaded but app did not mount.\\nReact: '+typeof React+'\\nReactDOM: '+typeof ReactDOM);}
    },8000);
  </script>
  <script src="${REACT_CDN}" onerror="showErr('Failed to load React from CDN: ${REACT_CDN}')"></script>
  <script src="${REACT_DOM_CDN}" onerror="showErr('Failed to load ReactDOM from CDN: ${REACT_DOM_CDN}')"></script>
  <script>
    try {
      ${fullCode}
    } catch(e) {
      showErr('App init error: '+e.message+'\\n\\n'+(e.stack||''));
    }
  </script>
</body>
</html>`;
}
