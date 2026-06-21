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

  const errorBoundary = `class __EB extends React.Component{constructor(p){super(p);this.state={e:null};}static getDerivedStateFromError(e){return{e};}componentDidCatch(e,i){__reportErr('Render error: '+e.message+'\\n'+(e.stack||''));}render(){if(this.state.e)return null;return this.props.children;}}`;
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
  <div id="__err" style="display:none;position:fixed;inset:0;background:#0d0d0d;z-index:9999;align-items:center;justify-content:center;flex-direction:column;gap:12px;cursor:pointer;font-family:-apple-system,sans-serif" onclick="this.style.display='none'">
    <div style="font-size:32px">⚠️</div>
    <div style="color:#f87171;font-size:15px;font-weight:600">Error detected</div>
    <div style="color:#6b7280;font-size:13px">Auto-fixing… or type <strong style="color:#a78bfa">fix</strong> in the chat</div>
  </div>
  <script>${reactScripts.react}</script>
  <script>${reactScripts.reactDom}</script>
  <script>
    function __reportErr(msg){
      var el=document.getElementById('__err');el.style.display='flex';
      try{window.parent.postMessage({type:'preview-error',error:msg},'*');}catch(e){}
    }
    window.addEventListener('error',function(e){__reportErr('Runtime error: '+e.message+'\\n\\n'+(e.error&&e.error.stack||''));});
    window.addEventListener('unhandledrejection',function(e){__reportErr('Unhandled rejection: '+(e.reason&&e.reason.message||String(e.reason)));});
    ${fullCode}
  </script>
</body>
</html>`;
}

// Used for local export download — uses CDN (needs internet)
export function buildStandaloneHtml(projectFiles: ProjectFiles, projectName: string, projectId?: string): string {
  const { code, componentName, styles, title } = buildAppCode(projectFiles);

  const errorBoundary = `class __EB extends React.Component{constructor(p){super(p);this.state={e:null};}static getDerivedStateFromError(e){return{e};}componentDidCatch(e,i){showErr('Render error: '+e.message+'\\n'+(e.stack||''));}render(){if(this.state.e)return null;return this.props.children;}}`;
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
  <div id="__err" style="display:none;position:fixed;inset:0;background:#0d0d0d;z-index:9999;align-items:center;justify-content:center;flex-direction:column;gap:12px;cursor:pointer;font-family:-apple-system,sans-serif" onclick="this.style.display='none'">
    <div style="font-size:32px">⚠️</div>
    <div style="color:#f87171;font-size:15px;font-weight:600">Error detected</div>
    <div style="color:#6b7280;font-size:13px">Auto-fixing… or type <strong style="color:#a78bfa">fix</strong> in the chat</div>
  </div>
  <script>
    function showErr(msg){var el=document.getElementById('__err');el.style.display='flex';try{window.parent.postMessage({type:'preview-error',error:msg},'*');}catch(e){}}
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
  <script>
    // Analytics beacon — tracks pageviews, clicks, rage-clicks, form submits
    (function(){
      var pid="${projectId||''}";
      if(!pid)return;
      var base='';
      function send(t,el){
        var body=JSON.stringify({projectId:pid,eventType:t,path:location.pathname,element:el||null});
        try{navigator.sendBeacon(base+'/api/events',new Blob([body],{type:'application/json'}));}catch(e){}
      }
      send('pageview');
      var clicks={};
      document.addEventListener('click',function(e){
        var t=e.target;
        var label=(t.getAttribute&&t.getAttribute('aria-label'))||t.textContent||t.tagName;
        label=(label||'').trim().slice(0,60);
        var key=label||t.tagName;
        var now=Date.now();
        if(!clicks[key])clicks[key]=[];
        clicks[key]=clicks[key].filter(function(ts){return now-ts<2000;});
        clicks[key].push(now);
        send('click',label);
        if(clicks[key].length>=3){send('ragclick',label);clicks[key]=[];}
      },true);
      document.addEventListener('submit',function(){send('form_submit');},true);
    })();
  </script>
  <script>
    // Visual edit mode — activated by parent via postMessage
    var __visualEdit=false;
    var __overlay=null;
    function __removeOverlay(){if(__overlay){__overlay.remove();__overlay=null;}}
    window.addEventListener('message',function(e){
      if(e.data&&e.data.type==='TC_VISUAL_EDIT'){
        __visualEdit=e.data.enabled;
        document.body.style.cursor=__visualEdit?'crosshair':'';
        __removeOverlay();
      }
    });
    document.addEventListener('mouseover',function(e){
      if(!__visualEdit)return;
      __removeOverlay();
      var el=e.target;
      if(el===document.body||el===document.documentElement)return;
      var r=el.getBoundingClientRect();
      __overlay=document.createElement('div');
      __overlay.style.cssText='position:fixed;pointer-events:none;z-index:99998;outline:2px solid #a855f7;background:rgba(168,85,247,0.08);border-radius:4px;';
      __overlay.style.top=r.top+'px';__overlay.style.left=r.left+'px';
      __overlay.style.width=r.width+'px';__overlay.style.height=r.height+'px';
      document.body.appendChild(__overlay);
    },true);
    document.addEventListener('click',function(e){
      if(!__visualEdit)return;
      e.preventDefault();e.stopPropagation();
      var el=e.target;
      var tag=el.tagName.toLowerCase();
      var text=(el.textContent||'').trim().slice(0,120);
      var cls=el.className||'';
      var desc=tag+(text?' containing "'+text+'"':'')+(cls?' (class: '+cls+')':'');
      try{window.parent.postMessage({type:'TC_VISUAL_CLICK',desc:desc,tag:tag,text:text},'*');}catch(err){}
    },true);
  </script>
</body>
</html>`;
}
