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

  // New Sandpack format: /App.js + /styles.css
  if (src["App.js"]) {
    const rawApp = src["App.js"] ?? "";
    const styles = src["styles.css"] ?? "body{font-family:system-ui,sans-serif}";
    const exportDefaultMatch =
      rawApp.match(/^export\s+default\s+(?:function|class)\s+(\w+)/m) ||
      rawApp.match(/^export\s+default\s+(\w+)\s*;/m);
    const componentName = exportDefaultMatch?.[1] ?? "App";

    const reactGlobals = `var { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, useLayoutEffect, useId, useTransition, useDeferredValue } = React;`;

    // Collect all JS/JSX files (App.js + any component files)
    const jsFiles = Object.keys(src)
      .filter((p) => p.match(/\.jsx?$/) && !p.match(/^(index|main)\./))
      .sort((a, b) => (a.includes("App") ? 1 : 0) - (b.includes("App") ? 1 : 0));

    const strippedCode = jsFiles
      .map((p) => stripModuleSyntax(src[p]))
      .join("\n\n");

    const jsxSource = reactGlobals + "\n" + strippedCode;
    let code: string;
    try { code = transpileTSX(jsxSource); } catch { code = jsxSource; }

    return { code, componentName, styles, title: "App" };
  }

  // Legacy format: src/App.tsx + index.html + src/main.tsx
  const rawHtml = src["index.html"] ?? "";
  const styleMatch = rawHtml.match(/<style>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : "body{background:#fff;color:#111}";
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
  try { code = transpileTSX(tsxSource); } catch { code = tsxSource; }

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
    (function(){var _f=window.fetch;window.fetch=function(input,init){var body=init&&init.body;if(body&&typeof FormData!=='undefined'&&body instanceof FormData){var fe=null;body.forEach(function(v){if(v instanceof File)fe=v;});if(fe){return new Promise(function(res){var r=new FileReader();r.onload=function(e){var d=e.target.result;res(new Response(JSON.stringify({url:d,name:fe.name,size:fe.size,type:fe.type}),{status:200,headers:{'Content-Type':'application/json'}}));};r.readAsDataURL(fe);});}}return _f.apply(window,arguments);};})();
    ${fullCode}
  </script>
</body>
</html>`;
}

function editButton(projectId?: string): string {
  if (!projectId) return "";
  return `<a id="__tc_edit" href="https://thatcode.dev/projects/${projectId}" target="_blank" rel="noopener"
    style="position:fixed;bottom:16px;left:16px;z-index:99999;display:flex;align-items:center;gap:5px;background:#fff;border:1px solid #ececf1;border-radius:999px;padding:6px 12px 6px 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:600;color:#6a1ff7;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:opacity .15s;opacity:0.7"
    onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
    ✏️ Edit
  </a>`;
}

function thatcodeBadge(hideBadge: boolean): string {
  if (hideBadge) return "";
  return `
  <a id="__tc_badge" href="https://thatcode.dev" target="_blank" rel="noopener"
    title="Built with ThatCode — press T to visit"
    style="position:fixed;bottom:16px;right:16px;z-index:99999;display:flex;align-items:center;gap:6px;background:rgba(10,10,15,0.85);backdrop-filter:blur(8px);border:1px solid rgba(168,85,247,0.35);border-radius:999px;padding:5px 11px 5px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;color:#d8b4fe;text-decoration:none;box-shadow:0 2px 12px rgba(0,0,0,0.4);transition:opacity .15s">
    <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="url(#bg)"/><path d="M14 16L22 24L14 32" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 30L34 30" stroke="white" stroke-width="3" stroke-linecap="round"/><defs><linearGradient id="bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs></svg>
    Built with ThatCode
  </a>
  <script>
    document.addEventListener('keydown', function(e) {
      if (e.key === 't' || e.key === 'T') {
        var badge = document.getElementById('__tc_badge');
        if (badge && e.target === document.body) { window.open('https://thatcode.dev', '_blank'); }
      }
    });
  </script>`;
}

function storagePolyfill(slug: string): string {
  // tcSave/tcLoad: synced key-value store for published apps.
  // Falls back to localStorage when offline.
  return `(function(){
  var _slug='${slug}';
  var _base='';
  window.tcSave=function(key,value){
    try{localStorage.setItem('tc_'+_slug+'_'+key,JSON.stringify(value));}catch(e){}
    if(!_slug)return Promise.resolve();
    return fetch(_base+'/api/app-data/'+_slug,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:key,value:value})}).catch(function(){});
  };
  window.tcLoad=function(key,fallback){
    if(!_slug)return Promise.resolve(fallback??null);
    return fetch(_base+'/api/app-data/'+_slug+'?key='+encodeURIComponent(key)).then(function(r){return r.json();}).then(function(d){
      if(d.value!==null&&d.value!==undefined)return d.value;
      try{var lv=localStorage.getItem('tc_'+_slug+'_'+key);if(lv!==null)return JSON.parse(lv);}catch(e){}
      return fallback??null;
    }).catch(function(){
      try{var lv=localStorage.getItem('tc_'+_slug+'_'+key);if(lv!==null)return JSON.parse(lv);}catch(e){}
      return fallback??null;
    });
  };
})();`;
}

// Used for local export download — uses CDN (needs internet)
export function buildStandaloneHtml(projectFiles: ProjectFiles, projectName: string, projectId?: string, hideBadge = false, publishSlug?: string): string {
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
    // Cross-device storage
    ${publishSlug ? storagePolyfill(publishSlug) : "window.tcSave=function(){return Promise.resolve()};window.tcLoad=function(k,fb){return Promise.resolve(fb??null)};"}
    // Polyfill: intercept file uploads — convert to base64 data URL since there's no backend
    (function(){
      var _fetch = window.fetch;
      window.fetch = function(input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var body = init && init.body;
        // Detect multipart/FormData upload requests
        if (body && typeof FormData !== 'undefined' && body instanceof FormData) {
          var fileEntry = null;
          body.forEach(function(val, key) { if (val instanceof File) fileEntry = val; });
          if (fileEntry) {
            return new Promise(function(resolve) {
              var reader = new FileReader();
              reader.onload = function(e) {
                var dataUrl = e.target.result;
                var filename = fileEntry.name;
                var mockBody = JSON.stringify({ url: dataUrl, name: filename, size: fileEntry.size, type: fileEntry.type });
                resolve(new Response(mockBody, { status: 200, headers: { 'Content-Type': 'application/json', 'x-upload-polyfill': '1' } }));
              };
              reader.readAsDataURL(fileEntry);
            });
          }
        }
        return _fetch.apply(window, arguments);
      };
    })();
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
  ${thatcodeBadge(hideBadge)}
  ${editButton(projectId)}
</body>
</html>`;
}
