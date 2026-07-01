// Extra UI components — extends the section library to 50+ components

export const EXTRA_COMPONENTS: Record<string, string> = {

"/components/sections/Modal.tsx": `import React from 'react';
export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}`,

"/components/sections/Accordion.tsx": `import React, { useState } from 'react';
type Item = { title: string; content: string };
export default function Accordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-gray-200 border rounded-xl overflow-hidden">
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center px-5 py-4 text-left font-medium hover:bg-gray-50 transition-colors">
            {item.title}
            <span className={"transition-transform " + (open === i ? "rotate-180" : "")}>▼</span>
          </button>
          {open === i && <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{item.content}</div>}
        </div>
      ))}
    </div>
  );
}`,

"/components/sections/Avatar.tsx": `import React from 'react';
export default function Avatar({ src, name, size }: { src?: string; name: string; size?: number }) {
  const s = size || 40;
  return src
    ? <img src={src} alt={name} className="rounded-full object-cover" style={{ width: s, height: s }} />
    : <div className="rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600" style={{ width: s, height: s, fontSize: s * 0.4 }}>{name.charAt(0).toUpperCase()}</div>;
}`,

"/components/sections/Badge.tsx": `import React from 'react';
const BADGE_COLORS: Record<string, string> = { default: 'bg-gray-100 text-gray-700', primary: 'bg-orange-100 text-orange-700', success: 'bg-green-100 text-green-700', warning: 'bg-yellow-100 text-yellow-700', danger: 'bg-red-100 text-red-700' };
export default function Badge({ text, variant }: { text: string; variant?: string }) {
  return <span className={"inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold " + (BADGE_COLORS[variant || 'default'] || BADGE_COLORS.default)}>{text}</span>;
}`,

"/components/sections/Breadcrumb.tsx": `import React from 'react';
export default function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 px-10 py-3">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span>/</span>}
          {item.href ? <a href={item.href} className="hover:text-gray-900 transition-colors">{item.label}</a> : <span className="text-gray-900 font-medium">{item.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}`,

"/components/sections/Card.tsx": `import React from 'react';
export default function Card({ title, description, image, badge, footer }: { title: string; description?: string; image?: string; badge?: string; footer?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
      {image && <img src={image} alt={title} className="w-full h-48 object-cover" />}
      <div className="p-5">
        {badge && <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 mb-2">{badge}</span>}
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>}
        {footer && <div className="mt-4 pt-4 border-t border-gray-100">{footer}</div>}
      </div>
    </div>
  );
}`,

"/components/sections/Carousel.tsx": `import React, { useState } from 'react';
export default function Carousel({ images }: { images: { src: string; alt: string }[] }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <img src={images[idx].src} alt={images[idx].alt} className="w-full h-[400px] object-cover transition-all" />
      <button onClick={() => setIdx((idx - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-colors">&larr;</button>
      <button onClick={() => setIdx((idx + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-colors">&rarr;</button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => <div key={i} className={"w-2 h-2 rounded-full transition-colors " + (i === idx ? "bg-white" : "bg-white/40")} />)}
      </div>
    </div>
  );
}`,

"/components/sections/Countdown.tsx": `import React, { useState, useEffect } from 'react';
export default function Countdown({ target, label }: { target: string; label?: string }) {
  const calc = () => { const d = new Date(target).getTime() - Date.now(); return d > 0 ? { days: Math.floor(d/86400000), hours: Math.floor((d%86400000)/3600000), mins: Math.floor((d%3600000)/60000), secs: Math.floor((d%60000)/1000) } : { days:0, hours:0, mins:0, secs:0 }; };
  const [t, setT] = useState(calc());
  useEffect(() => { const i = setInterval(() => setT(calc()), 1000); return () => clearInterval(i); }, []);
  return (
    <div className="text-center py-12">
      {label && <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">{label}</p>}
      <div className="flex justify-center gap-4">
        {[['days',t.days],['hours',t.hours],['mins',t.mins],['secs',t.secs]].map(([l,v]) => (
          <div key={l as string} className="bg-gray-900 text-white rounded-xl px-5 py-4 min-w-[80px]">
            <p className="text-3xl font-bold">{String(v).padStart(2,'0')}</p>
            <p className="text-xs uppercase text-gray-400 mt-1">{l as string}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,

"/components/sections/DataTable.tsx": `import React, { useState } from 'react';
export default function DataTable({ columns, rows }: { columns: string[]; rows: Record<string, string | number>[] }) {
  const [sort, setSort] = useState<{ col: string; asc: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const filtered = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  const sorted = sort ? [...filtered].sort((a, b) => { const av = a[sort.col], bv = b[sort.col]; return sort.asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1); }) : filtered;
  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:border-gray-400" />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">{columns.map(c => <th key={c} onClick={() => setSort({ col: c, asc: sort?.col === c ? !sort.asc : true })} className="text-left px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100">{c} {sort?.col === c ? (sort.asc ? '↑' : '↓') : ''}</th>)}</tr></thead>
          <tbody>{sorted.map((r, i) => <tr key={i} className="border-b hover:bg-gray-50">{columns.map(c => <td key={c} className="px-4 py-3">{r[c]}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}`,

"/components/sections/EmptyState.tsx": `import React from 'react';
export default function EmptyState({ icon, title, description, cta }: { icon?: string; title: string; description?: string; cta?: { text: string; onClick: () => void } }) {
  return (
    <div className="text-center py-16 px-6">
      {icon && <span className="text-5xl mb-4 block">{icon}</span>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">{description}</p>}
      {cta && <button onClick={cta.onClick} className="mt-4 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors">{cta.text}</button>}
    </div>
  );
}`,

"/components/sections/FileUpload.tsx": `import React, { useState, useRef } from 'react';
export default function FileUpload({ label, accept, onFile }: { label?: string; accept?: string; onFile?: (file: File) => void }) {
  const [name, setName] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setName(f.name); onFile?.(f); } }} />
      <p className="text-2xl mb-2">📁</p>
      <p className="text-sm font-medium text-gray-700">{name || label || 'Click to upload a file'}</p>
      <p className="text-xs text-gray-400 mt-1">{accept || 'Any file type'}</p>
    </div>
  );
}`,

"/components/sections/LoginForm.tsx": `import React, { useState } from 'react';
export default function LoginForm({ onLogin, title }: { onLogin?: (email: string, password: string) => void; title?: string }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const handle = () => { if (!email || !pw) { setError('Please fill in all fields'); return; } setError(''); onLogin?.(email, pw); };
  return (
    <div className="max-w-sm mx-auto p-8">
      <h2 className="text-2xl font-bold text-center mb-6">{title || 'Sign In'}</h2>
      {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-3 focus:outline-none focus:border-gray-400" />
      <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Password" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-4 focus:outline-none focus:border-gray-400" />
      <button onClick={handle} className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">Sign In</button>
    </div>
  );
}`,

"/components/sections/ProgressBar.tsx": `import React from 'react';
export default function ProgressBar({ value, max, label, color }: { value: number; max?: number; label?: string; color?: string }) {
  const pct = Math.min(100, (value / (max || 100)) * 100);
  return (
    <div>
      {label && <div className="flex justify-between text-sm mb-1"><span className="font-medium">{label}</span><span className="text-gray-500">{Math.round(pct)}%</span></div>}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: color || '#f97316' }} />
      </div>
    </div>
  );
}`,

"/components/sections/Rating.tsx": `import React, { useState } from 'react';
export default function Rating({ value, max, onChange, size }: { value?: number; max?: number; onChange?: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const m = max || 5;
  const s = size || 24;
  const [val, setVal] = useState(value || 0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: m }, (_, i) => (
        <button key={i} onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)} onClick={() => { setVal(i + 1); onChange?.(i + 1); }}
          style={{ fontSize: s, cursor: 'pointer', background: 'none', border: 'none', color: (hover || val) > i ? '#f59e0b' : '#d1d5db' }}>★</button>
      ))}
    </div>
  );
}`,

"/components/sections/SearchBar.tsx": `import React, { useState } from 'react';
export default function SearchBar({ placeholder, onSearch }: { placeholder?: string; onSearch?: (q: string) => void }) {
  const [q, setQ] = useState('');
  return (
    <div className="relative max-w-xl mx-auto">
      <input value={q} onChange={(e) => { setQ(e.target.value); onSearch?.(e.target.value); }} placeholder={placeholder || 'Search...'} className="w-full border border-gray-200 rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-gray-400 shadow-sm" />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
    </div>
  );
}`,

"/components/sections/Sidebar.tsx": `import React from 'react';
type NavItem = { label: string; icon?: string; active?: boolean; onClick?: () => void };
export default function Sidebar({ brand, items }: { brand: string; items: NavItem[] }) {
  return (
    <aside className="w-60 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <h2 className="text-lg font-bold px-3 py-4 border-b border-gray-800 mb-4">{brand}</h2>
      <nav className="flex flex-col gap-1">
        {items.map((item, i) => (
          <button key={i} onClick={item.onClick} className={"w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors " + (item.active ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:text-white hover:bg-white/5")}>
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}`,

"/components/sections/Skeleton.tsx": `import React from 'react';
export default function Skeleton({ width, height, rounded }: { width?: string; height?: string; rounded?: boolean }) {
  return <div className={"animate-pulse bg-gray-200 " + (rounded ? "rounded-full" : "rounded-lg")} style={{ width: width || '100%', height: height || '20px' }} />;
}`,

"/components/sections/Stepper.tsx": `import React from 'react';
export default function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 px-4">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={"flex items-center gap-2 " + (i <= current ? "text-orange-600" : "text-gray-400")}>
            <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " + (i < current ? "bg-orange-600 text-white" : i === current ? "border-2 border-orange-600 text-orange-600" : "border-2 border-gray-300")}>{i < current ? '✓' : i + 1}</div>
            <span className="text-sm font-medium hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={"flex-1 h-0.5 " + (i < current ? "bg-orange-600" : "bg-gray-200")} />}
        </React.Fragment>
      ))}
    </div>
  );
}`,

"/components/sections/Switch.tsx": `import React from 'react';
export default function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button onClick={() => onChange(!checked)} className={"relative w-11 h-6 rounded-full transition-colors " + (checked ? "bg-orange-600" : "bg-gray-300")}>
        <div className={"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform " + (checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}`,

"/components/sections/Toast.tsx": `import React, { useState, useEffect } from 'react';
const TOAST_COLORS: Record<string, string> = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
export default function Toast({ message, type, duration, onClose }: { message: string; type?: string; duration?: number; onClose?: () => void }) {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => { setShow(false); onClose?.(); }, duration || 3000); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div className={"fixed bottom-4 right-4 z-50 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 " + (TOAST_COLORS[type || 'info'])}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setShow(false); onClose?.(); }} className="text-white/70 hover:text-white">&times;</button>
    </div>
  );
}`,

"/components/sections/Tooltip.tsx": `import React, { useState } from 'react';
export default function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">{text}</div>}
    </div>
  );
}`,

"/components/sections/VideoPlayer.tsx": `import React from 'react';
export default function VideoPlayer({ src, poster, title }: { src: string; poster?: string; title?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      {title && <div className="bg-gray-900 text-white px-4 py-2 text-sm font-medium">{title}</div>}
      <video src={src} poster={poster} controls className="w-full" />
    </div>
  );
}`,

"/components/sections/Divider.tsx": `import React from 'react';
export default function Divider({ text }: { text?: string }) {
  return text
    ? <div className="flex items-center gap-4 py-8"><div className="flex-1 h-px bg-gray-200" /><span className="text-sm text-gray-400">{text}</span><div className="flex-1 h-px bg-gray-200" /></div>
    : <hr className="border-gray-200 my-8" />;
}`,

"/components/sections/Map.tsx": `import React from 'react';
export default function MapSection({ address, height }: { address: string; height?: number }) {
  const q = encodeURIComponent(address);
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: height || 300 }}>
      <iframe src={"https://maps.google.com/maps?q=" + q + "&output=embed"} className="w-full h-full border-0" loading="lazy" title="Map" />
    </div>
  );
}`,

"/components/sections/Marquee.tsx": `import React from 'react';
export default function Marquee({ items, speed }: { items: string[]; speed?: number }) {
  const s = speed || 30;
  const text = items.join(' • ');
  return (
    <div className="overflow-hidden py-3 bg-gray-50 border-y border-gray-200">
      <div className="animate-marquee whitespace-nowrap flex gap-8">
        <span className="text-sm text-gray-500 font-medium">{text} • {text}</span>
      </div>
      <style>{\`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } } .animate-marquee { animation: marquee \${s}s linear infinite; }\`}</style>
    </div>
  );
}`,

"/components/sections/Pagination.tsx": `import React from 'react';
export default function Pagination({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1">
      <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current === 1} className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-30">&larr;</button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)} className={"px-3 py-2 rounded-lg text-sm font-medium " + (p === current ? "bg-gray-900 text-white" : "hover:bg-gray-100")}>{p}</button>
      ))}
      <button onClick={() => onPage(Math.min(total, current + 1))} disabled={current === total} className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-30">&rarr;</button>
    </div>
  );
}`,

"/components/sections/Select.tsx": `import React, { useState } from 'react';
export default function Select({ options, value, onChange, placeholder }: { options: { label: string; value: string }[]; value?: string; onChange?: (v: string) => void; placeholder?: string }) {
  return (
    <select value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:border-gray-400">
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}`,

"/components/sections/Popover.tsx": `import React, { useState } from 'react';
export default function Popover({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && <><div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /><div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[200px]">{children}</div></>}
    </div>
  );
}`,

"/components/sections/Testimonial.tsx": `import React from 'react';
export default function Testimonial({ quote, name, role, image, rating }: { quote: string; name: string; role?: string; image?: string; rating?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {rating && <div className="text-yellow-400 mb-3">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>}
      <p className="text-gray-700 italic leading-relaxed mb-4">"{quote}"</p>
      <div className="flex items-center gap-3">
        {image && <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" />}
        <div><p className="font-semibold text-sm">{name}</p>{role && <p className="text-xs text-gray-500">{role}</p>}</div>
      </div>
    </div>
  );
}`,

"/components/sections/NotificationBell.tsx": `import React, { useState } from 'react';
type Notif = { id: number; text: string; time: string; read?: boolean };
export default function NotificationBell({ notifications }: { notifications: Notif[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
        🔔
        {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-sm">Notifications</div>
          {notifications.map(n => (
            <div key={n.id} className={"px-4 py-3 text-sm border-b hover:bg-gray-50 " + (n.read ? "opacity-60" : "")}>
              <p>{n.text}</p><p className="text-xs text-gray-400 mt-1">{n.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`,

};

export const EXTRA_COMPONENT_LIST = `
- Modal: <Modal open={showModal} onClose={() => setShowModal(false)} title="Title">content</Modal>
- Accordion: <Accordion items={[{title:"Question", content:"Answer"}]} />
- Avatar: <Avatar name="John" src="{{unsplash:man|100x100}}" size={40} />
- Badge: <Badge text="New" variant="primary" /> (variants: default, primary, success, warning, danger)
- Breadcrumb: <Breadcrumb items={[{label:"Home",href:"#"},{label:"Products"}]} />
- Card: <Card title="Title" description="Desc" image="{{unsplash:product|400x300}}" badge="New" />
- Carousel: <Carousel images={[{src:"{{unsplash:photo|800x400}}", alt:"Photo"}]} />
- Countdown: <Countdown target="2026-12-31" label="Sale ends in" />
- DataTable: <DataTable columns={["Name","Email","Role"]} rows={[{Name:"John",Email:"john@x.com",Role:"Admin"}]} />
- EmptyState: <EmptyState icon="📭" title="No items yet" description="Add your first item" />
- FileUpload: <FileUpload label="Drop files here" accept="image/*" />
- LoginForm: <LoginForm onLogin={(email,pw) => console.log(email,pw)} />
- ProgressBar: <ProgressBar value={75} label="Progress" />
- Rating: <Rating value={4} onChange={(v) => console.log(v)} />
- SearchBar: <SearchBar placeholder="Search products..." onSearch={(q) => console.log(q)} />
- Sidebar: <Sidebar brand="Admin" items={[{label:"Dashboard",icon:"📊",active:true}]} />
- Skeleton: <Skeleton width="100%" height="200px" />
- Stepper: <Stepper steps={["Cart","Shipping","Payment","Done"]} current={1} />
- Switch: <Switch checked={true} onChange={(v) => console.log(v)} label="Dark mode" />
- Toast: <Toast message="Saved!" type="success" />
- Tooltip: <Tooltip text="Help text"><button>Hover me</button></Tooltip>
- Divider: <Divider text="or" />
- Map: <Map address="123 Main St, New York" height={300} />
- Marquee: <Marquee items={["Free shipping","New arrivals","Sale 50% off"]} />
- Pagination: <Pagination current={1} total={5} onPage={(p) => console.log(p)} />
- Select: <Select options={[{label:"Option 1",value:"1"}]} placeholder="Choose..." />
- Popover: <Popover trigger={<button>Click</button>}>Popover content</Popover>
- Testimonial: <Testimonial quote="Amazing!" name="Sarah" role="CEO" rating={5} />
- NotificationBell: <NotificationBell notifications={[{id:1, text:"New order", time:"2m ago"}]} />`;
