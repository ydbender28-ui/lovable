// Pre-built page section components — injected into every Sandpack project
// The AI composes pages by picking sections and passing props (data only, no styling needed)

export const SECTION_COMPONENTS: Record<string, string> = {

"/components/sections/Navbar.tsx": `import React, { useState, useEffect, useRef } from 'react';
interface NavLink { label: string; href?: string; }
interface NavbarProps { brand?: string; logo?: string; logoImage?: string; links?: any[]; cta?: any; ctaHref?: string; showCart?: boolean; onNavigate?: (page: string) => void; cartCount?: number; onCartClick?: () => void; accentColor?: string; }
export default function Navbar({ brand, logo, logoImage, links, cta, ctaHref, showCart, onNavigate, cartCount: cartCountProp, onCartClick, accentColor }: NavbarProps) {
  const accent = accentColor || '#111';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [cartCount, setCartCount] = useState(cartCountProp ?? 0);
  const cartOpenerRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); },
      { threshold: 0.5, rootMargin: '-100px 0px -50% 0px' }
    );
    document.querySelectorAll('[id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent).detail; setCartCount(d.count); if (d.open) cartOpenerRef.current = d.open; };
    window.addEventListener('cartupdate', h);
    return () => window.removeEventListener('cartupdate', h);
  }, []);
  const handleCartClick = () => { if (onCartClick) onCartClick(); else if (cartOpenerRef.current) cartOpenerRef.current(); else window.dispatchEvent(new CustomEvent('carttrigger', { detail: 'open' })); };
  const brandName = logo || brand || '';
  const logoSrc = logoImage || (brandName.startsWith('http') ? brandName : '');
  const rawLinks = Array.isArray(links) ? links : [];
  const navLinks: NavLink[] = rawLinks.map(l => typeof l === 'string' ? { label: l } : { label: l?.label || l?.name || l?.text || String(l), href: l?.href });
  const ctaLink: NavLink | null = cta ? (typeof cta === 'string' ? { label: cta, href: ctaHref || '#contact' } : { label: cta.label || cta.text || cta.name || String(cta), href: cta.href || ctaHref || '#contact' }) : null;
  const aliases: Record<string,string> = { services:'services', about:'about', reviews:'reviews', menu:'menu', booking:'booking', book:'booking', reserve:'booking', reservations:'booking', contact:'contact', gallery:'gallery', team:'team', pricing:'pricing', plans:'pricing', faq:'faq', location:'location', directions:'location', hours:'hours', results:'results', portfolio:'portfolio', shop:'shop', work:'portfolio', process:'process', features:'features', stats:'stats', video:'video', events:'events', partners:'partners', blog:'blog', download:'download', offer:'offer', dashboard:'dashboard', kanban:'kanban', orders:'orders', users:'users', analytics:'analytics', integrations:'integrations', comparison:'comparison', membership:'membership', reservation:'reservation' };
  const handleClick = (label: string, href?: string) => (e: React.MouseEvent) => {
    if (onNavigate) { e.preventDefault(); onNavigate(label.toLowerCase()); return; }
    if (href && href !== '#' && !href.startsWith('#')) { return; }
    e.preventDefault();
    const slug = label.toLowerCase().replace(/\s+/g, '-');
    let el: HTMLElement | null = document.getElementById(slug) || document.getElementById(slug.replace(/-/g,'')) || document.getElementById(aliases[slug] || slug);
    if (!el) { const secs = document.querySelectorAll('section, [id]'); for (const s of secs) { const h = s.querySelector('h1,h2,h3'); if (h && h.textContent && h.textContent.toLowerCase().includes(label.toLowerCase())) { el = s as HTMLElement; break; } } }
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const isActive = (label: string) => { const slug = label.toLowerCase().replace(/\s+/g, '-'); return activeSection === slug || activeSection === (aliases[slug] || slug); };
  return (
    <>
      <a href="#main-content" style={{ position:'fixed', top:'-40px', left:0, background:accent, color:'#fff', padding:'8px 16px', zIndex:9999, borderRadius:'0 0 4px 0', transition:'top 0.2s', textDecoration:'none', fontSize:14, fontWeight:600 }} onFocus={e => e.currentTarget.style.top='0'} onBlur={e => e.currentTarget.style.top='-40px'}>Skip to main content</a>
      <nav role="navigation" aria-label="Main navigation" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: scrolled ? 60 : 80,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : 'none',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s ease',
        padding: isMobile ? '0 20px' : '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#" onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate('home'); } : undefined} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10 }}>
          {logoSrc ? <img src={logoSrc} alt={brandName} style={{ height: scrolled ? 32 : 40, width:'auto', transition:'height 0.3s ease', objectFit:'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} /> : <span style={{ fontSize:20, fontWeight:800, color:'#111', letterSpacing:'-0.02em' }}>{brandName}</span>}
        </a>
        {!isMobile ? (
          <div style={{ display:'flex', gap:28, alignItems:'center' }}>
            {navLinks.map((l, i) => (
              <a key={i} href={l.href || \`#\${l.label.toLowerCase().replace(/\s+/g,'-')}\`} onClick={handleClick(l.label, l.href)}
                style={{ fontSize:14, color: isActive(l.label) ? accent : '#555', textDecoration:'none', fontWeight: isActive(l.label) ? 700 : 500, cursor:'pointer', transition:'color 0.2s', position:'relative', paddingBottom:2 }}
                onMouseOver={e=>(e.currentTarget as HTMLElement).style.color=accent}
                onMouseOut={e=>(e.currentTarget as HTMLElement).style.color=isActive(l.label) ? accent : '#555'}>
                {l.label}
                {isActive(l.label) && <span style={{ position:'absolute', bottom:-4, left:0, right:0, height:2, background:accent, borderRadius:1 }} />}
              </a>
            ))}
            {ctaLink && (
              <button onClick={handleClick(ctaLink.label, ctaLink.href)} style={{
                background: accent, color: '#fff', border: 'none',
                padding: '10px 22px', borderRadius: 30, cursor: 'pointer',
                fontWeight: 700, fontSize: 15, letterSpacing: '0.01em',
                transition: 'opacity 0.2s, transform 0.15s',
                boxShadow: \`0 4px 14px \${accent}50\`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = ''; }}>
                {ctaLink.label}
              </button>
            )}
            {showCart && <button type="button" aria-label={\`Shopping cart, \${cartCount} item\${cartCount!==1?'s':''}\`} onClick={handleCartClick} style={{ position:'relative', background:'none', border:'1.5px solid #e5e5e5', padding:'8px 14px', borderRadius:50, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:600, color:'#111', transition:'border-color 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.borderColor='#111'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor='#e5e5e5'}>
              🛒 {cartCount > 0 && <span aria-hidden="true" style={{ background:accent, color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{cartCount}</span>}
            </button>}
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {showCart && <button type="button" aria-label={\`Cart \${cartCount}\`} onClick={handleCartClick} style={{ background:'none', border:'1.5px solid #e5e5e5', padding:'7px 12px', borderRadius:50, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:14, fontWeight:600, color:'#111' }}>🛒{cartCount > 0 && <span style={{ background:accent, color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{cartCount}</span>}</button>}
            <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', padding:8, display:'flex', flexDirection:'column', gap:5, alignItems:'center', justifyContent:'center' }}>
              <span style={{ display:'block', width:22, height:2, background:'#111', borderRadius:2, transition:'all 0.25s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ display:'block', width:22, height:2, background:'#111', borderRadius:2, transition:'all 0.25s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display:'block', width:22, height:2, background:'#111', borderRadius:2, transition:'all 0.25s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        )}
      </nav>
      {isMobile && (
        <div style={{
          position: 'fixed', top: menuOpen ? 60 : -500, left: 0, right: 0,
          background: 'var(--card, #fff)', borderBottom: '1px solid var(--border, #eee)',
          padding: '20px 24px 24px', transition: 'top 0.3s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 999,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {navLinks.map((link, i) => (
            <button key={i} onClick={(e) => { handleClick(link.label, link.href)(e); setMenuOpen(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px',
                borderRadius: 8, textAlign: 'left', fontSize: 17, fontWeight: isActive(link.label) ? 700 : 500,
                color: isActive(link.label) ? accent : 'var(--fg, #111)', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--muted, #f5f5f5)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
              {link.label}
            </button>
          ))}
          {ctaLink && (
            <button onClick={(e) => { handleClick(ctaLink.label, ctaLink.href)(e); setMenuOpen(false); }} style={{
              marginTop: 8, background: accent, color: '#fff', border: 'none',
              padding: '14px 24px', borderRadius: 30, cursor: 'pointer', fontWeight: 700, fontSize: 16
            }}>{ctaLink.label}</button>
          )}
        </div>
      )}
    </>
  );
}`,

"/components/sections/Hero.tsx": `import React, { useState, useEffect, useRef } from 'react';
export default function Hero({ tag, title, subtitle, cta1, cta2, image }: { tag?: string; title: string; subtitle: string; cta1?: { text: string; href?: string }; cta2?: { text: string; href?: string }; image: string }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 }); if(ref.current) obs.observe(ref.current); return () => obs.disconnect(); }, []);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ position:'relative', minHeight: isMobile ? '50vh' : '65vh', display:'flex', alignItems:'center', overflow:'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <img src={image} alt={title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))' }} />
      <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding: isMobile ? '48px 20px' : '80px 40px', color:'#fff' }}>
        {tag && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:16, opacity:0.8 }}>{tag}</p>}
        <h1 style={{ fontSize:'clamp(28px, 6vw, 72px)', fontWeight:800, lineHeight:1.05, maxWidth:700, letterSpacing:'-0.03em' }}>{title}</h1>
        <p style={{ fontSize: isMobile ? 15 : 18, lineHeight:1.6, maxWidth:500, marginTop:24, opacity:0.85 }}>{subtitle}</p>
        <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16, marginTop: isMobile ? 28 : 40 }}>
          {cta1 && <a href={cta1.href||'#'} style={{ background:'var(--accent, #c2410c)', color:'#fff', padding:'14px 32px', borderRadius:50, fontSize:15, fontWeight:600, textDecoration:'none', transition:'opacity 0.2s', textAlign:'center' }} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{cta1.text}</a>}
          {cta2 && <a href={cta2.href||'#'} style={{ border:'1px solid rgba(255,255,255,0.4)', color:'#fff', padding:'14px 32px', borderRadius:50, fontSize:15, fontWeight:600, textDecoration:'none', transition:'background 0.2s', textAlign:'center' }} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{cta2.text}</a>}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Features.tsx": `import React from 'react';
type Feature = { icon?: string; title: string; desc: string };
export default function Features({ tag, title, items }: { tag?: string; title: string; items: Feature[] }) {
  const safeItems = (items || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth < 768);
  React.useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ padding: isMobile ? '48px 20px' : '100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      {tag && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', color:'var(--accent, #c2410c)', marginBottom:8 }}>{tag}</p>}
      <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:60 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:32 }}>
        {safeItems.map((f, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #eee', borderRadius:16, padding:32, transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
            {f.icon && <div style={{ fontSize:28, marginBottom:16 }}>{f.icon}</div>}
            <h3 style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>{f.title}</h3>
            <p style={{ fontSize:15, color:'#666', lineHeight:1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/MenuGrid.tsx": `import React, { useState, useEffect } from 'react';
type MenuItem = { id?: number; name: string; price: number | string; desc: string; category: string; badge?: string; image?: string };
type CartItem = { item: MenuItem; qty: number };
export default function MenuGrid({ title, subtitle, items, categories, accentColor }: { title: string; subtitle?: string; items: MenuItem[]; categories?: string[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean) as MenuItem[];
  const cats = categories || [...new Set(safeItems.map(i => i.category))];
  const [active, setActive] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [adding, setAdding] = useState<string|null>(null);
  const filtered = active === 'All' ? safeItems : safeItems.filter(i => i.category === active);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + (parseFloat(String(c.item.price)) * c.qty), 0);
  useEffect(() => { window.dispatchEvent(new CustomEvent('cartupdate', { detail: { count: cartCount, open: () => setCartOpen(true) } })); }, [cartCount]);
  useEffect(() => { const h = (e: Event) => { if ((e as CustomEvent).detail === 'open') setCartOpen(true); }; window.addEventListener('carttrigger', h); return () => window.removeEventListener('carttrigger', h); }, []);
  const addToCart = (item: MenuItem) => {
    setAdding(item.name);
    setTimeout(() => setAdding(null), 700);
    setCart(prev => { const ex = prev.find(c => c.item.name === item.name); return ex ? prev.map(c => c.item.name === item.name ? {...c, qty: c.qty+1} : c) : [...prev, {item, qty:1}]; });
  };
  const updateQty = (name: string, delta: number) => setCart(prev => prev.map(c => c.item.name === name ? {...c, qty: Math.max(0, c.qty+delta)} : c).filter(c => c.qty > 0));
  const handleCheckout = () => { setCheckedOut(true); setTimeout(() => { setCart([]); setCheckedOut(false); setCartOpen(false); }, 3000); };
  return (
    <section id="menu" style={{ padding:'80px 40px', background:'var(--bg,#faf9f7)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:8 }}>{title}</h2>
        {subtitle && <p style={{ color:'#888', fontSize:16, marginBottom:32 }}>{subtitle}</p>}
        <div style={{ display:'flex', gap:8, marginBottom:40, flexWrap:'wrap' }}>
          {['All', ...cats].map(c => (
            <button type="button" aria-pressed={active===c} key={c} onClick={() => setActive(c)} style={{ padding:'8px 20px', borderRadius:50, border: active===c ? 'none' : '1.5px solid #e5e5e5', background: active===c ? accent : 'transparent', color: active===c ? '#fff' : '#666', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.18s', letterSpacing:'0.01em' }}>{c}</button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:24 }}>
          {filtered.map((item, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', transition:'transform 0.2s,box-shadow 0.2s' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 16px 40px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'}}>
              {item.image && <div style={{ position:'relative' }}><img src={item.image} alt={item.name} style={{ width:'100%', height:210, objectFit:'cover', display:'block' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />{item.badge && <span style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50, letterSpacing:'0.05em', textTransform:'uppercase' }}>{item.badge}</span>}</div>}
              <div style={{ padding:'18px 20px 20px' }}>
                {!item.image && item.badge && <span style={{ fontSize:11, background:accent, color:'#fff', padding:'3px 10px', borderRadius:50, fontWeight:700, marginBottom:10, display:'inline-block', textTransform:'uppercase', letterSpacing:'0.05em' }}>{item.badge}</span>}
                <h3 style={{ fontSize:16, fontWeight:700, margin:'0 0 5px', letterSpacing:'-0.01em' }}>{item.name}</h3>
                <p style={{ fontSize:13, color:'#999', margin:'0 0 16px', lineHeight:1.55 }}>{item.desc}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em' }}>\${parseFloat(String(item.price)).toFixed(2)}</span>
                  <button onClick={() => addToCart(item)} style={{ background: adding===item.name ? '#22c55e' : accent, color:'#fff', border:'none', borderRadius:50, padding:'9px 20px', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:6 }}>
                    {adding===item.name ? '✓ Added' : '+ Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {cartOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:1000 }}>
          <div onClick={() => setCartOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'100%', maxWidth:420, background:'#fff', display:'flex', flexDirection:'column', boxShadow:'-8px 0 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'24px 28px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h2 style={{ fontSize:22, fontWeight:800, margin:0, letterSpacing:'-0.02em' }}>Your Order</h2>
                <p style={{ fontSize:13, color:'#999', margin:'2px 0 0' }}>{cartCount} {cartCount===1?'item':'items'}</p>
              </div>
              <button type="button" aria-label="Close cart" onClick={() => setCartOpen(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:50, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#666', transition:'background 0.15s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#eee'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='#f5f5f5'}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
              {cart.length === 0 && <div style={{ textAlign:'center', padding:'60px 0', color:'#ccc' }}><div style={{ fontSize:48, marginBottom:12 }}>🛍️</div><p style={{ fontSize:15, fontWeight:500 }}>Your cart is empty</p></div>}
              {cart.map((c, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid #f5f5f5' }}>
                  {c.item.image && <img src={c.item.image} alt={c.item.name} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', flexShrink:0 }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.item.name}</div>
                    <div style={{ fontSize:13, color:'#999' }}>\${parseFloat(String(c.item.price)).toFixed(2)} each</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <button onClick={() => updateQty(c.item.name, -1)} style={{ background:'#f5f5f5', border:'none', borderRadius:50, width:30, height:30, cursor:'pointer', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', color:'#333', transition:'background 0.15s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#eee'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='#f5f5f5'}>−</button>
                    <span style={{ fontWeight:700, fontSize:15, minWidth:20, textAlign:'center' }}>{c.qty}</span>
                    <button onClick={() => updateQty(c.item.name, 1)} style={{ background:accent, color:'#fff', border:'none', borderRadius:50, width:30, height:30, cursor:'pointer', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', transition:'opacity 0.15s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.85'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>+</button>
                  </div>
                  <div style={{ fontWeight:800, fontSize:15, minWidth:52, textAlign:'right' }}>\${(parseFloat(String(c.item.price))*c.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding:'20px 28px 28px', borderTop:'1px solid #f0f0f0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13, color:'#999' }}>
                  <span>Subtotal</span><span>\${cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20, fontSize:19, fontWeight:800, letterSpacing:'-0.02em' }}>
                  <span>Total</span><span>\${cartTotal.toFixed(2)}</span>
                </div>
                {checkedOut ? (
                  <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:16, padding:'20px', textAlign:'center' }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>✓</div>
                    <div style={{ fontWeight:800, fontSize:16, color:'#166534' }}>Order Placed!</div>
                    <div style={{ fontSize:13, color:'#4ade80', marginTop:4 }}>We'll have it ready shortly.</div>
                  </div>
                ) : (
                  <button onClick={handleCheckout} style={{ width:'100%', background:accent, color:'#fff', border:'none', borderRadius:14, padding:'16px', fontWeight:800, fontSize:16, cursor:'pointer', letterSpacing:'-0.01em', transition:'opacity 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>Place Order · \${cartTotal.toFixed(2)}</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}`,

"/components/sections/Testimonials.tsx": `import React, { useState, useEffect } from 'react';
type Testimonial = { quote: string; name: string; role: string; image?: string; companyLogo?: string; videoId?: string; featured?: boolean };
export default function Testimonials({ title, items, accentColor }: { title: string; items: Testimonial[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#6366f1)';
  const safeItems = (items || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [videoModal, setVideoModal] = React.useState<string|null>(null);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  const featuredItem = safeItems.find(t => t.featured);
  const regularItems = safeItems.filter(t => !t.featured);
  return (
    <section ref={ref as any} style={{ padding: isMobile ? '48px 20px' : '100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:60, color:'var(--fg,#111)' }}>{title}</h2>
      {featuredItem && (
        <div style={{ background:\`linear-gradient(135deg,\${accent}12,\${accent}04)\`, border:\`1.5px solid \${accent}30\`, borderRadius:24, padding: isMobile ? '32px 24px' : '48px 56px', marginBottom:40, position:'relative', overflow:'hidden' }}>
          <div style={{ fontSize:80, color:accent, opacity:0.15, position:'absolute', top:-10, left:24, fontFamily:'Georgia,serif', lineHeight:1 }}>"</div>
          <p style={{ fontSize: isMobile ? 20 : 28, lineHeight:1.6, color:'var(--fg,#111)', fontStyle:'italic', fontWeight:300, marginBottom:32, position:'relative' }}>"{featuredItem.quote}"</p>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            {featuredItem.image && <img src={featuredItem.image} alt={featuredItem.name} style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:\`3px solid \${accent}40\` }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />}
            <div>
              <p style={{ fontWeight:700, fontSize:17, color:'var(--fg,#111)', margin:0 }}>{featuredItem.name}</p>
              <p style={{ fontSize:14, color:'#888', margin:'2px 0 0' }}>{featuredItem.role}</p>
            </div>
            {featuredItem.companyLogo && <img src={featuredItem.companyLogo} alt="company" style={{ height:28, objectFit:'contain', opacity:0.7, marginLeft:'auto' }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />}
            {featuredItem.videoId && (
              <button onClick={()=>setVideoModal(featuredItem.videoId!)} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, background:accent, color:'#fff', border:'none', borderRadius:50, padding:'10px 20px', cursor:'pointer', fontWeight:600, fontSize:14 }}>
                <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>&#9658;</span> Watch Story
              </button>
            )}
          </div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:28 }}>
        {regularItems.map((t, i) => (
          <div key={i} style={{ background:'var(--bg,#faf9f7)', borderRadius:20, padding:32, transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', position:'relative' }}
            onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}}
            onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
            <span style={{ fontSize:32, color:accent, opacity:0.3, fontFamily:'Georgia,serif', lineHeight:1, display:'block', marginBottom:4 }}>"</span>
            <p style={{ fontSize:15, lineHeight:1.8, color:'var(--fg,#333)', fontStyle:'italic', marginBottom:24 }}>{t.quote}</p>
            {t.videoId && (
              <button onClick={()=>setVideoModal(t.videoId!)} style={{ width:'100%', height:120, borderRadius:12, background:'#111', border:'none', cursor:'pointer', marginBottom:20, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={\`https://img.youtube.com/vi/\${t.videoId}/mqdefault.jpg\`} alt="video" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.7 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
                <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
                  <span style={{ fontSize:16, marginLeft:3 }}>&#9658;</span>
                </div>
              </button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {t.image ? <img src={t.image} alt={t.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}} /> : <div style={{ width:44, height:44, borderRadius:'50%', background:\`\${accent}20\`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:accent, fontSize:18 }}>{t.name[0]}</div>}
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, fontSize:15, color:'var(--fg,#111)', margin:0 }}>{t.name}</p>
                <p style={{ fontSize:13, color:'#888', margin:'2px 0 0' }}>{t.role}</p>
              </div>
              {t.companyLogo && <img src={t.companyLogo} alt="logo" style={{ height:22, objectFit:'contain', opacity:0.6 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />}
            </div>
          </div>
        ))}
      </div>
      {videoModal && (
        <div onClick={()=>setVideoModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:800, aspectRatio:'16/9', borderRadius:16, overflow:'hidden', position:'relative' }}>
            <iframe src={\`https://www.youtube.com/embed/\${videoModal}?autoplay=1\`} allow="autoplay; encrypted-media" allowFullScreen style={{ width:'100%', height:'100%', border:'none' }} />
            <button onClick={()=>setVideoModal(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>&#215;</button>
          </div>
        </div>
      )}
    </section>
  );
}`,
"/components/sections/Contact.tsx": `import React, { useState, useEffect } from 'react';
type ContactInfo = { label: string; value: string; href?: string; icon?: string };
export default function Contact({ title, subtitle, items }: { title: string; subtitle?: string; items: ContactInfo[] }) {
  const safeItems = (items || []).filter(Boolean);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const handleContactSubmit = async () => {
    if (!form.name || !form.email) return;
    setSubmitting(true);
    try {
      await fetch('/api/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'contact', fields: { Name: form.name, Email: form.email, Message: form.message } }),
      });
    } catch {}
    setSent(true);
    setSubmitting(false);
  };
  const accent = 'var(--accent, #c2410c)';
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fafafa', boxSizing: 'border-box', transition: 'border-color 0.2s' };
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} id="contact" style={{ padding: isMobile ? '48px 20px' : '100px 40px', background: '#fff', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</h2>
        {subtitle && <p style={{ color: '#666', fontSize: 16, marginBottom: 56 }}>{subtitle}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: isMobile ? 40 : 80, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {safeItems.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {c.icon && <span style={{ fontSize: 20, marginTop: 2 }}>{c.icon}</span>}
                <div>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', marginBottom: 4 }}>{c.label}</p>
                  {c.href ? <a href={c.href} style={{ fontSize: 16, color: '#111', textDecoration: 'none', fontWeight: 500 }}>{c.value}</a> : <p style={{ fontSize: 16, color: '#111', fontWeight: 500, margin: 0 }}>{c.value}</p>}
                </div>
              </div>
            ))}
          </div>
          <div>
            {sent ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>Message sent!</h3>
                <p style={{ color: '#4ade80', marginTop: 8 }}>We'll get back to you soon.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label htmlFor="contact-name" style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Your Name</label>
                    <input id="contact-name" autoComplete="name" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Jane Smith" style={inputStyle} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Email Address</label>
                    <input id="contact-email" autoComplete="email" required type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="jane@example.com" style={inputStyle} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea id="contact-message" value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} placeholder="Tell us how we can help..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                </div>
                <button type="button" onClick={handleContactSubmit} disabled={submitting} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 50, padding: '14px 36px', fontSize: 15, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', alignSelf: 'flex-start', transition: 'opacity 0.2s', opacity: submitting ? 0.7 : 1 }} onMouseOver={e => { if (!submitting) (e.currentTarget as HTMLElement).style.opacity='0.85'; }} onMouseOut={e => { if (!submitting) (e.currentTarget as HTMLElement).style.opacity='1'; }} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{submitting ? 'Sending...' : 'Send Message →'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Footer.tsx": `
import React, { useState, useEffect } from 'react';

interface FooterLink { label: string; href: string; }
interface FooterColumn { heading: string; links: FooterLink[]; }
interface FooterProps {
  logo?: string;
  tagline?: string;
  columns?: FooterColumn[];
  links?: FooterLink[];
  socials?: { platform: string; href: string }[];
  email?: string;
  phone?: string;
  address?: string;
  copyright?: string;
  accentColor?: string;
  showNewsletter?: boolean;
}

const SOCIAL_ICONS: Record<string, string> = {
  facebook: 'f', twitter: '𝕏', instagram: '◈', linkedin: 'in', youtube: '▶', tiktok: '♪', pinterest: '𝐏'
};

export default function Footer({ logo = 'Brand', tagline, columns, links, socials, email, phone, address, copyright, accentColor = '#6366f1', showNewsletter = false }: FooterProps) {
  const [email_, setEmail_] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  const year = new Date().getFullYear();

  // Convert flat links to column if no columns provided
  const cols: FooterColumn[] = columns || (links && links.length > 0 ? [{ heading: 'Quick Links', links }] : []);

  return (
    <footer style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', paddingTop: isMobile ? 32 : 64 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px' : '0 40px' }}>

        {/* Top section: logo/info + columns */}
        <div style={{ display: 'grid', gridTemplateColumns: \`2fr \${cols.map(() => '1fr').join(' ')}\`, gap: 48, marginBottom: 48, flexWrap: 'wrap' }}>

          {/* Brand column */}
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--fg)', marginBottom: 12, letterSpacing: '-0.02em' }}>
              <span style={{ color: accentColor }}>{logo.charAt(0)}</span>{logo.slice(1)}
            </div>
            {tagline && <p style={{ color: 'var(--fg)', opacity: 0.65, lineHeight: 1.6, marginBottom: 20, maxWidth: 260, fontSize: 15 }}>{tagline}</p>}

            {/* Contact info */}
            {phone && <a href={\`tel:\${phone.replace(/[^0-9+]/g, '')}\`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg)', opacity: 0.75, textDecoration: 'none', marginBottom: 8, fontSize: 14, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'}>
              <span>📞</span> {phone}
            </a>}
            {email && <a href={\`mailto:\${email}\`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg)', opacity: 0.75, textDecoration: 'none', marginBottom: 8, fontSize: 14, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'}>
              <span>✉️</span> {email}
            </a>}
            {address && <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--fg)', opacity: 0.65, fontSize: 14, margin: 0 }}>
              <span>📍</span> {address}
            </p>}

            {/* Social icons */}
            {socials && socials.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {socials.map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.platform}
                    style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)', textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = accentColor; (e.currentTarget as HTMLAnchorElement).style.borderColor = accentColor; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'none'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg)'; }}>
                    {SOCIAL_ICONS[s.platform.toLowerCase()] || s.platform.charAt(0).toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {cols.map((col, ci) => (
            <div key={ci}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>{col.heading}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((link, li) => (
                  <li key={li}>
                    <a href={link.href} style={{ color: 'var(--fg)', opacity: 0.7, textDecoration: 'none', fontSize: 15, transition: 'opacity 0.15s, color 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.color = accentColor; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.7'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg)'; }}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter bar */}
        {showNewsletter && !subscribed && (
          <div style={{ padding: '32px 40px', background: \`\${accentColor}10\`, borderRadius: 16, marginBottom: 48, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontWeight: 700, color: 'var(--fg)', margin: '0 0 4px', fontSize: 17 }}>Stay in the loop</p>
              <p style={{ color: 'var(--fg)', opacity: 0.65, margin: 0, fontSize: 14 }}>Get updates, tips, and exclusive offers.</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); setSubscribed(true); }} style={{ display: 'flex', gap: 10, flex: 2, minWidth: 280 }}>
              <input type="email" value={email_} onChange={e => setEmail_(e.target.value)} placeholder="Enter your email" required autoComplete="email"
                style={{ flex: 1, padding: '12px 16px', borderRadius: 30, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none' }} />
              <button type="submit" style={{ background: accentColor, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 30, fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
            </form>
          </div>
        )}

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--fg)', opacity: 0.5, fontSize: 14, margin: 0 }}>
            © {year} {logo}. {copyright || 'All rights reserved.'}
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service'].map((label, i) => (
              <a key={i} href="#" style={{ color: 'var(--fg)', opacity: 0.5, fontSize: 14, textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.5'}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
`,

"/components/sections/DarkModeToggle.tsx": `
import React from 'react';

interface DarkModeToggleProps {
  accentColor?: string;
  position?: 'fixed-bottom-right' | 'fixed-bottom-left' | 'inline';
}

export default function DarkModeToggle({ accentColor = '#6366f1', position = 'fixed-bottom-right' }: DarkModeToggleProps) {
  const [dark, setDark] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    // Swap CSS variables
    const root = document.documentElement;
    if (next) {
      root.style.setProperty('--bg', '#0f172a');
      root.style.setProperty('--fg', '#f1f5f9');
      root.style.setProperty('--card', '#1e293b');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--muted', '#1e293b');
    } else {
      root.style.removeProperty('--bg');
      root.style.removeProperty('--fg');
      root.style.removeProperty('--card');
      root.style.removeProperty('--border');
      root.style.removeProperty('--muted');
    }
  };

  const posStyle = position === 'fixed-bottom-right' ? { position: 'fixed' as const, bottom: 24, right: 84, zIndex: 999 }
    : position === 'fixed-bottom-left' ? { position: 'fixed' as const, bottom: 24, left: 24, zIndex: 999 }
    : {};

  return (
    <button type="button" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ ...posStyle, width: 48, height: 48, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = ''}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
`,

"/components/sections/SplitSection.tsx": `import React, { useState, useEffect } from 'react';
export default function SplitSection({ tag, title, text, image, reverse }: { tag?: string; title: string; text: string; image: string; reverse?: boolean }) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '48px 20px' : '100px 40px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:60, alignItems:'center', direction: 'ltr', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ direction:'ltr' }}>
        {tag && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', color:'var(--accent, #c2410c)', marginBottom:12 }}>{tag}</p>}
        <h2 style={{ fontSize:36, fontWeight:700, lineHeight:1.15, letterSpacing:'-0.02em', marginBottom:20 }}>{title}</h2>
        <p style={{ fontSize:17, lineHeight:1.7, color:'#555' }}>{text}</p>
      </div>
      <div style={{ borderRadius:16, overflow:'hidden', direction:'ltr' }}>
        <img src={image} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />
      </div>
    </section>
  );
}`,

"/components/sections/ShopGrid.tsx": `import React from 'react';

const CartCtx = React.createContext<any>(null);

function useCart() {
  const [items, setItems] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });
  const save = (next: any[]) => { setItems(next); try { localStorage.setItem('cart', JSON.stringify(next)); } catch {} };
  const add = (product: any, variant?: string) => {
    const key = String(product.id || product.name) + (variant || '');
    const existing = items.find((i: any) => i.key === key);
    if (existing) save(items.map((i: any) => i.key === key ? { ...i, qty: i.qty + 1 } : i));
    else save([...items, { key, product, variant, qty: 1 }]);
  };
  const remove = (key: string) => save(items.filter((i: any) => i.key !== key));
  const updateQty = (key: string, delta: number) => save(items.map((i: any) => i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i: any) => i.qty > 0));
  const total = items.reduce((s: number, i: any) => s + (parseFloat(i.product.price?.toString().replace(/[^0-9.]/g, '') || '0') * i.qty), 0);
  const count = items.reduce((s: number, i: any) => s + i.qty, 0);
  return { items, add, remove, updateQty, total, count };
}

interface Product { id?: string | number; name: string; price: string | number; image?: string; description?: string; desc?: string; variants?: string[]; badge?: string; category?: string; }
interface ShopGridProps { products?: Product[]; items?: Product[]; title?: string; subtitle?: string; accentColor?: string; columns?: number; }

export default function ShopGrid({ products, items, title, subtitle, accentColor = '#6366f1', columns = 3 }: ShopGridProps) {
  const prods = products || items || [];
  const cart = useCart();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [added, setAdded] = React.useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>({});
  const [quickView, setQuickView] = React.useState<Product | null>(null);


  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('cartupdate', { detail: { count: cart.count, open: () => setDrawerOpen(true) } }));
  }, [cart.count]);
  React.useEffect(() => {
    const h = (e: Event) => { if ((e as CustomEvent).detail === 'open') setDrawerOpen(true); };
    window.addEventListener('carttrigger', h);
    return () => window.removeEventListener('carttrigger', h);
  }, []);

  const handleAdd = (p: Product) => {
    const id = String(p.id || p.name);
    const variant = selectedVariants[id];
    cart.add({ ...p, id }, variant);
    setAdded(id);
    setTimeout(() => setAdded(null), 1500);
    setDrawerOpen(true);
  };

  return (
    <CartCtx.Provider value={cart}>
      <section id="shop" style={{ padding: '80px 40px', background: 'var(--bg, #faf9f7)' }}>
        {(title || subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {title && <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: 'var(--fg, #111)', marginBottom: 8 }}>{title}</h2>}
            {subtitle && <p style={{ color: 'var(--fg, #666)', opacity: 0.7, fontSize: 18 }}>{subtitle}</p>}
          </div>
        )}

        {cart.count > 0 && (
          <button onClick={() => setDrawerOpen(true)} type="button" style={{
            position: 'fixed', bottom: 24, right: 24, background: accentColor, color: '#fff',
            border: 'none', borderRadius: 50, padding: '14px 20px', cursor: 'pointer',
            fontSize: 16, fontWeight: 700, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: 8
          }} aria-label={\`View cart, \${cart.count} items\`}>
            🛒 {cart.count} · \${cart.total.toFixed(2)}
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
          {prods.map((p, i) => {
            const id = String(p.id || p.name);
            const isAdded = added === id;
            return (
              <div key={i} style={{ background: 'var(--card, #fff)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border, #eee)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
                <div style={{ position: 'relative', paddingTop: '75%', background: 'var(--muted, #f5f5f5)', cursor: 'pointer' }} onClick={() => setQuickView(p)}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🛍️</div>
                  )}
                  {p.badge && <span style={{ position: 'absolute', top: 12, left: 12, background: accentColor, color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{p.badge}</span>}
                </div>

                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg, #111)', marginBottom: 6 }}>{p.name}</h3>
                  {(p.description || p.desc) && <p style={{ fontSize: 14, color: 'var(--fg, #666)', opacity: 0.7, marginBottom: 12, lineHeight: 1.5 }}>{p.description || p.desc}</p>}

                  {p.variants && p.variants.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {p.variants.map((v, vi) => (
                        <button key={vi} type="button" onClick={() => setSelectedVariants(prev => ({ ...prev, [id]: v }))}
                          style={{ padding: '4px 12px', borderRadius: 20, border: \`2px solid \${selectedVariants[id] === v ? accentColor : 'var(--border, #eee)'}\`,
                            background: selectedVariants[id] === v ? accentColor : 'transparent',
                            color: selectedVariants[id] === v ? '#fff' : 'var(--fg, #111)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: accentColor }}>{typeof p.price === 'number' ? \`\$\${p.price}\` : p.price}</span>
                    <button type="button" onClick={() => handleAdd(p)} style={{
                      background: isAdded ? '#10b981' : accentColor, color: '#fff', border: 'none',
                      padding: '10px 20px', borderRadius: 25, cursor: 'pointer', fontWeight: 700,
                      fontSize: 14, transition: 'all 0.2s', transform: isAdded ? 'scale(1.05)' : 'scale(1)'
                    }}>
                      {isAdded ? '✓ Added!' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {drawerOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} onClick={() => setDrawerOpen(false)}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 380, background: 'var(--card, #fff)', boxShadow: '-4px 0 40px rgba(0,0,0,0.15)', padding: 24, overflowY: 'auto', zIndex: 1 }}
              onClick={e => e.stopPropagation()} role="dialog" aria-label="Shopping cart" aria-modal="true">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg, #111)', margin: 0 }}>Your Cart ({cart.count})</h3>
                <button type="button" onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--fg, #111)' }} aria-label="Close cart">×</button>
              </div>

              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg, #999)', opacity: 0.5 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cart.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border, #eee)' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--muted, #f5f5f5)', flexShrink: 0, overflow: 'hidden' }}>
                        {item.product.image ? <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🛍️</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, color: 'var(--fg, #111)', margin: '0 0 4px' }}>{item.product.name}</p>
                        {item.variant && <p style={{ fontSize: 13, color: 'var(--fg, #666)', opacity: 0.6, margin: '0 0 4px' }}>{item.variant}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <button type="button" onClick={() => cart.updateQty(item.key, -1)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border, #ddd)', background: 'transparent', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg, #111)' }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'var(--fg, #111)' }}>{item.qty}</span>
                          <button type="button" onClick={() => cart.add(item.product, item.variant)} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: accentColor, color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <button type="button" onClick={() => cart.remove(item.key)} style={{ background: 'none', border: 'none', color: 'var(--fg, #999)', opacity: 0.4, cursor: 'pointer', fontSize: 18, padding: 0 }} aria-label="Remove item">×</button>
                        <span style={{ fontWeight: 800, color: accentColor, whiteSpace: 'nowrap' }}>{typeof item.product.price === 'number' ? \`\$\${(item.product.price * item.qty).toFixed(2)}\` : item.product.price}</span>
                      </div>
                    </div>
                  ))}

                  <div style={{ padding: '20px 0', borderTop: '2px solid var(--border, #eee)', marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--fg, #111)' }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 22, color: accentColor }}>\${cart.total.toFixed(2)}</span>
                    </div>
                    <button type="button" onClick={() => alert('Checkout integration required. Connect Stripe or your payment provider.')}
                      style={{ width: '100%', background: accentColor, color: '#fff', border: 'none', padding: '16px', borderRadius: 12, fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
                      Checkout →
                    </button>
                    <button type="button" onClick={() => setDrawerOpen(false)} style={{ width: '100%', background: 'transparent', color: 'var(--fg, #111)', border: '2px solid var(--border, #eee)', padding: '12px', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                      Continue Shopping
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {quickView && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setQuickView(null)}>
            <div style={{ background: 'var(--card, #fff)', borderRadius: 20, maxWidth: 600, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()} role="dialog" aria-label="Product quick view">
              {quickView.image && <img src={quickView.image} alt={quickView.name} style={{ width: '100%', height: 300, objectFit: 'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />}
              <div style={{ padding: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg, #111)', marginBottom: 8 }}>{quickView.name}</h2>
                {(quickView.description || quickView.desc) && <p style={{ color: 'var(--fg, #666)', opacity: 0.8, lineHeight: 1.6, marginBottom: 16 }}>{quickView.description || quickView.desc}</p>}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: accentColor }}>{typeof quickView.price === 'number' ? \`\$\${quickView.price}\` : quickView.price}</span>
                  <button type="button" onClick={() => { handleAdd(quickView); setQuickView(null); }}
                    style={{ flex: 1, background: accentColor, color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 30, cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </CartCtx.Provider>
  );
}`,

"/components/sections/PricingTable.tsx": `import React, { useState, useEffect } from 'react';
type Plan = { name: string; price: string; yearlyPrice?: string; period?: string; features: string[]; cta: string; ctaHref?: string; popular?: boolean; desc?: string };
export default function PricingTable({ title, subtitle, plans, items, accentColor }: { title: string; subtitle?: string; plans: Plan[]; items?: Plan[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safePlans = (plans || items || []).filter(Boolean);
  const [billing, setBilling] = useState<'monthly'|'yearly'>('monthly');
  const [selected, setSelected] = useState<number|null>(safePlans.findIndex(p=>p.popular) ?? null);
  const hasYearly = safePlans.some(p=>p.yearlyPrice);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} id="pricing" style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16,marginBottom:hasYearly?28:0}}>{subtitle}</p>}
          {hasYearly&&<div style={{display:'inline-flex',background:'#f5f5f5',borderRadius:50,padding:4,gap:0}}>
            <button type="button" onClick={()=>setBilling('monthly')} style={{padding:'8px 20px',borderRadius:50,border:'none',background:billing==='monthly'?'#fff':'transparent',fontWeight:600,fontSize:14,cursor:'pointer',boxShadow:billing==='monthly'?'0 2px 8px rgba(0,0,0,0.1)':'none',transition:'all 0.2s'}}>Monthly</button>
            <button type="button" onClick={()=>setBilling('yearly')} style={{padding:'8px 20px',borderRadius:50,border:'none',background:billing==='yearly'?'#fff':'transparent',fontWeight:600,fontSize:14,cursor:'pointer',boxShadow:billing==='yearly'?'0 2px 8px rgba(0,0,0,0.1)':'none',transition:'all 0.2s'}}>
              Yearly <span style={{fontSize:11,background:'#dcfce7',color:'#16a34a',padding:'2px 6px',borderRadius:50,marginLeft:4,fontWeight:700}}>Save 20%</span>
            </button>
          </div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : \`repeat(\${Math.min(safePlans.length,3)},1fr)\`,gap:20,alignItems:'start'}}>
          {safePlans.map((p,i)=>{
            const isSelected = selected===i;
            const price = billing==='yearly'&&p.yearlyPrice ? p.yearlyPrice : p.price;
            return (
              <div key={i} onClick={()=>setSelected(i)} style={{background:p.popular?accent:'#fff',color:p.popular?'#fff':'#111',border:isSelected&&!p.popular?\`2px solid \${accent}\`:'2px solid '+(p.popular?accent:'#f0f0f0'),borderRadius:20,padding:32,position:'relative',cursor:'pointer',transition:\`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`,boxShadow:isSelected?'0 16px 48px rgba(0,0,0,0.12)':'0 2px 12px rgba(0,0,0,0.04)',opacity: visible ? 1 : 0, transform: visible ? (p.popular?'scale(1.03)':'none') : 'translateY(24px)'}}>
                {p.popular&&<span style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:'#fff',color:accent,fontSize:11,padding:'4px 14px',borderRadius:50,fontWeight:800,border:\`2px solid \${accent}\`,whiteSpace:'nowrap'}}>Most Popular</span>}
                <h3 style={{fontSize:19,fontWeight:800,margin:'0 0 6px'}}>{p.name}</h3>
                {p.desc&&<p style={{fontSize:13,opacity:0.7,margin:'0 0 16px'}}>{p.desc}</p>}
                <div style={{margin:'16px 0 24px'}}><span style={{fontSize:44,fontWeight:900,letterSpacing:'-0.03em'}}>{price}</span>{p.period&&<span style={{fontSize:14,opacity:0.6}}>/{p.period}</span>}</div>
                <ul style={{listStyle:'none',padding:0,margin:'0 0 28px'}}>
                  {(p.features||[]).map((f,j)=><li key={j} style={{fontSize:14,padding:'8px 0',borderBottom:'1px solid '+(p.popular?'rgba(255,255,255,0.15)':'#f5f5f5'),display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{color:p.popular?'rgba(255,255,255,0.8)':'#22c55e',fontWeight:700,fontSize:15}}>✓</span>{f}
                  </li>)}
                </ul>
                <a href={p.ctaHref||'#contact'} onClick={e=>e.stopPropagation()} style={{display:'block',width:'100%',padding:'13px',borderRadius:50,border:p.popular?'2px solid rgba(255,255,255,0.5)':'2px solid '+accent,background:p.popular?'rgba(255,255,255,0.15)':'transparent',color:p.popular?'#fff':accent,fontSize:14,fontWeight:800,cursor:'pointer',textAlign:'center',textDecoration:'none',transition:'all 0.2s',boxSizing:'border-box'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background=p.popular?'rgba(255,255,255,0.25)':accent;(e.currentTarget as HTMLElement).style.color=p.popular?'#fff':'#fff'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background=p.popular?'rgba(255,255,255,0.15)':'transparent';(e.currentTarget as HTMLElement).style.color=p.popular?'#fff':accent}}>{p.cta}</a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/FAQ.tsx": `import React, { useState, useEffect } from 'react';
type FAQItem = { q: string; a: string };
export default function FAQ({ title, items }: { title: string; items: FAQItem[] }) {
  const safeItems = (items || []).filter(Boolean);
  const [open, setOpen] = useState<number | null>(null);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} id="faq" style={{ padding: isMobile ? '48px 20px' : '100px 40px', maxWidth:800, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      {safeItems.map((item, i) => (
        <div key={i} style={{ borderBottom:'1px solid var(--border,#eee)' }}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0', background:'none', border:'none', cursor:'pointer', fontSize:16, fontWeight:600, color:'var(--text,#111)', textAlign:'left' }}>
            {item.q}
            <span style={{ fontSize:20, transform: open === i ? 'rotate(45deg)' : 'none', transition:'transform 0.2s' }}>+</span>
          </button>
          {open === i && <p style={{ padding:'0 0 20px', fontSize:15, lineHeight:1.7, color:'var(--muted,#666)' }}>{item.a}</p>}
        </div>
      ))}
    </section>
  );
}`,

"/components/sections/CTA.tsx": `import React, { useState, useEffect } from 'react';
export default function CTA({ title, subtitle, cta, image }: { title: string; subtitle?: string; cta: { text: string; href?: string }; image?: string }) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ position:'relative', padding: isMobile ? '64px 20px' : '100px 40px', textAlign:'center', overflow:'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      {image && <><img src={image} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} /><div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)' }} /></>}
      <div style={{ position:'relative', zIndex:1, maxWidth:700, margin:'0 auto' }}>
        <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, lineHeight:1.1, color: image ? '#fff' : 'var(--text,#111)', letterSpacing:'-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize:18, marginTop:16, color: image ? 'rgba(255,255,255,0.8)' : 'var(--muted,#666)' }}>{subtitle}</p>}
        <a href={cta.href||'#'} style={{ display:'inline-block', marginTop:32, background:'var(--accent,#c2410c)', color:'#fff', padding:'16px 40px', borderRadius:50, fontSize:16, fontWeight:600, textDecoration:'none' }} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{cta.text}</a>
      </div>
    </section>
  );
}`,

"/components/sections/Gallery.tsx": `import React, { useState, useEffect } from 'react';
export default function Gallery({ title, images, items }: { title: string; images?: { src: string; alt: string }[]; items?: { src?: string; image?: string; alt?: string; caption?: string }[] }) {
  const rawList = images || items || [];
  const safeImages = rawList.filter(Boolean).map((img: any) => ({ src: img.src || img.image || '', alt: img.alt || img.caption || '' }));
  const [selected, setSelected] = useState<number | null>(null);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  useEffect(() => { if (selected === null) return; const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [selected]);
  return (
    <section ref={ref as any} id="gallery" style={{ padding: isMobile ? '48px 20px' : '100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:16 }}>
        {safeImages.map((img, i) => (
          <div key={i} onClick={() => setSelected(i)} style={{ borderRadius:12, overflow:'hidden', cursor:'pointer', aspectRatio:'4/3' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
            <img src={img.src} alt={img.alt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.3s' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />
          </div>
        ))}
      </div>
      {selected !== null && (
        <div role="dialog" aria-modal="true" aria-label="Image lightbox" onClick={() => setSelected(null)} tabIndex={-1} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <img src={safeImages[selected].src} alt={safeImages[selected].alt} style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:8 }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />
        </div>
      )}
    </section>
  );
}`,

"/components/sections/Stats.tsx": `import React from 'react';
type Stat = { value: string; label: string };
function AnimatedStat({ value, dark }: { value: string; dark?: boolean }) {
  const [displayed, setDisplayed] = React.useState(0);
  const [started, setStarted] = React.useState(false);
  const decimals = value.includes('.') ? 1 : 0;
  React.useEffect(() => {
    if (!started) return;
    const target = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    if (target === 0) return;
    const duration = 1500; const steps = 40; let step = 0;
    const timer = setInterval(() => { step++; setDisplayed((step/steps)*target); if(step>=steps) { setDisplayed(target); clearInterval(timer); } }, duration/steps);
    return () => clearInterval(timer);
  }, [started, value]);
  const suffix = value.replace(/[0-9.,]/g, '');
  const target = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  const shown = decimals ? displayed.toFixed(1) : Math.round(displayed).toLocaleString();
  return <span style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, color: dark ? '#fff' : 'var(--accent,#c2410c)', letterSpacing:'-0.02em' }} ref={(el) => { if(el && !started) { const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setStarted(true); obs.disconnect(); } }); obs.observe(el); } }}>{target > 0 ? shown + suffix : value}</span>;
}
export default function Stats({ items, dark }: { items: Stat[]; dark?: boolean }) {
  const safeItems = (items || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth < 768);
  React.useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ padding: isMobile ? '48px 20px' : '80px 40px', background: dark ? 'var(--accent,#111)' : 'var(--card,#faf9f7)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : \`repeat(\${Math.min(safeItems.length, 4)}, 1fr)\`, gap:32, textAlign:'center' }}>
        {safeItems.map((s, i) => (
          <div key={i} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: \`opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\` }}>
            <AnimatedStat value={s.value} dark={dark} />
            <p style={{ fontSize:14, color: dark ? 'rgba(255,255,255,0.7)' : 'var(--muted,#888)', marginTop:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/Team.tsx": `import React, { useState, useEffect } from 'react';
type Member = { name: string; role: string; image?: string; bio?: string };
export default function Team({ title, members, items, accentColor }: { title: string; members?: Member[]; items?: Member[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#c2410c)';
  const list = members || items || [];
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} id="team" style={{ padding: isMobile ? '48px 20px' : '80px 40px', background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <h2 style={{ fontSize:38, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:56 }}>{title}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:32 }}>
          {list.map((m, i) => (
            <div key={i} style={{ textAlign:'center', padding:'32px 20px', background:'#fafafa', borderRadius:20, border:'1px solid #f0f0f0', transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
              {m.image ? <img src={m.image} alt={m.name} style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover', margin:'0 auto 16px', display:'block' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} /> : <div style={{ width:100, height:100, borderRadius:'50%', background:accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:800, margin:'0 auto 16px' }}>{m.name[0]}</div>}
              <h3 style={{ fontSize:17, fontWeight:700, margin:'0 0 4px' }}>{m.name}</h3>
              <p style={{ fontSize:13, color:accent, fontWeight:600, margin:0 }}>{m.role}</p>
              {m.bio && <p style={{ fontSize:13, color:'#888', marginTop:10, lineHeight:1.6 }}>{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Newsletter.tsx": `import React, { useState, useEffect } from 'react';
export default function Newsletter({ title, subtitle, placeholder }: { title: string; subtitle?: string; placeholder?: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ padding: isMobile ? '48px 20px' : '80px 40px', background:'var(--accent,#111)', color:'#fff', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
        <h2 style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize:16, opacity:0.8, marginTop:12 }}>{subtitle}</p>}
        {sent ? <p style={{ marginTop:24, fontSize:16, color:'#4ade80' }}>Thanks for subscribing!</p> : (
          <div style={{ display:'flex', gap:8, marginTop:32, maxWidth:440, margin:'32px auto 0' }}>
            <input id="newsletter-email" type="email" autoComplete="email" aria-label="Email address for newsletter" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={placeholder || 'Enter your email'} style={{ flex:1, padding:'14px 20px', borderRadius:50, border:'none', fontSize:14, outline:'none' }} />
            <button type="button" onClick={async () => { if (!email.includes('@')) return; setSent(true); try { await fetch('/api/form-submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ formType:'newsletter', fields:{ Email: email } }) }); } catch {} }} style={{ background:'#fff', color:'var(--accent,#111)', padding:'14px 28px', borderRadius:50, border:'none', fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>Subscribe</button>
          </div>
        )}
      </div>
    </section>
  );
}`,

"/components/sections/Timeline.tsx": `import React, { useState, useEffect } from 'react';
type Event = { year: string; title: string; desc: string };
export default function Timeline({ title, events, items }: { title: string; events?: Event[]; items?: Event[] }) {
  const safeEvents = ((events || items || [])).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ padding: isMobile ? '48px 20px' : '100px 40px', maxWidth:800, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:60 }}>{title}</h2>
      {safeEvents.map((e, i) => (
        <div key={i} style={{ display:'flex', gap:24, marginBottom:40, position:'relative' }}>
          <div style={{ width:80, textAlign:'right', flexShrink:0 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--accent,#c2410c)' }}>{e.year}</span>
          </div>
          <div style={{ width:2, background:'var(--border,#eee)', position:'relative', flexShrink:0 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent,#c2410c)', position:'absolute', top:4, left:-4 }} />
          </div>
          <div style={{ paddingBottom:8 }}>
            <h3 style={{ fontSize:17, fontWeight:600 }}>{e.title}</h3>
            <p style={{ fontSize:14, color:'var(--muted,#888)', marginTop:4, lineHeight:1.6 }}>{e.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}`,

"/components/sections/LogoCloud.tsx": `import React, { useState, useEffect } from 'react';
export default function LogoCloud({ title, logos }: { title?: string; logos: { name: string; image?: string }[] }) {
  const safeLogos = (logos || []).filter(Boolean);
  const doubled = [...safeLogos, ...safeLogos];
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{ padding: isMobile ? '40px 20px' : '60px 40px', borderTop:'1px solid var(--border,#eee)', borderBottom:'1px solid var(--border,#eee)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease', overflow:'hidden' }}>
      <style>{\`@keyframes logoScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }\`}</style>
      <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
        {title && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', color:'var(--muted,#999)', marginBottom:32 }}>{title}</p>}
        <div style={{ overflow:'hidden', position:'relative' }}>
          <div style={{ display:'flex', gap:60, alignItems:'center', opacity:0.5, width:'max-content', animation:'logoScroll 20s linear infinite' }}>
            {doubled.map((l, i) => l.image
              ? <img key={i} src={l.image} alt={l.name} style={{ height:28, objectFit:'contain', flexShrink:0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
              : <span key={i} style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', whiteSpace:'nowrap', flexShrink:0 }}>{l.name}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/BlogGrid.tsx": `import React, { useState, useEffect } from 'react';
type Post = { title: string; excerpt: string; image: string; date: string; author: string; category?: string };
export default function BlogGrid({ title, posts, items }: { title: string; posts?: Post[]; items?: Post[] }) {
  const safePosts = ((posts || items || [])).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} id="blog" style={{ padding: isMobile ? '48px 20px' : '100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:32 }}>
        {safePosts.map((p, i) => (
          <article key={i} style={{ borderRadius:16, overflow:'hidden', border:'1px solid var(--border,#eee)', background:'var(--card,#fff)', transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform='translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'; }}>
            <img src={p.image} alt={p.title} style={{ width:'100%', height:200, objectFit:'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />
            <div style={{ padding:24 }}>
              {p.category && <span style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--accent,#c2410c)', fontWeight:600 }}>{p.category}</span>}
              <h3 style={{ fontSize:18, fontWeight:600, marginTop:8, lineHeight:1.3 }}>{p.title}</h3>
              <p style={{ fontSize:14, color:'var(--muted,#888)', marginTop:8, lineHeight:1.6 }}>{p.excerpt}</p>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, fontSize:12, color:'var(--muted,#aaa)' }}>
                <span>{p.author}</span><span>{p.date}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/Tabs.tsx": `import React, { useState, useEffect } from 'react';
type Tab = { label: string; content: string };
export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const safeTabs = (tabs || []).filter(Boolean);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section style={{ padding: isMobile ? '48px 20px' : '80px 40px', maxWidth:800, margin:'0 auto' }}>
      <div role="tablist" style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border,#eee)' }}>
        {safeTabs.map((t, i) => (
          <button type="button" role="tab" aria-selected={active === i} key={i} onClick={() => setActive(i)} style={{ padding:'12px 24px', background:'none', border:'none', borderBottom: active === i ? '2px solid var(--accent,#c2410c)' : '2px solid transparent', marginBottom:-2, fontSize:14, fontWeight: active === i ? 600 : 400, color: active === i ? 'var(--text,#111)' : 'var(--muted,#888)', cursor:'pointer', transition:'all 0.2s' }}>{t.label}</button>
        ))}
      </div>
      <div role="tabpanel" style={{ padding:'32px 0', fontSize:15, lineHeight:1.8, color:'var(--text,#333)' }}>{safeTabs[active]?.content}</div>
    </section>
  );
}`,

"/components/sections/Booking.tsx": `import React, { useState, useEffect } from 'react';
export default function Booking({ title, subtitle, fields, cta }: { title: string; subtitle?: string; fields?: string[]; cta?: string }) {
  const accent = 'var(--accent, #c2410c)';
  const defaultFields = fields || ['name', 'email', 'date', 'time', 'guests', 'notes'];
  const [form, setForm] = useState<Record<string,string>>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const handleBookingSubmit = async () => {
    if (!form.name && !form.email) return;
    setSubmitting(true);
    try {
      await fetch('/api/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'booking', fields: Object.fromEntries(Object.entries(form).map(([k,v]) => [k.charAt(0).toUpperCase()+k.slice(1), v])) }),
      });
    } catch {}
    setSent(true);
    setSubmitting(false);
  };
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  const inp: React.CSSProperties = { width:'100%', padding:'12px 16px', borderRadius:10, border:'1.5px solid #e5e5e5', fontSize:15, fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s', color:'#111' };
  const lbl: React.CSSProperties = { fontSize:13, fontWeight:600, color:'#444', display:'block', marginBottom:6 };
  const fieldDefs: Record<string,{label:string;type:string;placeholder:string}> = {
    name:    { label:'Full Name',        type:'text',   placeholder:'Jane Smith' },
    email:   { label:'Email Address',    type:'email',  placeholder:'jane@example.com' },
    phone:   { label:'Phone Number',     type:'tel',    placeholder:'(555) 123-4567' },
    date:    { label:'Preferred Date',   type:'date',   placeholder:'' },
    time:    { label:'Preferred Time',   type:'select', placeholder:'' },
    guests:  { label:'Number of Guests', type:'select', placeholder:'' },
    service: { label:'Service',          type:'select', placeholder:'' },
    notes:   { label:'Special Requests', type:'textarea', placeholder:'Allergies, occasions, preferences...' },
    message: { label:'Message',          type:'textarea', placeholder:'Tell us more...' },
    company: { label:'Company',          type:'text',   placeholder:'Acme Inc.' },
  };
  const timeSlots = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM'];
  const guestOptions = ['1 guest','2 guests','3 guests','4 guests','5 guests','6 guests','7-10 guests','10+ guests'];
  const onFocus = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = accent; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(194,65,12,0.13)'; };
  const onBlur  = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = '#e5e5e5'; (e.target as HTMLElement).style.boxShadow = 'none'; };
  if (sent) return (
    <section id="booking" style={{ padding: isMobile ? '48px 20px' : '100px 40px', background:'#fafafa' }}>
      <div style={{ maxWidth:560, margin:'0 auto', background:'#fff', borderRadius:24, padding:60, textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:28 }}>✓</div>
        <h3 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>You're all set!</h3>
        <p style={{ color:'#666', fontSize:16 }}>We'll confirm your booking shortly.</p>
        <button type="button" onClick={() => setSent(false)} style={{ marginTop:24, background:'none', border:'1.5px solid #ddd', borderRadius:50, padding:'10px 28px', fontSize:14, cursor:'pointer', color:'#666' }}>Book again</button>
      </div>
    </section>
  );
  return (
    <section id="booking" style={{ padding: isMobile ? '48px 20px' : '100px 40px', background:'#fafafa' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:12 }}>{title}</h2>
          {subtitle && <p style={{ color:'#666', fontSize:17 }}>{subtitle}</p>}
        </div>
        <div style={{ background:'#fff', borderRadius:24, padding: isMobile ? 24 : 48, boxShadow:'0 4px 32px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'grid', gridTemplateColumns: defaultFields.includes('date') && defaultFields.includes('time') ? '1fr 1fr' : '1fr', gap:20 }}>
            {defaultFields.map(f => {
              const def = fieldDefs[f] || { label: f, type:'text', placeholder:'' };
              if (def.type === 'textarea') return (
                <div key={f} style={{ gridColumn:'1 / -1' }}>
                  <label htmlFor={\`booking-\${f}\`} style={lbl}>{def.label}</label>
                  <textarea id={\`booking-\${f}\`} value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={def.placeholder} rows={3} style={{...inp, resize:'none'}} onFocus={onFocus} onBlur={onBlur} />
                </div>
              );
              if (def.type === 'select' && f === 'time') return (
                <div key={f}><label htmlFor={\`booking-\${f}\`} style={lbl}>{def.label}</label>
                  <select id={\`booking-\${f}\`} value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} style={inp} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Select time</option>
                    {timeSlots.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              );
              if (def.type === 'select' && f === 'guests') return (
                <div key={f}><label htmlFor={\`booking-\${f}\`} style={lbl}>{def.label}</label>
                  <select id={\`booking-\${f}\`} value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} style={inp} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Select guests</option>
                    {guestOptions.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              );
              return (
                <div key={f} style={{ gridColumn: (f==='name'||f==='email') && defaultFields.includes('email') ? 'auto' : defaultFields.includes('date') ? '1 / -1' : 'auto' }}>
                  <label htmlFor={\`booking-\${f}\`} style={lbl}>{def.label}</label>
                  <input id={\`booking-\${f}\`} type={def.type} value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={def.placeholder} style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>
              );
            })}
          </div>
          <button type="button" onClick={handleBookingSubmit} disabled={submitting} style={{ marginTop:28, width:'100%', background:accent, color:'#fff', border:'none', borderRadius:50, padding:'16px 36px', fontSize:16, fontWeight:700, cursor:submitting ? 'default' : 'pointer', transition:'opacity 0.2s', opacity: submitting ? 0.7 : 1 }} onMouseOver={e=>{ if(!submitting)(e.currentTarget as HTMLElement).style.opacity='0.88'; }} onMouseOut={e=>{ if(!submitting)(e.currentTarget as HTMLElement).style.opacity='1'; }}>{submitting ? 'Sending...' : (cta || 'Confirm Booking →')}</button>
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Banner.tsx": `import React, { useState } from 'react';
export default function Banner({ text, cta, href, emoji }: { text: string; cta?: string; href?: string; emoji?: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div style={{ background:'var(--accent,#111)', color:'#fff', padding:'11px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:12, position:'relative' }}>
      {emoji && <span style={{ fontSize:16 }}>{emoji}</span>}
      <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.01em' }}>{text}</span>
      {cta && <a href={href||'#'} style={{ color:'#fff', fontWeight:800, fontSize:13, textDecoration:'none', background:'rgba(255,255,255,0.18)', padding:'4px 14px', borderRadius:50, marginLeft:4, transition:'background 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.28)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.18)'}>{cta} →</a>}
      <button type="button" aria-label="Dismiss banner" onClick={() => setShow(false)} style={{ position:'absolute', right:16, background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:18, lineHeight:1, padding:'0 4px' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.color='#fff'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>×</button>
    </div>
  );
}`,

"/components/sections/Reviews.tsx": `import React, { useState, useEffect } from 'react';
type Review = { name: string; rating: number; text: string; date?: string; location?: string; avatar?: string; source?: string; verified?: boolean };
interface ReviewsProps { title: string; subtitle?: string; items?: Review[]; reviews?: Review[]; accentColor?: string; showSummary?: boolean; source?: string; overallRating?: number; totalReviews?: number; }
export default function Reviews({ title, subtitle, items, reviews, accentColor, showSummary = true, source = 'Google', overallRating, totalReviews }: ReviewsProps) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || reviews || []).filter(Boolean);
  const computedAvg = safeItems.length > 0 ? safeItems.reduce((s,r)=>s+(r.rating||5),0)/safeItems.length : 5;
  const displayRating = overallRating ?? parseFloat(computedAvg.toFixed(1));
  const displayTotal = totalReviews ?? safeItems.length;
  const stars = (n: number, size = 16) => Array.from({length:5},(_,i)=><span key={i} style={{color:i<Math.round(n)?'#f59e0b':'#e5e7eb',fontSize:size}}>★</span>);
  const sourceColors: Record<string,string> = { Google:'#4285F4', Yelp:'#FF1A1A', Trustpilot:'#00B67A', Facebook:'#1877F2' };
  const sourceBadgeColor = sourceColors[source] || '#555';
  const breakdown = [5,4,3,2,1].map(star => ({ star, pct: safeItems.length > 0 ? Math.round(safeItems.filter(r=>Math.round(r.rating||5)===star).length/safeItems.length*100) : (star===5?90:star===4?8:star===3?2:0) }));
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px', background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 10px',color:'var(--fg,#111)'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16,margin:0}}>{subtitle}</p>}
        </div>
        {showSummary && (
          <div style={{display:'flex',gap: isMobile ? 24 : 48,alignItems:'flex-start',justifyContent:'center',flexWrap:'wrap',marginBottom:48,background:'#fafafa',borderRadius:20,padding: isMobile ? '24px 20px' : '36px 48px',border:'1px solid #f0f0f0'}}>
            <div style={{textAlign:'center',flexShrink:0}}>
              <div style={{fontSize: isMobile ? 56 : 72,fontWeight:900,letterSpacing:'-0.04em',lineHeight:1,color:'var(--fg,#111)'}}>{displayRating.toFixed(1)}</div>
              <div style={{display:'flex',gap:3,justifyContent:'center',margin:'8px 0 6px'}}>{stars(displayRating,20)}</div>
              <div style={{fontSize:13,color:'#999'}}>Based on {displayTotal} reviews</div>
              <div style={{display:'inline-block',marginTop:10,background:sourceBadgeColor,color:'#fff',fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20}}>{source}</div>
            </div>
            <div style={{flex:1,minWidth:200,maxWidth:320}}>
              {breakdown.map(({star,pct})=>(
                <div key={star} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontSize:13,color:'#666',width:20,textAlign:'right'}}>{star}</span>
                  <span style={{color:'#f59e0b',fontSize:13}}>★</span>
                  <div style={{flex:1,height:8,background:'#eee',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:\`\${pct}%\`,background:'#f59e0b',borderRadius:4,transition:'width 1s ease'}} />
                  </div>
                  <span style={{fontSize:12,color:'#aaa',width:32,textAlign:'right'}}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:24}}>
          {safeItems.map((r,i)=>(
            <div key={i} style={{background:'#fafafa',borderRadius:20,padding:28,border:'1px solid #f0f0f0',transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`,opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)'}}
              onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}}
              onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div style={{display:'flex',gap:3}}>{stars(r.rating)}</div>
                {(r.source||source) && <span style={{fontSize:11,fontWeight:700,color:sourceColors[r.source||source]||'#555',background: \`\${sourceColors[r.source||source]||'#555'}15\`,padding:'3px 8px',borderRadius:10}}>{r.source||source}</span>}
              </div>
              <p style={{fontSize:14,lineHeight:1.75,color:'#444',margin:'0 0 20px',fontStyle:'italic'}}>"{r.text}"</p>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,flexShrink:0}}>
                  {r.avatar?<img src={r.avatar} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}} alt={r.name} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }}/>:r.name[0]}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                    <span style={{fontWeight:700,fontSize:14,color:'var(--fg,#111)'}}>{r.name}</span>
                    {r.verified && <span style={{fontSize:11,background:'#10b98115',color:'#10b981',fontWeight:700,padding:'2px 7px',borderRadius:8}}>✓ Verified</span>}
                  </div>
                  {(r.date||r.location)&&<div style={{fontSize:12,color:'#aaa',marginTop:2}}>{r.location||''}{r.location&&r.date?' · ':''}{r.date||''}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
"/components/sections/MapSection.tsx": `import React, { useState, useEffect } from 'react';
type Hour = { day: string; hours: string; closed?: boolean };
export default function MapSection({ title, address, phone, email, hours, mapUrl, accentColor }: { title?: string; address: string; phone?: string; email?: string; hours?: Hour[]; mapUrl?: string; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const mapsLink = \`https://maps.google.com/?q=\${encodeURIComponent(address)}\`;
  const staticImg = \`https://maps.googleapis.com/maps/api/staticmap?center=\${encodeURIComponent(address)}&zoom=15&size=600x400&markers=color:red%7C\${encodeURIComponent(address)}&key=AIzaSyD-placeholder\`;
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',marginBottom:48,textAlign:'center'}}>{title}</h2>}
        <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:40,alignItems:'start'}}>
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',display:'block',borderRadius:24,overflow:'hidden',boxShadow:'0 4px 32px rgba(0,0,0,0.1)',height:420,background:'#e8e8e8',position:'relative',cursor:'pointer'}}>
            <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#e8f0e8 0%,#d4e4d4 50%,#c8dcc8 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
              <div style={{width:64,height:64,borderRadius:50,background:accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,boxShadow:'0 8px 24px rgba(0,0,0,0.2)'}}>📍</div>
              <div style={{textAlign:'center',padding:'0 24px'}}>
                <div style={{fontWeight:800,fontSize:18,color:'#222',marginBottom:6}}>View on Google Maps</div>
                <div style={{fontSize:14,color:'#555',lineHeight:1.5}}>{address}</div>
              </div>
              <div style={{background:accent,color:'#fff',padding:'10px 24px',borderRadius:50,fontSize:13,fontWeight:700}}>Open Maps →</div>
            </div>
          </a>
          <div style={{paddingTop:8}}>
            <div style={{marginBottom:32}}>
              <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:20}}>
                <div style={{width:44,height:44,borderRadius:12,background:\`\${accent}15\`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>📍</div>
                <div><div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Address</div><p style={{color:'#666',fontSize:14,lineHeight:1.6,margin:0}}>{address}</p></div>
              </div>
              {phone&&<div style={{display:'flex',gap:14,alignItems:'center',marginBottom:20}}>
                <div style={{width:44,height:44,borderRadius:12,background:\`\${accent}15\`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>📞</div>
                <div><div style={{fontWeight:700,fontSize:15,marginBottom:2}}>Phone</div><a href={\`tel:\${phone.replace(/[^0-9+]/g,'')}\`} style={{color:accent,textDecoration:'none',fontSize:14,fontWeight:600}}>{phone}</a></div>
              </div>}
              {email&&<div style={{display:'flex',gap:14,alignItems:'center',marginBottom:20}}>
                <div style={{width:44,height:44,borderRadius:12,background:\`\${accent}15\`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>✉️</div>
                <div><div style={{fontWeight:700,fontSize:15,marginBottom:2}}>Email</div><a href={\`mailto:\${email}\`} style={{color:accent,textDecoration:'none',fontSize:14,fontWeight:600}}>{email}</a></div>
              </div>}
            </div>
            {hours&&hours.length>0&&<div>
              <div style={{fontWeight:800,fontSize:17,marginBottom:14}}>Hours</div>
              <div style={{background:'#fafafa',borderRadius:16,padding:20,border:'1px solid #f0f0f0'}}>
                {hours.map((h,i)=>{
                  const isToday=new Date().toLocaleDateString('en-US',{weekday:'long'})===h.day;
                  return(<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:i<hours.length-1?'1px solid #f0f0f0':'none',background:isToday?'rgba(0,0,0,0.02)':'transparent'}}>
                    <span style={{fontWeight:isToday?800:500,color:isToday?accent:'#444',fontSize:14}}>{h.day}{isToday?' ✦':''}</span>
                    <span style={{fontSize:14,color:h.closed?'#ef4444':isToday?accent:'#666',fontWeight:isToday?700:400}}>{h.closed?'Closed':h.hours}</span>
                  </div>);
                })}
              </div>
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/ServiceCards.tsx": `import React, { useState, useEffect } from 'react';
type Service = { title: string; desc?: string; description?: string; price?: string; icon?: string; badge?: string; features?: string[] };
export default function ServiceCards({ title, subtitle, items, services, accentColor, columns }: { title: string; subtitle?: string; items?: Service[]; services?: Service[]; accentColor?: string; columns?: number }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || services || []).filter(Boolean);
  const cols = columns || (safeItems.length <= 3 ? Math.max(1,safeItems.length) : safeItems.length <= 6 ? 3 : 4);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fafafa)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:17,maxWidth:560,margin:'0 auto'}}>{subtitle}</p>}
        </div>
        <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : \`repeat(\${cols},1fr)\`,gap:24}}>
          {safeItems.map((s,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:20,padding:32,border:'1px solid #f0f0f0',position:'relative',transition:\`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`,opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
              {s.badge&&<span style={{position:'absolute',top:20,right:20,background:accent,color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:50,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.badge}</span>}
              {s.icon&&<div style={{fontSize:36,marginBottom:16}}>{s.icon}</div>}
              <h3 style={{fontSize:20,fontWeight:700,margin:'0 0 8px',letterSpacing:'-0.01em'}}>{s.title}</h3>
              <p style={{color:'#888',fontSize:14,lineHeight:1.6,margin:'0 0 16px'}}>{s.desc||s.description||''}</p>
              {s.features&&<ul style={{listStyle:'none',padding:0,margin:'0 0 20px'}}>{s.features.map((f,j)=><li key={j} style={{fontSize:13,color:'#555',padding:'4px 0',display:'flex',gap:8,alignItems:'center'}}><span style={{color:accent,fontWeight:800}}>✓</span>{f}</li>)}</ul>}
              {s.price&&<div style={{fontSize:22,fontWeight:900,color:accent,letterSpacing:'-0.02em'}}>{s.price}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/StepProcess.tsx": `import React, { useState, useEffect } from 'react';
type Step = { title: string; desc: string; icon?: string };
export default function StepProcess({ title, subtitle, steps, accentColor, layout }: { title: string; subtitle?: string; steps: Step[]; accentColor?: string; layout?: 'horizontal'|'vertical' }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeSteps = (steps || []).filter(Boolean);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  const horiz = !isMobile && layout !== 'vertical';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:17,maxWidth:540,margin:'0 auto'}}>{subtitle}</p>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:horiz?\`repeat(\${safeSteps.length||1},1fr)\`:'1fr',gap:horiz?24:0,position:'relative'}}>
          {safeSteps.map((s,i)=>(
            <div key={i} style={{display:'flex',flexDirection:horiz?'column':'row',alignItems:horiz?'center':'flex-start',gap:horiz?16:24,textAlign:horiz?'center':'left',paddingBottom:horiz?0:40,borderLeft:!horiz&&i<safeSteps.length-1?\`2px dashed \${accent}33\`:!horiz?'2px solid transparent':'none',marginLeft:!horiz?20:0,paddingLeft:!horiz?32:0,position:'relative'}}>
              {!horiz&&<div style={{position:'absolute',left:-21,top:0,width:40,height:40,borderRadius:50,background:accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:16,flexShrink:0,zIndex:1}}>{s.icon||i+1}</div>}
              {horiz&&<div style={{width:56,height:56,borderRadius:50,background:accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:20,marginBottom:4}}>{s.icon||i+1}</div>}
              {horiz&&i<safeSteps.length-1&&<div style={{position:'absolute',top:28,left:'calc(50% + 28px)',width:'calc(100% - 56px)',height:2,background:\`\${accent}33\`,zIndex:0}}/>}
              <div><h3 style={{fontSize:17,fontWeight:700,margin:'0 0 6px'}}>{s.title}</h3><p style={{fontSize:14,color:'#888',lineHeight:1.6,margin:0}}>{s.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/VideoSection.tsx": `import React, { useState, useEffect } from 'react';
export default function VideoSection({ title, subtitle, videoUrl, thumbnail, accentColor }: { title?: string; subtitle?: string; videoUrl: string; thumbnail?: string; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const [playing, setPlaying] = useState(false);
  const isYoutube = videoUrl.includes('youtube') || videoUrl.includes('youtu.be');
  const embedUrl = isYoutube ? videoUrl.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/') + '?autoplay=1' : videoUrl;
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:960,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:40}}>
          {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 10px'}}>{title}</h2>}
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>}
        <div style={{borderRadius:24,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,0.15)',position:'relative',aspectRatio:'16/9',background:'#000'}}>
          {playing ? (
            <iframe src={embedUrl} width="100%" height="100%" style={{border:'none',position:'absolute',inset:0}} allow="autoplay; fullscreen" allowFullScreen />
          ) : (
            <button type="button" aria-label="Play video" onClick={()=>setPlaying(true)} style={{cursor:'pointer',position:'relative',width:'100%',height:'100%',background:'none',border:'none',padding:0}}>
              {thumbnail&&<img src={thumbnail} alt="video" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />}
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{width:80,height:80,borderRadius:50,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.3)',transition:'transform 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.transform='scale(1.1)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>
                  <div style={{width:0,height:0,borderTop:'14px solid transparent',borderBottom:'14px solid transparent',borderLeft:\`22px solid \${accent}\`,marginLeft:4}} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/AppDownload.tsx": `import React, { useState, useEffect } from 'react';
export default function AppDownload({ title, subtitle, description, appStoreUrl, playStoreUrl, mockupImage, accentColor, features }: { title: string; subtitle?: string; description?: string; appStoreUrl?: string; playStoreUrl?: string; mockupImage?: string; accentColor?: string; features?: string[] }) {
  const accent = accentColor || 'var(--accent,#111)';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:accent,color:'#fff',overflow:'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns: isMobile ? '1fr' : (mockupImage?'1fr 1fr':'1fr'),gap:60,alignItems:'center'}}>
        <div>
          {subtitle&&<p style={{fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',opacity:0.7,marginBottom:12}}>{subtitle}</p>}
          <h2 style={{fontSize:44,fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.1,margin:'0 0 16px'}}>{title}</h2>
          {description&&<p style={{fontSize:17,opacity:0.8,lineHeight:1.7,margin:'0 0 28px',maxWidth:480}}>{description}</p>}
          {features&&<ul style={{listStyle:'none',padding:0,margin:'0 0 32px'}}>{features.map((f,i)=><li key={i} style={{display:'flex',gap:10,alignItems:'center',marginBottom:10,fontSize:15,opacity:0.9}}><span style={{width:22,height:22,borderRadius:50,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>✓</span>{f}</li>)}</ul>}
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            {appStoreUrl&&<a href={appStoreUrl} style={{display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',borderRadius:14,padding:'12px 22px',textDecoration:'none',color:'#fff',border:'1.5px solid rgba(255,255,255,0.25)',transition:'background 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.25)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.15)'}><span style={{fontSize:26}}>🍎</span><div><div style={{fontSize:10,opacity:0.7,letterSpacing:'0.05em'}}>Download on the</div><div style={{fontSize:16,fontWeight:800}}>App Store</div></div></a>}
            {playStoreUrl&&<a href={playStoreUrl} style={{display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',borderRadius:14,padding:'12px 22px',textDecoration:'none',color:'#fff',border:'1.5px solid rgba(255,255,255,0.25)',transition:'background 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.25)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.15)'}><span style={{fontSize:26}}>🤖</span><div><div style={{fontSize:10,opacity:0.7,letterSpacing:'0.05em'}}>Get it on</div><div style={{fontSize:16,fontWeight:800}}>Google Play</div></div></a>}
          </div>
        </div>
        {mockupImage&&<div style={{display:'flex',justifyContent:'center'}}><img src={mockupImage} alt="app mockup" style={{maxHeight:480,objectFit:'contain',filter:'drop-shadow(0 32px 64px rgba(0,0,0,0.4))'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} /></div>}
      </div>
    </section>
  );
}`,

"/components/sections/Comparison.tsx": `import React, { useState, useEffect } from 'react';
type Plan = { name: string; highlighted?: boolean };
type Row = { feature: string; values: (string|boolean)[] };
export default function Comparison({ title, subtitle, plans, rows, accentColor }: { title: string; subtitle?: string; plans: Plan[]; rows: Row[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safePlans = (plans || []).filter(Boolean);
  const safeRows = (rows || []).filter(Boolean);
  const cell = (v: string|boolean) => typeof v === 'boolean' ? (v ? <span style={{color:'#22c55e',fontSize:20,fontWeight:800}}>✓</span> : <span style={{color:'#e5e7eb',fontSize:20}}>—</span>) : <span style={{fontSize:14,fontWeight:600}}>{v}</span>;
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>
        <div style={{borderRadius:24,overflow:'hidden',border:'1px solid #f0f0f0',boxShadow:'0 4px 24px rgba(0,0,0,0.06)',overflowX: isMobile ? 'auto' : 'visible'}}>
          <div style={{display:'grid',gridTemplateColumns:\`2fr \${safePlans.map(()=>'1fr').join(' ')}\`,background:'#fafafa',borderBottom:'1px solid #f0f0f0'}}>
            <div style={{padding:'20px 24px'}}/>
            {safePlans.map((p,i)=><div key={i} style={{padding:'20px 16px',textAlign:'center',background:p.highlighted?accent:'transparent',position:'relative'}}>{p.highlighted&&<div style={{position:'absolute',top:-1,left:0,right:0,height:3,background:accent,borderRadius:'3px 3px 0 0'}}/>}<div style={{fontWeight:800,fontSize:16,color:p.highlighted?'#fff':'#222'}}>{p.name}</div></div>)}
          </div>
          {safeRows.map((r,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:\`2fr \${safePlans.map(()=>'1fr').join(' ')}\`,borderBottom:i<safeRows.length-1?'1px solid #f5f5f5':'none',background:i%2===0?'#fff':'#fafafa'}}>
              <div style={{padding:'16px 24px',fontSize:14,fontWeight:500,color:'#444'}}>{r.feature}</div>
              {r.values.map((v,j)=><div key={j} style={{padding:'16px 16px',textAlign:'center',background:safePlans[j]?.highlighted?'rgba(0,0,0,0.03)':'transparent'}}>{cell(v)}</div>)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Portfolio.tsx": `import React, { useState, useEffect } from 'react';
type Project = { title: string; category: string; image: string; desc?: string; link?: string };
export default function Portfolio({ title, subtitle, items, accentColor }: { title: string; subtitle?: string; items: Project[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean) as Project[];
  const cats = ['All', ...Array.from(new Set(safeItems.map(p=>p.category)))];
  const [active, setActive] = useState('All');
  const [hover, setHover] = useState<number|null>(null);
  const filtered = active==='All'?safeItems:safeItems.filter(p=>p.category===active);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16,marginBottom:0}}>{subtitle}</p>}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:40,flexWrap:'wrap'}}>
          {cats.map(c=><button type="button" aria-pressed={active===c} key={c} onClick={()=>setActive(c)} style={{padding:'8px 20px',borderRadius:50,border:active===c?'none':'1.5px solid #e5e5e5',background:active===c?accent:'transparent',color:active===c?'#fff':'#666',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.18s'}}>{c}</button>)}
        </div>
        <div style={{columns: isMobile ? 2 : 3,gap:20}}>
          {filtered.map((p,i)=>(
            <div key={i} style={{breakInside:'avoid',marginBottom:20,borderRadius:16,overflow:'hidden',position:'relative',cursor:'pointer'}} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}>
              <img src={p.image} alt={p.title} style={{width:'100%',display:'block',transition:'transform 0.4s',transform:hover===i?'scale(1.05)':'scale(1)'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />
              <div style={{position:'absolute',inset:0,background:hover===i?'rgba(0,0,0,0.65)':'rgba(0,0,0,0)',transition:'background 0.3s',display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:24}}>
                {hover===i&&<><span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{p.category}</span><h3 style={{fontSize:18,fontWeight:700,color:'#fff',margin:'4px 0 6px'}}>{p.title}</h3>{p.desc&&<p style={{fontSize:13,color:'rgba(255,255,255,0.8)',margin:0}}>{p.desc}</p>}</>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/EventsList.tsx": `import React, { useState, useEffect } from 'react';
type Event = { title: string; date: string; time?: string; location?: string; desc?: string; image?: string; link?: string; badge?: string };
export default function EventsList({ title, subtitle, items, events, accentColor, layout }: { title: string; subtitle?: string; items?: Event[]; events?: Event[]; accentColor?: string; layout?: 'list'|'grid' }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || events || []).filter(Boolean) as Event[];
  const grid = layout === 'grid';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 10px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16,margin:0}}>{subtitle}</p>}
        </div>
        <div style={{display:grid?'grid':'flex',gridTemplateColumns:grid?'repeat(auto-fill,minmax(300px,1fr))':undefined,flexDirection:grid?undefined:'column',gap:grid?24:0}}>
          {safeItems.map((ev,i)=>(
            <div key={i} style={{background:'#fafafa',borderRadius:grid?20:0,overflow:'hidden',borderBottom:!grid&&i<safeItems.length-1?'1px solid #f0f0f0':'none',display:'flex',flexDirection:grid?'column':'row',alignItems:grid?'stretch':'center',gap:grid?0:24,padding:grid?0:'20px 0',transition:'box-shadow 0.2s'}} onMouseOver={e=>grid&&((e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.08)')} onMouseOut={e=>grid&&((e.currentTarget as HTMLElement).style.boxShadow='none')}>
              {ev.image&&<img src={ev.image} alt={ev.title} style={{width:grid?'100%':100,height:grid?180:100,objectFit:'cover',flexShrink:0,borderRadius:grid?'0':'12px'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }}/>}
              <div style={{padding:grid?20:0,flex:1}}>
                {ev.badge&&<span style={{background:accent,color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:50,display:'inline-block',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>{ev.badge}</span>}
                <h3 style={{fontSize:17,fontWeight:700,margin:'0 0 6px',letterSpacing:'-0.01em'}}>{ev.title}</h3>
                <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:ev.desc?8:0}}>
                  <span style={{fontSize:13,color:accent,fontWeight:600}}>📅 {ev.date}</span>
                  {ev.time&&<span style={{fontSize:13,color:'#888'}}>🕐 {ev.time}</span>}
                  {ev.location&&<span style={{fontSize:13,color:'#888'}}>📍 {ev.location}</span>}
                </div>
                {ev.desc&&<p style={{fontSize:13,color:'#888',margin:0,lineHeight:1.6}}>{ev.desc}</p>}
              </div>
              {ev.link&&<a href={ev.link} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',padding:'8px 18px',borderRadius:50,background:accent,color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700,flexShrink:0,margin:grid?'0 20px 20px':'0'}}>RSVP →</a>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Countdown.tsx": `import React, { useState, useEffect } from 'react';
export default function Countdown({ title, subtitle, targetDate, cta, ctaHref, accentColor, dark }: { title: string; subtitle?: string; targetDate: string; cta?: string; ctaHref?: string; accentColor?: string; dark?: boolean }) {
  const accent = accentColor || 'var(--accent,#111)';
  const bg = dark ? '#0f0f0f' : 'var(--bg,#fff)';
  const fg = dark ? '#fff' : '#111';
  const [time, setTime] = useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    const tick=()=>{const diff=Math.max(0,new Date(targetDate).getTime()-Date.now());setTime({d:Math.floor(diff/86400000),h:Math.floor(diff/3600000)%24,m:Math.floor(diff/60000)%60,s:Math.floor(diff/1000)%60});};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[targetDate]);
  const box = (v:number,l:string)=>(
    <div style={{textAlign:'center'}}>
      <div style={{background:dark?'rgba(255,255,255,0.08)':'#f5f5f5',borderRadius:16,padding:'24px 32px',minWidth:90,marginBottom:8}}>
        <div style={{fontSize:52,fontWeight:900,lineHeight:1,color:accent,letterSpacing:'-0.04em'}}>{String(v).padStart(2,'0')}</div>
      </div>
      <div style={{fontSize:12,fontWeight:600,color:dark?'rgba(255,255,255,0.5)':'#999',textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</div>
    </div>
  );
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section style={{padding: isMobile ? '48px 20px' : '80px 40px',background:bg,color:fg}}>
      <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
        <h2 style={{fontSize:42,fontWeight:800,letterSpacing:'-0.03em',margin:'0 0 12px'}}>{title}</h2>
        {subtitle&&<p style={{fontSize:17,color:dark?'rgba(255,255,255,0.6)':'#888',margin:'0 0 48px'}}>{subtitle}</p>}
        <div style={{display:'flex',gap:20,justifyContent:'center',alignItems:'flex-start',marginBottom:48}}>
          {box(time.d,'Days')}{box(time.h,'Hours')}{box(time.m,'Mins')}{box(time.s,'Secs')}
        </div>
        {cta&&<a href={ctaHref||'#'} style={{display:'inline-block',padding:'14px 36px',borderRadius:50,background:accent,color:'#fff',textDecoration:'none',fontWeight:800,fontSize:16,letterSpacing:'-0.01em'}}>{cta}</a>}
      </div>
    </section>
  );
}`,

"/components/sections/TrustBadges.tsx": `import React, { useState, useEffect } from 'react';
type Badge = { label: string; icon?: string; sub?: string };
export default function TrustBadges({ items, badges, title, accentColor }: { items?: Badge[]; badges?: Badge[]; title?: string; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || badges || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '32px 20px' : '48px 40px',background:'var(--bg,#fafafa)',borderTop:'1px solid #f0f0f0',borderBottom:'1px solid #f0f0f0', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {title&&<p style={{textAlign:'center',fontSize:13,fontWeight:600,color:'#bbb',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:28}}>{title}</p>}
        <div style={{display:'flex',flexWrap:'wrap',gap:24,justifyContent:'center',alignItems:'center'}}>
          {safeItems.map((b,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 24px',background:'#fff',borderRadius:50,border:'1.5px solid #f0f0f0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
              {b.icon&&<span style={{fontSize:22}}>{b.icon}</span>}
              <div><div style={{fontSize:13,fontWeight:700,color:'#222'}}>{b.label}</div>{b.sub&&<div style={{fontSize:11,color:'#aaa'}}>{b.sub}</div>}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/BeforeAfter.tsx": `import React, { useState, useEffect, useRef, useCallback } from 'react';
type Item = { title?: string; before: string; after: string; beforeLabel?: string; afterLabel?: string };
export default function BeforeAfter({ title, subtitle, items, accentColor }: { title?: string; subtitle?: string; items: Item[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean);
  const [pos, setPos] = useState<number[]>(safeItems.map(()=>50));
  const activeIdx = useRef<number|null>(null);
  const containerRefs = useRef<(HTMLDivElement|null)[]>([]);
  const calcPct = useCallback((clientX: number, el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    return Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
  }, []);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, i: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activeIdx.current = i;
    setPos(p => p.map((v,j) => j===i ? calcPct(e.clientX, e.currentTarget) : v));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>, i: number) => {
    if (activeIdx.current !== i) return;
    setPos(p => p.map((v,j) => j===i ? calcPct(e.clientX, e.currentTarget) : v));
  };
  const onPointerUp = () => { activeIdx.current = null; };
  const sectionRef = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={sectionRef as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <style>{\`@keyframes baHandlePulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.15)} }\`}</style>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:48}}>
          {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 10px'}}>{title}</h2>}
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>}
        <div style={{display:'grid',gridTemplateColumns:\`repeat(\${Math.max(1,safeItems.length)},1fr)\`,gap:24}}>
          {safeItems.map((item,i)=>(
            <div key={i}>
              {item.title&&<h3 style={{fontSize:16,fontWeight:700,textAlign:'center',marginBottom:12}}>{item.title}</h3>}
              <div ref={el=>containerRefs.current[i]=el} style={{position:'relative',borderRadius:16,overflow:'hidden',cursor:'ew-resize',userSelect:'none',aspectRatio:'4/3',touchAction:'none'}} onPointerDown={e=>onPointerDown(e,i)} onPointerMove={e=>onPointerMove(e,i)} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
                <img src={item.after} alt="after" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />
                <div style={{position:'absolute',inset:0,overflow:'hidden',width:\`\${pos[i]}%\`}}>
                  <img src={item.before} alt="before" style={{position:'absolute',inset:0,width: \`\${10000/pos[i]}%\`,maxWidth:'none',height:'100%',objectFit:'cover'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />
                </div>
                <div style={{position:'absolute',top:0,bottom:0,left:\`\${pos[i]}%\`,width:3,background:'#fff',transform:'translateX(-50%)',boxShadow:'0 0 8px rgba(0,0,0,0.4)',pointerEvents:'none'}}>
                  <div style={{position:'absolute',top:'50%',left:'50%',animation:'baHandlePulse 2s ease infinite',width:36,height:36,borderRadius:50,background:'#fff',boxShadow:'0 2px 16px rgba(0,0,0,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:accent,fontWeight:800}}>⟺</div>
                </div>
                <div style={{position:'absolute',bottom:12,left:12,background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:50,pointerEvents:'none'}}>{item.beforeLabel||'Before'}</div>
                <div style={{position:'absolute',bottom:12,right:12,background:accent,color:'#fff',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:50,pointerEvents:'none'}}>{item.afterLabel||'After'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/HoursTable.tsx": `import React, { useState, useEffect } from 'react';
type Hour = { day: string; open?: string; close?: string; closed?: boolean };
export default function HoursTable({ title, hours, note, accentColor }: { title?: string; hours: Hour[]; note?: string; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeHours = (hours || []).filter(Boolean);
  const today = new Date().toLocaleDateString('en-US',{weekday:'long'});
  const now = new Date();
  const todayHours = safeHours.find(h=>h.day===today);
  const isOpenNow = ()=>{if(!todayHours||todayHours.closed||!todayHours.open||!todayHours.close)return false;const[oh,om]=todayHours.open.split(':').map(Number);const[ch,cm]=todayHours.close.split(':').map(Number);const cur=now.getHours()*60+now.getMinutes();return cur>=oh*60+om&&cur<=ch*60+cm;};
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '40px 20px' : '60px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:560,margin:'0 auto'}}>
        {title&&<h2 style={{fontSize:32,fontWeight:700,letterSpacing:'-0.02em',marginBottom:24,textAlign:'center'}}>{title}</h2>}
        <div style={{background:'#fafafa',borderRadius:20,overflow:'hidden',border:'1px solid #f0f0f0'}}>
          <div style={{padding:'16px 24px',background:accent,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{color:'#fff',fontWeight:700,fontSize:15}}>Hours</span>
            <span style={{background:isOpenNow()?'#22c55e':'#ef4444',color:'#fff',fontSize:12,fontWeight:700,padding:'3px 12px',borderRadius:50}}>{isOpenNow()?'Open Now':'Closed Now'}</span>
          </div>
          {safeHours.map((h,i)=>{const isT=h.day===today;return(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 24px',borderBottom:i<safeHours.length-1?'1px solid #f0f0f0':'none',background:isT?'rgba(0,0,0,0.02)':'transparent'}}>
            <span style={{fontSize:14,fontWeight:isT?800:500,color:isT?accent:'#555'}}>{h.day}{isT&&' (Today)'}</span>
            <span style={{fontSize:14,color:h.closed?'#ef4444':isT?accent:'#666',fontWeight:isT?700:400}}>{h.closed?'Closed':\`\${h.open} – \${h.close}\`}</span>
          </div>);})}
        </div>
        {note&&<p style={{textAlign:'center',fontSize:13,color:'#aaa',marginTop:16}}>{note}</p>}
      </div>
    </section>
  );
}`,

"/components/sections/ProductSpotlight.tsx": `import React, { useState, useEffect } from 'react';
type Feature = { icon?: string; label: string };
export default function ProductSpotlight({ title, subtitle, description, image, price, originalPrice, cta, ctaHref, features, badge, accentColor, imageLeft }: { title: string; subtitle?: string; description?: string; image: string; price?: string; originalPrice?: string; cta?: string; ctaHref?: string; features?: Feature[]; badge?: string; accentColor?: string; imageLeft?: boolean }) {
  const accent = accentColor || 'var(--accent,#111)';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center',direction:imageLeft?'rtl':'ltr'}}>
        <div style={{borderRadius:24,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,0.1)',position:'relative',direction:'ltr'}}>
          <img src={image} alt={title} style={{width:'100%',display:'block',aspectRatio:'4/3',objectFit:'cover'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />
          {badge&&<span style={{position:'absolute',top:20,left:20,background:accent,color:'#fff',fontSize:12,fontWeight:800,padding:'6px 16px',borderRadius:50,textTransform:'uppercase',letterSpacing:'0.05em'}}>{badge}</span>}
        </div>
        <div style={{direction:'ltr'}}>
          {subtitle&&<p style={{fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:accent,marginBottom:12}}>{subtitle}</p>}
          <h2 style={{fontSize:40,fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.1,margin:'0 0 16px'}}>{title}</h2>
          {description&&<p style={{fontSize:16,color:'#777',lineHeight:1.7,margin:'0 0 24px'}}>{description}</p>}
          {features&&<div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:28}}>{features.map((f,i)=><span key={i} style={{display:'flex',alignItems:'center',gap:6,background:'#f5f5f5',borderRadius:50,padding:'6px 14px',fontSize:13,fontWeight:600}}>{f.icon&&<span>{f.icon}</span>}{f.label}</span>)}</div>}
          {price&&<div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:28}}><span style={{fontSize:38,fontWeight:900,color:accent,letterSpacing:'-0.03em'}}>{price}</span>{originalPrice&&<span style={{fontSize:18,color:'#bbb',textDecoration:'line-through'}}>{originalPrice}</span>}</div>}
          {cta&&<a href={ctaHref||'#'} style={{display:'inline-block',padding:'14px 32px',borderRadius:50,background:accent,color:'#fff',textDecoration:'none',fontWeight:800,fontSize:16,transition:'opacity 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>{cta}</a>}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/LocationCards.tsx": `import React, { useState, useEffect } from 'react';
type Location = { name: string; address: string; phone?: string; hours?: string; image?: string; link?: string };
export default function LocationCards({ title, subtitle, items, accentColor }: { title: string; subtitle?: string; items: Location[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean) as Location[];
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:24}}>
          {safeItems.map((loc,i)=>(
            <div key={i} style={{background:'#fafafa',borderRadius:20,overflow:'hidden',border:'1px solid #f0f0f0',transition:'box-shadow 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.boxShadow='none'}>
              {loc.image&&<img src={loc.image} alt={loc.name} style={{width:'100%',height:180,objectFit:'cover',display:'block'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }}/>}
              <div style={{padding:24}}>
                <h3 style={{fontSize:18,fontWeight:700,margin:'0 0 8px'}}>{loc.name}</h3>
                <p style={{fontSize:14,color:'#888',margin:'0 0 4px'}}>📍 {loc.address}</p>
                {loc.phone&&<p style={{fontSize:14,color:'#888',margin:'0 0 4px'}}>📞 <a href={\`tel:\${loc.phone.replace(/[^0-9+]/g,'')}\`} style={{color:'inherit',textDecoration:'none'}}>{loc.phone}</a></p>}
                {loc.hours&&<p style={{fontSize:14,color:'#888',margin:'0 0 16px'}}>🕐 {loc.hours}</p>}
                {loc.link&&<a href={loc.link} target="_blank" rel="noopener noreferrer" style={{fontSize:13,fontWeight:700,color:accent,textDecoration:'none'}}>Get Directions →</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/QuoteBlock.tsx": `import React, { useState, useEffect } from 'react';
export default function QuoteBlock({ quote, author, role, image, accentColor, dark }: { quote: string; author?: string; role?: string; image?: string; accentColor?: string; dark?: boolean }) {
  const accent = accentColor || 'var(--accent,#111)';
  const bg = dark ? accent : 'var(--bg,#fafafa)';
  const fg = dark ? '#fff' : '#111';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:bg, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
        <div style={{fontSize:80,lineHeight:0.8,color:dark?'rgba(255,255,255,0.2)':accent,marginBottom:24,fontFamily:'Georgia,serif'}}>"</div>
        <blockquote style={{fontSize:28,fontWeight:700,lineHeight:1.4,letterSpacing:'-0.02em',color:fg,margin:'0 0 40px',fontStyle:'italic'}}>{quote}</blockquote>
        {(author||image)&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14}}>
          {image&&<img src={image} alt={author||''} style={{width:52,height:52,borderRadius:50,objectFit:'cover'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }}/>}
          <div style={{textAlign:'left'}}>
            {author&&<div style={{fontWeight:800,fontSize:16,color:fg}}>{author}</div>}
            {role&&<div style={{fontSize:13,color:dark?'rgba(255,255,255,0.6)':'#999'}}>{role}</div>}
          </div>
        </div>}
      </div>
    </section>
  );
}`,

"/components/sections/IconFeatures.tsx": `import React, { useState, useEffect } from 'react';
type Feature = { icon: string; title: string; desc: string };
export default function IconFeatures({ title, subtitle, items, accentColor, columns, dark }: { title?: string; subtitle?: string; items: Feature[]; accentColor?: string; columns?: number; dark?: boolean }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean);
  const cols = columns || (safeItems.length <= 3 ? Math.max(1, safeItems.length) : safeItems.length <= 4 ? 4 : safeItems.length <= 6 ? 3 : 4);
  const bg = dark ? '#0f0f0f' : 'var(--bg,#fff)';
  const fg = dark ? '#fff' : '#111';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:bg, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:56}}>
          {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px',color:fg}}>{title}</h2>}
          {subtitle&&<p style={{color:dark?'rgba(255,255,255,0.55)':'#888',fontSize:17,maxWidth:540,margin:'0 auto'}}>{subtitle}</p>}
        </div>}
        <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : \`repeat(\${cols},1fr)\`,gap:32}}>
          {safeItems.map((f,i)=>(
            <div key={i} style={{textAlign:'center',padding:'32px 16px'}}>
              <div style={{width:64,height:64,borderRadius:20,background:dark?'rgba(255,255,255,0.08)':\`\${accent}14\`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 20px'}}>{f.icon}</div>
              <h3 style={{fontSize:17,fontWeight:700,margin:'0 0 8px',color:fg}}>{f.title}</h3>
              <p style={{fontSize:14,color:dark?'rgba(255,255,255,0.55)':'#888',lineHeight:1.65,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/StickyBar.tsx": `import React, { useState, useEffect } from 'react';
export default function StickyBar({ text, cta, ctaHref, accentColor, showAfterScroll }: { text: string; cta: string; ctaHref?: string; accentColor?: string; showAfterScroll?: number }) {
  const accent = accentColor || 'var(--accent,#111)';
  const [shown, setShown] = useState(!showAfterScroll);
  useEffect(()=>{if(!showAfterScroll)return;const h=()=>setShown(window.scrollY>showAfterScroll);window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h);},[showAfterScroll]);
  return (
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:999,background:accent,color:'#fff',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 -4px 24px rgba(0,0,0,0.15)',backdropFilter:'blur(8px)',transform: shown ? 'translateY(0)' : 'translateY(100%)',transition:'transform 0.3s ease'}}>
      <span style={{fontSize:15,fontWeight:600}}>{text}</span>
      <a href={ctaHref||'#'} style={{background:'#fff',color:accent,borderRadius:50,padding:'10px 24px',fontWeight:800,fontSize:14,textDecoration:'none',flexShrink:0,transition:'opacity 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{cta}</a>
    </div>
  );
}`,

"/components/sections/VideoHero.tsx": `import React, { useState, useEffect } from 'react';
export default function VideoHero({ title, subtitle, cta, ctaHref, cta2, cta2Href, videoUrl, accentColor, overlay }: { title: string; subtitle?: string; cta?: string; ctaHref?: string; cta2?: string; cta2Href?: string; videoUrl: string; accentColor?: string; overlay?: number }) {
  const accent = accentColor || 'var(--accent,#c2410c)';
  return (
    <section style={{position:'relative',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',color:'#fff'}}>
      <video autoPlay muted loop playsInline style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}}>
        <source src={videoUrl} type="video/mp4"/>
      </video>
      <div style={{position:'absolute',inset:0,background:\`rgba(0,0,0,\${overlay??0.5})\`,zIndex:1}}/>
      <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'0 40px',maxWidth:900}}>
        <h1 style={{fontSize:'clamp(40px,6vw,80px)',fontWeight:900,lineHeight:1.05,letterSpacing:'-0.03em',margin:'0 0 20px'}}>{title}</h1>
        {subtitle&&<p style={{fontSize:'clamp(16px,2vw,22px)',opacity:0.85,maxWidth:580,margin:'0 auto 40px',lineHeight:1.6}}>{subtitle}</p>}
        {(cta||cta2)&&<div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
          {cta&&<a href={ctaHref||'#'} style={{display:'inline-block',padding:'15px 36px',borderRadius:50,background:accent,color:'#fff',textDecoration:'none',fontWeight:800,fontSize:17,transition:'opacity 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>{cta}</a>}
          {cta2&&<a href={cta2Href||'#'} style={{display:'inline-block',padding:'15px 36px',borderRadius:50,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',color:'#fff',textDecoration:'none',fontWeight:700,fontSize:17,border:'1.5px solid rgba(255,255,255,0.35)'}}>{cta2}</a>}
        </div>}
      </div>
    </section>
  );
}`,

"/components/sections/RichText.tsx": `import React, { useState, useEffect } from 'react';
type Block = { type: 'h2'|'h3'|'p'|'quote'|'list'; content: string; items?: string[] };
export default function RichText({ blocks, accentColor, maxWidth }: { blocks: Block[]; accentColor?: string; maxWidth?: number }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeBlocks = (blocks || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:maxWidth||720,margin:'0 auto'}}>
        {safeBlocks.map((b,i)=>{
          if(b.type==='h2')return<h2 key={i} style={{fontSize:34,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 16px'}}>{b.content}</h2>;
          if(b.type==='h3')return<h3 key={i} style={{fontSize:22,fontWeight:700,margin:'0 0 12px'}}>{b.content}</h3>;
          if(b.type==='p')return<p key={i} style={{fontSize:17,color:'#555',lineHeight:1.8,margin:'0 0 20px'}}>{b.content}</p>;
          if(b.type==='quote')return<blockquote key={i} style={{borderLeft:\`4px solid \${accent}\`,margin:'28px 0',padding:'12px 24px',background:\`\${accent}08\`,borderRadius:'0 12px 12px 0'}}><p style={{fontSize:18,fontStyle:'italic',color:'#444',margin:0,lineHeight:1.7}}>{b.content}</p></blockquote>;
          if(b.type==='list'&&b.items)return<ul key={i} style={{listStyle:'none',padding:0,margin:'0 0 20px'}}>{b.items.map((it,j)=><li key={j} style={{padding:'6px 0',paddingLeft:24,position:'relative',fontSize:16,color:'#555',lineHeight:1.7}}><span style={{position:'absolute',left:0,color:accent,fontWeight:700}}>•</span>{it}</li>)}</ul>;
          return null;
        })}
      </div>
    </section>
  );
}`,

"/components/sections/Partners.tsx": `import React, { useState, useEffect } from 'react';
type Partner = { name: string; logo?: string; desc?: string; url?: string };
export default function Partners({ title, subtitle, items, accentColor, showDesc }: { title?: string; subtitle?: string; items: Partner[]; accentColor?: string; showDesc?: boolean }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean) as Partner[];
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:48}}>
          {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>}
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>}
        <div style={{display:'grid',gridTemplateColumns:showDesc?\`repeat(auto-fill,minmax(240px,1fr))\`:\`repeat(auto-fill,minmax(160px,1fr))\`,gap:showDesc?24:16,alignItems:'center'}}>
          {safeItems.map((p,i)=>(
            <a key={i} href={p.url||'#'} target={p.url?'_blank':undefined} rel={p.url?'noopener noreferrer':undefined} style={{textDecoration:'none',display:'flex',flexDirection:showDesc?'column':'row',alignItems:'center',gap:12,padding:showDesc?24:16,borderRadius:16,border:'1.5px solid #f0f0f0',background:'#fafafa',transition:'all 0.2s',color:'inherit'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.borderColor=accent;(e.currentTarget as HTMLElement).style.background='#fff'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.borderColor='#f0f0f0';(e.currentTarget as HTMLElement).style.background='#fafafa'}}>
              {p.logo?<img src={p.logo} alt={p.name} style={{height:36,objectFit:'contain',filter:'grayscale(1)',transition:'filter 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.filter='none'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.filter='grayscale(1)'} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }}/>:<div style={{fontWeight:800,fontSize:16,color:'#bbb'}}>{p.name}</div>}
              {showDesc&&<div><div style={{fontWeight:700,fontSize:14}}>{p.name}</div>{p.desc&&<p style={{fontSize:13,color:'#888',margin:'4px 0 0'}}>{p.desc}</p>}</div>}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Awards.tsx": `import React, { useState, useEffect } from 'react';
type Award = { title: string; org?: string; year?: string; icon?: string; image?: string };
export default function Awards({ title, subtitle, items, accentColor }: { title?: string; subtitle?: string; items: Award[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean) as Award[];
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '40px 20px' : '60px 40px',background:'var(--bg,#fafafa)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:40}}>
          {title&&<h2 style={{fontSize:34,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 8px'}}>{title}</h2>}
          {subtitle&&<p style={{color:'#888',fontSize:15}}>{subtitle}</p>}
        </div>}
        <div style={{display:'flex',flexWrap:'wrap',gap:20,justifyContent:'center'}}>
          {safeItems.map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'16px 24px',background:'#fff',borderRadius:16,border:'1.5px solid #f0f0f0',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
              {a.image?<img src={a.image} alt={a.title} style={{height:48,objectFit:'contain'}} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }}/>:<div style={{fontSize:32}}>{a.icon||'🏆'}</div>}
              <div><div style={{fontWeight:700,fontSize:15,color:'#222'}}>{a.title}</div>{(a.org||a.year)&&<div style={{fontSize:12,color:'#aaa'}}>{[a.org,a.year].filter(Boolean).join(' · ')}</div>}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/SocialProof.tsx": `import React, { useState, useEffect } from 'react';
type Stat = { value: string; label: string; icon?: string };
type Quote = { text: string; author: string; image?: string };
export default function SocialProof({ stats, quotes, accentColor, dark }: { stats?: Stat[]; quotes?: Quote[]; accentColor?: string; dark?: boolean }) {
  const accent = accentColor || 'var(--accent,#111)';
  const bg = dark ? '#0f0f0f' : accent;
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding: isMobile ? '48px 20px' : '80px 40px',background:bg,color:'#fff', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {stats&&<div style={{display:'grid',gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : \`repeat(\${stats.length},1fr)\`,gap:32,marginBottom:quotes?60:0}}>
          {stats.map((s,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              {s.icon&&<div style={{fontSize:32,marginBottom:8}}>{s.icon}</div>}
              <div style={{fontSize:52,fontWeight:900,letterSpacing:'-0.04em',lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:14,opacity:0.7,marginTop:8,fontWeight:500}}>{s.label}</div>
            </div>
          ))}
        </div>}
        {quotes&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:24}}>
          {quotes.map((q,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.1)',borderRadius:20,padding:28,backdropFilter:'blur(8px)'}}>
              <p style={{fontSize:15,lineHeight:1.7,margin:'0 0 20px',fontStyle:'italic',opacity:0.9}}>"{q.text}"</p>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {q.image?<img src={q.image} alt={q.author} style={{width:36,height:36,borderRadius:50,objectFit:'cover'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }}/>:<div style={{width:36,height:36,borderRadius:50,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{q.author[0]}</div>}
                <span style={{fontWeight:700,fontSize:14}}>{q.author}</span>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </section>
  );
}`,

"/components/sections/ImageText.tsx": `import React, { useState, useEffect } from 'react';
type Block = { image: string; title: string; desc: string; cta?: string; ctaHref?: string; badge?: string; imageLeft?: boolean };
export default function ImageText({ blocks, accentColor }: { blocks: Block[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeBlocks = (blocks || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return (
    <section ref={ref as any} style={{padding:'60px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'flex',flexDirection:'column',gap:80}}>
        {safeBlocks.map((b,i)=>{
          const left = b.imageLeft !== undefined ? b.imageLeft : i%2===0;
          return (
            <div key={i} style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:64,alignItems:'center',direction:'ltr'}}>
              <div style={{borderRadius:24,overflow:'hidden',boxShadow:'0 16px 64px rgba(0,0,0,0.1)',direction:'ltr',position:'relative'}}>
                <img src={b.image} alt={b.title} style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',display:'block'}} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }}/>
                {b.badge&&<span style={{position:'absolute',top:16,left:16,background:accent,color:'#fff',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:50,textTransform:'uppercase',letterSpacing:'0.05em'}}>{b.badge}</span>}
              </div>
              <div style={{direction:'ltr'}}>
                <h2 style={{fontSize:34,fontWeight:800,letterSpacing:'-0.02em',margin:'0 0 16px',lineHeight:1.2}}>{b.title}</h2>
                <p style={{fontSize:16,color:'#777',lineHeight:1.8,margin:'0 0 28px'}}>{b.desc}</p>
                {b.cta&&<a href={b.ctaHref||'#'} style={{display:'inline-block',padding:'12px 28px',borderRadius:50,background:accent,color:'#fff',textDecoration:'none',fontWeight:700,fontSize:15,transition:'opacity 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>{b.cta} →</a>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}`,

"/components/sections/PricingCard.tsx": `import React from 'react';
export default function PricingCard({ name, price, period, desc, features, cta, highlighted, badge, accentColor, onSelect }: { name: string; price: string; period?: string; desc?: string; features: string[]; cta: string; highlighted?: boolean; badge?: string; accentColor?: string; onSelect?: () => void }) {
  const accent = accentColor || 'hsl(var(--primary))';
  return (
    <div style={{ border: highlighted ? \`2px solid \${accent}\` : '1px solid hsl(var(--border))', borderRadius: 16, padding: 32, background: highlighted ? accent : 'hsl(var(--card))', color: highlighted ? '#fff' : 'hsl(var(--foreground))', position: 'relative', maxWidth: 360, fontFamily: 'inherit' }}>
      {badge && <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: highlighted ? '#fff' : accent, color: highlighted ? accent : '#fff', borderRadius: 999, padding: '4px 16px', fontSize: 12, fontWeight: 700 }}>{badge}</span>}
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{name}</div>
      {desc && <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 16 }}>{desc}</div>}
      <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{price}<span style={{ fontSize: 18, fontWeight: 400 }}>{period ? \`/\${period}\` : ''}</span></div>
      <ul style={{ listStyle: 'none', margin: '20px 0', padding: 0 }}>
        {(features || []).map((f, i) => <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14 }}><span style={{ color: highlighted ? '#fff' : accent }}>✓</span>{f}</li>)}
      </ul>
      <button onClick={onSelect} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: highlighted ? '2px solid #fff' : \`2px solid \${accent}\`, background: highlighted ? '#fff' : accent, color: highlighted ? accent : '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{cta}</button>
    </div>
  );
}`,

"/components/sections/TestimonialCard.tsx": `import React from 'react';
export default function TestimonialCard({ text, author, role, rating, accentColor }: { text: string; author: string; role?: string; rating?: number; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const stars = rating ?? 5;
  const initials = author.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, padding: 28, fontFamily: 'inherit', position: 'relative' }}>
      <div style={{ fontSize: 64, lineHeight: 0.6, color: accent, opacity: 0.25, fontFamily: 'Georgia, serif', marginBottom: 8 }}>"</div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < stars ? '#f59e0b' : 'hsl(var(--muted))' }}>★</span>)}
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.65, color: 'hsl(var(--foreground))', margin: '0 0 20px' }}>{text}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>{initials}</div>
        <div><div style={{ fontWeight: 700, fontSize: 14 }}>{author}</div>{role && <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{role}</div>}</div>
      </div>
    </div>
  );
}`,

"/components/sections/FeatureCard.tsx": `import React from 'react';
export default function FeatureCard({ icon, title, desc, href, accentColor }: { icon: string; title: string; desc: string; href?: string; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const inner = (
    <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, padding: 28, fontFamily: 'inherit', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'hsl(var(--foreground))' }}>{title}</div>
      <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>{desc}</div>
      {href && <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: accent }}>Learn more →</div>}
    </div>
  );
  return href ? <a href={href} style={{ textDecoration: 'none' }}>{inner}</a> : inner;
}`,

"/components/sections/StatBadge.tsx": `import React, { useEffect, useState } from 'react';
export default function StatBadge({ value, label, icon, accentColor }: { value: string; label: string; icon?: string; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const numMatch = value.match(/^([\d,.]+)(.*)/);
  const numPart = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : null;
  const suffix = numMatch ? numMatch[2] : '';
  const [display, setDisplay] = useState(numPart !== null ? '0' : value);
  useEffect(() => {
    if (numPart === null) return;
    const steps = 60; const increment = numPart / steps; let current = 0; let step = 0;
    const t = setInterval(() => {
      step++; current = Math.min(increment * step, numPart);
      setDisplay((numPart > 999 ? current.toLocaleString('en', { maximumFractionDigits: 0 }) : current.toFixed(numPart % 1 !== 0 ? 1 : 0)) + suffix);
      if (step >= steps) clearInterval(t);
    }, 1200 / steps);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'center', padding: '24px 32px', fontFamily: 'inherit' }}>
      {icon && <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 48, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-0.03em' }}>{display}</div>
      <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}`,

"/components/sections/ImageCard.tsx": `import React from 'react';
export default function ImageCard({ image, category, title, excerpt, cta, href, date }: { image: string; category?: string; title: string; excerpt?: string; cta?: string; href?: string; date?: string }) {
  return (
    <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, overflow: 'hidden', fontFamily: 'inherit' }}>
      <div style={{ width: '100%', paddingBottom: '56.25%', position: 'relative', overflow: 'hidden' }}>
        <img src={image} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />
        {category && <span style={{ position: 'absolute', top: 12, left: 12, background: 'hsl(var(--primary))', color: '#fff', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</span>}
      </div>
      <div style={{ padding: 20 }}>
        {date && <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>{date}</div>}
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'hsl(var(--foreground))' }}>{title}</div>
        {excerpt && <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, margin: '0 0 16px' }}>{excerpt}</p>}
        {cta && <a href={href || '#'} style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--primary))', textDecoration: 'none' }}>{cta} →</a>}
      </div>
    </div>
  );
}`,

"/components/sections/ProfileCard.tsx": `import React from 'react';
export default function ProfileCard({ name, role, image, bio, twitter, linkedin, instagram, accentColor }: { name: string; role: string; image?: string; bio?: string; twitter?: string; linkedin?: string; instagram?: string; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, padding: 28, textAlign: 'center', fontFamily: 'inherit' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: \`3px solid \${accent}\` }}>
        {image ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} /> : <div style={{ width: '100%', height: '100%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>{initials}</div>}
      </div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
      <div style={{ color: accent, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{role}</div>
      {bio && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, margin: '12px 0' }}>{bio}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
        {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, textDecoration: 'none' }}>𝕏</a>}
        {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, textDecoration: 'none' }}>in</a>}
        {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, textDecoration: 'none' }}>📷</a>}
      </div>
    </div>
  );
}`,

"/components/sections/AlertBanner.tsx": `import React, { useState } from 'react';
export default function AlertBanner({ type, message, dismissible, accentColor }: { type: 'info'|'success'|'warning'|'error'; message: string; dismissible?: boolean; accentColor?: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const configs = { info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: 'ℹ️' }, success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', icon: '✅' }, warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', icon: '⚠️' }, error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '❌' } };
  const c = configs[type];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: accentColor ? accentColor + '18' : c.bg, border: \`1px solid \${accentColor ? accentColor + '44' : c.border}\`, color: accentColor || c.color, fontFamily: 'inherit', fontSize: 14 }}>
      <span>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {dismissible && <button type="button" aria-label="Dismiss alert" onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', padding: 0, lineHeight: 1 }}>✕</button>}
    </div>
  );
}`,

"/components/sections/ProgressBar.tsx": `import React, { useEffect, useState } from 'react';
export default function ProgressBar({ label, value, max, showPercent, accentColor }: { label?: string; value: number; max?: number; showPercent?: boolean; accentColor?: string }) {
  const maxVal = max ?? 100;
  const pct = Math.min(100, Math.max(0, (value / maxVal) * 100));
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 80); return () => clearTimeout(t); }, [pct]);
  const color = accentColor || (pct < 30 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e');
  return (
    <div style={{ fontFamily: 'inherit' }}>
      {(label || showPercent) && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
        {label && <span>{label}</span>}
        {showPercent && <span style={{ color }}>{Math.round(pct)}%</span>}
      </div>}
      <div style={{ height: 10, borderRadius: 999, background: 'hsl(var(--muted))', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: color, width: \`\${width}%\`, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}`,

"/components/sections/CountdownTimer.tsx": `import React, { useEffect, useState } from 'react';
export default function CountdownTimer({ targetDate, title, subtitle, cta, ctaHref, accentColor }: { targetDate: string; title?: string; subtitle?: string; cta?: string; ctaHref?: string; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const calc = () => { const d = new Date(targetDate).getTime() - Date.now(); if (d <= 0) return { days:0, hours:0, minutes:0, seconds:0 }; return { days: Math.floor(d/86400000), hours: Math.floor(d/3600000)%24, minutes: Math.floor(d/60000)%60, seconds: Math.floor(d/1000)%60 }; };
  const [t, setT] = useState(calc());
  useEffect(() => { const i = setInterval(() => setT(calc()), 1000); return () => clearInterval(i); }, []);
  const Box = ({ n, l }: { n: number; l: string }) => (
    <div style={{ textAlign: 'center', minWidth: 70 }}>
      <div style={{ background: accent, color: '#fff', borderRadius: 12, padding: '12px 8px', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{String(n).padStart(2,'0')}</div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6, color: 'hsl(var(--muted-foreground))' }}>{l}</div>
    </div>
  );
  return (
    <div style={{ textAlign: 'center', fontFamily: 'inherit', padding: '32px 0' }}>
      {title && <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{title}</h2>}
      {subtitle && <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 24 }}>{subtitle}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Box n={t.days} l="Days" /><Box n={t.hours} l="Hours" /><Box n={t.minutes} l="Minutes" /><Box n={t.seconds} l="Seconds" />
      </div>
      {cta && <a href={ctaHref || '#'} style={{ display: 'inline-block', marginTop: 28, padding: '12px 28px', borderRadius: 999, background: accent, color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>{cta}</a>}
    </div>
  );
}`,

"/components/sections/VideoEmbed.tsx": `import React, { useState } from 'react';
export default function VideoEmbed({ url, thumbnail, title, aspectRatio, accentColor }: { url: string; thumbnail?: string; title?: string; aspectRatio?: '16/9'|'4/3'|'1/1'; autoplay?: boolean; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const [playing, setPlaying] = useState(false);
  const pad = aspectRatio === '4/3' ? '75%' : aspectRatio === '1/1' ? '100%' : '56.25%';
  const getEmbed = () => {
    const ytMatch = url.match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([^&\\s]+)/);
    const vmMatch = url.match(/vimeo\\.com\\/(\\d+)/);
    if (ytMatch) return \`https://www.youtube.com/embed/\${ytMatch[1]}?autoplay=1\`;
    if (vmMatch) return \`https://player.vimeo.com/video/\${vmMatch[1]}?autoplay=1\`;
    return url;
  };
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', paddingBottom: pad, background: '#000', fontFamily: 'inherit' }}>
      {playing ? (
        <iframe src={getEmbed()} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen title={title} />
      ) : (
        <button type="button" aria-label="Play video" style={{ position: 'absolute', inset: 0, cursor: 'pointer', background: 'none', border: 'none', padding: 0, width: '100%', height: '100%' }} onClick={() => setPlaying(true)}>
          {thumbnail && <img src={thumbnail} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: '22px solid #fff', marginLeft: 4 }} />
            </div>
          </div>
          {title && <div style={{ position: 'absolute', bottom: 16, left: 16, color: '#fff', fontWeight: 600, fontSize: 15, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{title}</div>}
        </div>
      )}
    </div>
  );
}`,

"/components/sections/MapEmbed.tsx": `import React from 'react';
export default function MapEmbed({ address, lat, lng, title, accentColor }: { address: string; lat?: number; lng?: number; title?: string; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const mapsUrl = lat && lng ? \`https://www.google.com/maps?q=\${lat},\${lng}\` : \`https://www.google.com/maps/search/\${encodeURIComponent(address)}\`;
  return (
    <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, overflow: 'hidden', fontFamily: 'inherit' }}>
      <div style={{ height: 160, background: 'linear-gradient(135deg, #e8f4f8 0%, #d1e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ fontSize: 48 }}>📍</div>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(0,0,0,0.04) 30px, rgba(0,0,0,0.04) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.04) 30px, rgba(0,0,0,0.04) 31px)' }} />
      </div>
      <div style={{ padding: 20 }}>
        {title && <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{title}</div>}
        <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>{address}</div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: accent, color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Open in Maps</a>
      </div>
    </div>
  );
}`,

"/components/sections/SocialLinks.tsx": `import React from 'react';
const ICONS: Record<string, string> = { facebook:'f', instagram:'ig', twitter:'X', tiktok:'tt', youtube:'yt', linkedin:'in', pinterest:'p', snapchat:'sc' };
export default function SocialLinks({ items, size, accentColor }: { items: { platform: 'facebook'|'instagram'|'twitter'|'tiktok'|'youtube'|'linkedin'|'pinterest'|'snapchat'; url: string }[]; size?: 'sm'|'md'|'lg'; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const dim = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const fs = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontFamily: 'inherit' }}>
      {(items || []).map((item, i) => (
        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ width: dim, height: dim, borderRadius: '50%', border: \`2px solid \${accent}\`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, color: accent, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent', fontWeight: 700, textTransform: 'uppercase' as const }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = accent; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = accent; }}>
          {ICONS[item.platform] || item.platform[0].toUpperCase()}
        </a>
      ))}
    </div>
  );
}`,

"/components/sections/NewsletterInline.tsx": `import React, { useState, useEffect } from 'react';
export default function NewsletterInline({ placeholder, cta, title, onSubmit, accentColor }: { placeholder?: string; cta?: string; title?: string; onSubmit?: (email: string) => void; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handle = (e: React.FormEvent) => { e.preventDefault(); if (!email) return; onSubmit?.(email); setSubmitted(true); };
  return (
    <div style={{ fontFamily: 'inherit' }}>
      {title && <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{title}</div>}
      {submitted ? (
        <div style={{ padding: '12px 20px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 14, fontWeight: 600 }}>You're subscribed!</div>
      ) : (
        <form onSubmit={handle} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={placeholder || 'Enter your email'} required style={{ flex: 1, minWidth: 180, height: 42, borderRadius: 8, border: '1px solid hsl(var(--border))', padding: '0 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'hsl(var(--background))' }} />
          <button type="submit" style={{ height: 42, padding: '0 20px', borderRadius: 8, background: accent, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>{cta || 'Subscribe'}</button>
        </form>
      )}
    </div>
  );
}`,

"/components/sections/RatingStars.tsx": `import React, { useState } from 'react';
export default function RatingStars({ value, max, interactive, onChange, size, color }: { value: number; max?: number; interactive?: boolean; onChange?: (v: number) => void; size?: number; color?: string }) {
  const total = max ?? 5;
  const starColor = color || '#f59e0b';
  const [hover, setHover] = useState(0);
  const [current, setCurrent] = useState(value);
  const display = hover || current;
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} onClick={() => { if (interactive) { setCurrent(i+1); onChange?.(i+1); } }}
          onMouseEnter={() => { if (interactive) setHover(i+1); }}
          onMouseLeave={() => { if (interactive) setHover(0); }}
          style={{ fontSize: size || 20, cursor: interactive ? 'pointer' : 'default', color: i < display ? starColor : 'hsl(var(--muted))', transition: 'color 0.15s', lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}`,

"/components/sections/Breadcrumbs.tsx": `import React from 'react';
export default function Breadcrumbs({ items, accentColor }: { items: { label: string; href?: string }[]; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const safeItems = (items || []).filter(Boolean);
  return (
    <nav aria-label="breadcrumb" style={{ fontFamily: 'inherit' }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0, fontSize: 14 }}>
        {safeItems.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'hsl(var(--muted-foreground))' }}>/</span>}
            {item.href && i < safeItems.length - 1
              ? <a href={item.href} style={{ color: accent, textDecoration: 'none', fontWeight: 500 }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}>{item.label}</a>
              : <span style={{ color: i === safeItems.length - 1 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontWeight: i === safeItems.length - 1 ? 600 : 400 }}>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}`,

"/components/sections/TabsInline.tsx": `import React, { useState } from 'react';
export default function TabsInline({ tabs, defaultTab, accentColor }: { tabs: { label: string; content: React.ReactNode }[]; defaultTab?: number; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const safeTabs = (tabs || []).filter(Boolean);
  const [active, setActive] = useState(defaultTab ?? 0);
  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 4, background: 'hsl(var(--muted))', borderRadius: 12, marginBottom: 20, width: 'fit-content' }}>
        {safeTabs.map((tab, i) => (
          <button type="button" role="tab" aria-selected={active === i} key={i} onClick={() => setActive(i)} style={{ padding: '7px 18px', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: active === i ? accent : 'transparent', color: active === i ? '#fff' : 'hsl(var(--muted-foreground))' }}>{tab.label}</button>
        ))}
      </div>
      <div>{safeTabs[active]?.content}</div>
    </div>
  );
}`,

"/components/sections/AccordionItem.tsx": `import React, { useState } from 'react';
export default function AccordionItem({ title, children, defaultOpen, accentColor }: { title: string; children: React.ReactNode; defaultOpen?: boolean; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 12, overflow: 'hidden', fontFamily: 'inherit', marginBottom: 8 }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: open ? accent + '18' : 'hsl(var(--card))', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: open ? accent : 'hsl(var(--foreground))', textAlign: 'left' as const, transition: 'background 0.2s' }}>
        <span>{title}</span>
        <span style={{ fontSize: 18, transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none', color: accent, display: 'inline-block' }}>v</span>
      </button>
      {open && <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'hsl(var(--muted-foreground))', lineHeight: 1.7, background: 'hsl(var(--card))' }}>{children}</div>}
    </div>
  );
}`,

"/components/sections/ImageGalleryGrid.tsx": `import React, { useState, useEffect } from 'react';
export default function ImageGalleryGrid({ images, columns }: { images: { url: string; caption?: string }[]; columns?: 2|3|4; accentColor?: string }) {
  const safeImages = (images || []).filter(Boolean);
  const [lightbox, setLightbox] = useState<number|null>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox(l => l !== null && l < safeImages.length - 1 ? l + 1 : l);
      if (e.key === 'ArrowLeft') setLightbox(l => l !== null && l > 0 ? l - 1 : l);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [safeImages.length]);
  const cols = columns || 3;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${cols}, 1fr)\`, gap: 8 }}>
        {safeImages.map((img, i) => (
          <div key={i} onClick={() => setLightbox(i)} style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1/1', position: 'relative', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
            <img src={img.url} alt={img.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} />
          </div>
        ))}
      </div>
      {lightbox !== null && (
        <div role="dialog" aria-modal="true" aria-label="Image lightbox" onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <img src={safeImages[lightbox].url} alt={safeImages[lightbox].caption || ''} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} onClick={e => e.stopPropagation()} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; }} />
          {safeImages[lightbox].caption && <p style={{ color: '#fff', marginTop: 14, fontSize: 14, opacity: 0.8 }}>{safeImages[lightbox].caption}</p>}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }} onClick={e => e.stopPropagation()}>
            <button type="button" aria-label="Previous image" onClick={() => setLightbox(l => l !== null && l > 0 ? l - 1 : l)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 18 }}>{'<'}</button>
            <span style={{ color: '#fff', fontSize: 13, alignSelf: 'center' }}>{lightbox + 1} / {safeImages.length}</span>
            <button onClick={() => setLightbox(l => l !== null && l < safeImages.length - 1 ? l + 1 : l)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 18 }}>{'>'}</button>
          </div>
          <button type="button" aria-label="Close lightbox" onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}
    </>
  );
}`,

"/components/sections/CallToActionBanner.tsx": `import React from 'react';
export default function CallToActionBanner({ title, subtitle, cta1, cta1Href, cta2, cta2Href, dark, accentColor }: { title: string; subtitle?: string; cta1: string; cta1Href?: string; cta2?: string; cta2Href?: string; dark?: boolean; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const bg = dark ? '#111' : accent;
  return (
    <div style={{ background: bg, borderRadius: 16, padding: '32px 36px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, fontFamily: 'inherit' }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 6 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a href={cta1Href || '#'} style={{ padding: '11px 24px', borderRadius: 10, background: '#fff', color: dark ? '#111' : accent, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'opacity 0.2s', display: 'inline-block' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>{cta1}</a>
        {cta2 && <a href={cta2Href || '#'} style={{ padding: '11px 24px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.5)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block', transition: 'border-color 0.2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#fff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.5)'}>{cta2}</a>}
      </div>
    </div>
  );
}`,

"/components/sections/EmptyState.tsx": `import React from 'react';
export default function EmptyState({ icon, title, desc, cta, onAction, accentColor }: { icon?: string; title: string; desc?: string; cta?: string; onAction?: () => void; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'inherit' }}>
      {icon && <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.5 }}>{icon}</div>}
      <div style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 8 }}>{title}</div>
      {desc && <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: '0 auto 24px', maxWidth: 360, lineHeight: 1.6 }}>{desc}</p>}
      {cta && <button type="button" onClick={onAction} style={{ padding: '10px 24px', borderRadius: 10, background: accent, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{cta}</button>}
    </div>
  );
}`,



"/components/sections/Router.tsx": `
import React from 'react';

interface Page { path: string; label: string; component: React.ReactNode; }
interface RouterProps { pages: Page[]; defaultPath?: string; }

export default function Router({ pages, defaultPath }: RouterProps) {
  const [current, setCurrent] = React.useState(() => {
    const hash = window.location.hash.replace('#', '') || defaultPath || pages[0]?.path || '/';
    return hash;
  });

  React.useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace('#', '') || defaultPath || pages[0]?.path || '/';
      setCurrent(hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const activePage = pages.find(p => p.path === current) || pages[0];
  return <>{activePage?.component}</>;
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function Link({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return <a href={\`#\${to}\`} className={className}>{children}</a>;
}
`,

"/components/sections/MetaTags.tsx": `
import React from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export default function MetaTags({ title, description, keywords }: MetaTagsProps) {
  React.useEffect(() => {
    if (title) document.title = title;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(\`meta[name="\${name}"]\`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
  }, [title, description, keywords]);
  return null;
}
`,


"/components/sections/DashboardStats.tsx": `import { useState, useEffect } from 'react';
interface StatItem { label: string; value: string; change: string; positive: boolean; icon: string; }
interface Props { items?: StatItem[]; accentColor?: string; }
const DEFAULT_STATS: StatItem[] = [
  { label: 'Total Revenue', value: '$84,320', change: '+12.5%', positive: true, icon: '💰' },
  { label: 'Active Users', value: '3,842', change: '+8.1%', positive: true, icon: '👥' },
  { label: 'Churn Rate', value: '2.4%', change: '+0.3%', positive: false, icon: '📉' },
  { label: 'Avg Order', value: '$124', change: '-3.2%', positive: false, icon: '🛒' },
];
export default function DashboardStats({ items = DEFAULT_STATS, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, padding: '24px 0' }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, padding: '24px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default', transform: mounted ? 'translateY(0)' : 'translateY(12px)', opacity: mounted ? 1 : 0, transitionDelay: i * 80 + 'ms' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{item.icon}</div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 50, background: item.positive ? '#dcfce7' : '#fee2e2', color: item.positive ? '#16a34a' : '#dc2626' }}>{item.change}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg, #111)', marginBottom: 4 }}>{item.value}</div>
          <div style={{ fontSize: 13, color: 'var(--muted, #888)' }}>{item.label}</div>
          <div style={{ marginTop: 16, height: 4, borderRadius: 99, background: 'var(--border, #e5e7eb)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: item.positive ? accent : '#f87171', width: mounted ? (40 + i * 15) + '%' : '0%', transition: 'width 1s ease', transitionDelay: (i * 120 + 300) + 'ms' }} />
          </div>
        </div>
      ))}
    </div>
  );
}`,

"/components/sections/DataTable.tsx": `import { useState, useMemo } from 'react';
interface Column { key: string; label: string; sortable?: boolean; }
interface Props { columns?: Column[]; rows?: Record<string,any>[]; onEdit?: (row: Record<string,any>) => void; onDelete?: (row: Record<string,any>) => void; title?: string; accentColor?: string; }
const DEFAULT_COLS: Column[] = [{ key:'name',label:'Name',sortable:true },{ key:'email',label:'Email',sortable:true },{ key:'role',label:'Role',sortable:true },{ key:'status',label:'Status' }];
const DEFAULT_ROWS = [
  { name:'Alice Chen', email:'alice@example.com', role:'Admin', status:'Active' },
  { name:'Bob Smith', email:'bob@example.com', role:'Editor', status:'Active' },
  { name:'Carol Wu', email:'carol@example.com', role:'Viewer', status:'Inactive' },
  { name:'David Lee', email:'david@example.com', role:'Editor', status:'Active' },
  { name:'Eva Moore', email:'eva@example.com', role:'Viewer', status:'Active' },
  { name:'Frank Hall', email:'frank@example.com', role:'Viewer', status:'Inactive' },
  { name:'Grace Kim', email:'grace@example.com', role:'Editor', status:'Active' },
  { name:'Henry Park', email:'henry@example.com', role:'Viewer', status:'Active' },
  { name:'Iris Tang', email:'iris@example.com', role:'Editor', status:'Inactive' },
  { name:'James Wu', email:'james@example.com', role:'Admin', status:'Active' },
  { name:'Karen Liu', email:'karen@example.com', role:'Viewer', status:'Active' },
  { name:'Leo Chen', email:'leo@example.com', role:'Editor', status:'Active' },
];
export default function DataTable({ columns = DEFAULT_COLS, rows = DEFAULT_ROWS, onEdit, onDelete, title = 'Data Table', accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 10;
  const filtered = useMemo(() => rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))), [rows, search]);
  const sorted = useMemo(() => { if (!sortKey) return filtered; return [...filtered].sort((a, b) => { const v = String(a[sortKey]).localeCompare(String(b[sortKey])); return sortDir === 'asc' ? v : -v; }); }, [filtered, sortKey, sortDir]);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const handleSort = (key: string) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc'); } };
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search..." style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)', fontSize: 13, outline: 'none', width: 220 }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--bg, #f9fafb)' }}>
            {columns.map(col => <th key={col.key} onClick={() => col.sortable && handleSort(col.key)} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted, #666)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>{col.label}{col.sortable && sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>)}
            {(onEdit || onDelete) && <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--muted, #666)', fontSize: 12, textTransform: 'uppercase' }}>Actions</th>}
          </tr></thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border, #e5e7eb)' }}
                onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f9fafb)'}
                onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                {columns.map(col => <td key={col.key} style={{ padding: '12px 16px', color: 'var(--fg, #111)' }}>{col.key === 'status' ? <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: row[col.key] === 'Active' ? '#dcfce7' : '#f3f4f6', color: row[col.key] === 'Active' ? '#16a34a' : '#888' }}>{row[col.key]}</span> : String(row[col.key] ?? '')}</td>)}
                {(onEdit || onDelete) && <td style={{ padding: '12px 16px', textAlign: 'right' }}><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{onEdit && <button onClick={() => onEdit(row)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid ' + accent, background: 'transparent', color: accent, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>}{onDelete && <button onClick={() => onDelete(row)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>}</div></td>}
              </tr>
            ))}
            {paged.length === 0 && <tr><td colSpan={columns.length + 1} style={{ padding: 32, textAlign: 'center', color: 'var(--muted, #888)' }}>No results found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border, #e5e7eb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--muted, #888)' }}>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: 13 }}>Prev</button>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: 13 }}>Next</button>
        </div>
      </div>
    </div>
  );
}`,

"/components/sections/ActivityFeed.tsx": `import { useState } from 'react';
interface FeedItem { icon: string; title: string; desc?: string; time: string; user: string; color?: string; }
interface Props { title?: string; items?: FeedItem[]; accentColor?: string; }
const DEFAULT_FEED: FeedItem[] = [
  { icon:'✅', title:'Order #1042 completed', desc:'Payment received and confirmed', time:'2 min ago', user:'Alice Chen', color:'#22c55e' },
  { icon:'👤', title:'New user registered', desc:'bob@example.com joined', time:'18 min ago', user:'System', color:'#6366f1' },
  { icon:'🚀', title:'Feature deployed', desc:'v2.4.1 pushed to production', time:'1h ago', user:'Dev Team', color:'#f59e0b' },
  { icon:'⚠️', title:'High traffic alert', desc:'API usage spiked to 94%', time:'2h ago', user:'Monitor', color:'#ef4444' },
  { icon:'💬', title:'New support ticket', desc:'Ticket #887 needs attention', time:'3h ago', user:'Carol Wu', color:'#06b6d4' },
  { icon:'💳', title:'Subscription renewed', desc:'Pro plan', time:'5h ago', user:'David Lee', color:'#8b5cf6' },
];
function initials(name: string) { return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2); }
export default function ActivityFeed({ title = 'Recent Activity', items = DEFAULT_FEED, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [visible, setVisible] = useState(5);
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.slice(0, visible).map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < visible - 1 ? 20 : 0, marginBottom: i < visible - 1 ? 20 : 0, borderBottom: i < visible - 1 ? '1px solid var(--border, #f0f0f0)' : 'none' }}>
            <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: (item.color || accent) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg, #111)' }}>{item.title}</span>
                <span style={{ fontSize: 11, color: 'var(--muted, #aaa)', whiteSpace: 'nowrap' }}>{item.time}</span>
              </div>
              {item.desc && <div style={{ fontSize: 12, color: 'var(--muted, #888)', marginTop: 2 }}>{item.desc}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: accent, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(item.user)}</div>
                <span style={{ fontSize: 11, color: 'var(--muted, #999)' }}>{item.user}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {visible < items.length && <button onClick={() => setVisible(v => v + 5)} style={{ marginTop: 20, width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: accent }}>Load more</button>}
    </div>
  );
}`,

"/components/sections/RevenueChart.tsx": `import { useState, useEffect } from 'react';
interface DataPoint { month: string; value: number; }
interface Props { title?: string; data?: DataPoint[]; accentColor?: string; currency?: string; }
const DEFAULT_CHART: DataPoint[] = [{ month:'Jan', value:42000 },{ month:'Feb', value:38000 },{ month:'Mar', value:55000 },{ month:'Apr', value:61000 },{ month:'May', value:58000 },{ month:'Jun', value:74000 },{ month:'Jul', value:82000 },{ month:'Aug', value:79000 },{ month:'Sep', value:91000 },{ month:'Oct', value:88000 },{ month:'Nov', value:97000 },{ month:'Dec', value:112000 }];
export default function RevenueChart({ title = 'Monthly Revenue', data = DEFAULT_CHART, accentColor, currency = '$' }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<number | null>(null);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);
  const max = Math.max(...data.map(d => d.value));
  const fmt = (v: number) => v >= 1000 ? currency + (v/1000).toFixed(0) + 'k' : currency + v;
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
        <span style={{ fontSize: 22, fontWeight: 800, color: accent }}>{fmt(data[data.length - 1]?.value ?? 0)}</span>
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, paddingBottom: 24 }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 136;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}
              onMouseEnter={() => setTooltip(i)} onMouseLeave={() => setTooltip(null)}>
              <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: tooltip === i ? accent : accent + 'bb', transition: 'height 0.7s cubic-bezier(.4,0,.2,1), background 0.15s', transitionDelay: i * 40 + 'ms', height: mounted ? h : 0 }} />
              <span style={{ position: 'absolute', bottom: 0, fontSize: 9, color: 'var(--muted, #999)', whiteSpace: 'nowrap' }}>{d.month}</span>
              {tooltip === i && <div style={{ position: 'absolute', bottom: '105%', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>{fmt(d.value)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}`,

"/components/sections/AdminSidebar.tsx": `import { useState } from 'react';
interface NavChild { label: string; href: string; }
interface NavItem { label: string; icon: string; href?: string; active?: boolean; badge?: number; children?: NavChild[]; }
interface Props { brand: string; items?: NavItem[]; onNavigate?: (href: string) => void; accentColor?: string; }
const DEFAULT_NAV: NavItem[] = [
  { label:'Dashboard', icon:'🏠', href:'#', active:true },
  { label:'Analytics', icon:'📊', href:'#' },
  { label:'Users', icon:'👥', href:'#', badge:3 },
  { label:'Orders', icon:'📦', href:'#' },
  { label:'Products', icon:'🛒', href:'#', children:[{ label:'All Products', href:'#' },{ label:'Add Product', href:'#' }] },
  { label:'Settings', icon:'⚙️', href:'#' },
];
export default function AdminSidebar({ brand, items = DEFAULT_NAV, onNavigate, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [activeItem, setActiveItem] = useState(() => items.findIndex(i => i.active));
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setCollapsed(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  return (
    <div style={{ width: 220, background: 'var(--card, #fff)', borderRight: '1px solid var(--border, #e5e7eb)', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 480 }}>
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: accent }}>{brand}</div>
        <div style={{ fontSize: 11, color: 'var(--muted, #999)', marginTop: 2 }}>Admin Dashboard</div>
      </div>
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {items.map((item, i) => (
          <div key={i}>
            <div onClick={() => item.children ? toggle(i) : (setActiveItem(i), onNavigate?.(item.href || '#'))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: activeItem === i ? accent + '15' : 'transparent', color: activeItem === i ? accent : 'var(--fg, #333)', fontWeight: activeItem === i ? 700 : 500, fontSize: 13, userSelect: 'none' }}
              onMouseOver={e => { if (activeItem !== i) (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f5f5f5)'; }}
              onMouseOut={e => { if (activeItem !== i) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? <span style={{ background: accent, color: '#fff', borderRadius: 50, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>{item.badge}</span> : null}
              {item.children ? <span style={{ fontSize: 10 }}>{collapsed.has(i) ? '▶' : '▼'}</span> : null}
            </div>
            {item.children && !collapsed.has(i) && (
              <div style={{ paddingLeft: 20, marginBottom: 4 }}>
                {item.children.map((child, j) => (
                  <div key={j} onClick={() => onNavigate?.(child.href)} style={{ padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--muted, #777)' }}
                    onMouseOver={e => (e.currentTarget as HTMLElement).style.color = accent}
                    onMouseOut={e => (e.currentTarget as HTMLElement).style.color = 'var(--muted, #777)'}>{child.label}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600 }}
          onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#fee2e2'}
          onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <span>🚪</span> Logout
        </div>
      </div>
    </div>
  );
}`,

"/components/sections/KanbanBoard.tsx": `import { useState } from 'react';
interface KCol { id: string; title: string; color: string; }
interface KCard { id: string; col: string; title: string; assignee: string; priority: 'high'|'medium'|'low'; due?: string; desc?: string; }
interface Props { columns?: KCol[]; cards?: KCard[]; accentColor?: string; }
const DEFAULT_KANBAN_COLS: KCol[] = [{ id:'todo', title:'To Do', color:'#6366f1' },{ id:'inprogress', title:'In Progress', color:'#f59e0b' },{ id:'review', title:'Review', color:'#06b6d4' },{ id:'done', title:'Done', color:'#22c55e' }];
const DK: KCard[] = [
  { id:'1', col:'todo', title:'Design new landing page', assignee:'Alice', priority:'high', due:'Jun 30' },
  { id:'2', col:'todo', title:'Fix mobile navigation', assignee:'Bob', priority:'medium' },
  { id:'3', col:'inprogress', title:'Integrate payment API', assignee:'Carol', priority:'high', due:'Jun 28', desc:'Set up Stripe webhooks and test checkout flow.' },
  { id:'4', col:'inprogress', title:'Write API docs', assignee:'David', priority:'low' },
  { id:'5', col:'review', title:'User auth refactor', assignee:'Alice', priority:'high', desc:'JWT refresh token implementation.' },
  { id:'6', col:'done', title:'Set up CI/CD pipeline', assignee:'Bob', priority:'medium' },
];
const PC: Record<string,string> = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' };
export default function KanbanBoard({ columns = DEFAULT_KANBAN_COLS, cards = DK, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [modal, setModal] = useState<KCard | null>(null);
  return (
    <div style={{ padding: '24px 0', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + columns.length + ', minmax(220px, 1fr))', gap: 16, overflowX: 'auto' }}>
        {columns.map(col => {
          const cc = cards.filter(c => c.col === col.id);
          return (
            <div key={col.id} style={{ background: 'var(--bg, #f9fafb)', borderRadius: 14, padding: 16, minHeight: 360 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{col.title}</span>
                </div>
                <span style={{ background: col.color + '22', color: col.color, fontWeight: 700, fontSize: 11, borderRadius: 50, padding: '2px 8px' }}>{cc.length}</span>
              </div>
              {cc.map(card => (
                <div key={card.id} onClick={() => setModal(card)} style={{ background: 'var(--card, #fff)', borderRadius: 10, padding: 14, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'grab', border: '1px solid var(--border, #eee)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{card.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: accent, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.assignee.slice(0,2).toUpperCase()}</div>
                      <span style={{ fontSize: 11, color: 'var(--muted, #888)' }}>{card.due || ''}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: PC[card.priority] + '22', color: PC[card.priority] }}>{card.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card, #fff)', borderRadius: 16, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{modal.title}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted, #999)' }}>x</button>
            </div>
            {modal.desc && <p style={{ margin: '0 0 16px', color: 'var(--muted, #666)', fontSize: 14 }}>{modal.desc}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 50, background: PC[modal.priority] + '20', color: PC[modal.priority], fontWeight: 700 }}>{modal.priority} priority</span>
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 50, background: 'var(--bg, #f3f4f6)', color: 'var(--muted, #666)', fontWeight: 600 }}>Assignee: {modal.assignee}</span>
              {modal.due ? <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 50, background: 'var(--bg, #f3f4f6)', color: 'var(--muted, #666)', fontWeight: 600 }}>Due: {modal.due}</span> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`,

"/components/sections/UserManagement.tsx": `import { useState } from 'react';
interface User { name: string; email: string; role: string; active: boolean; lastSeen?: string; }
interface Props { users?: User[]; accentColor?: string; }
const DEFAULT_USERS: User[] = [
  { name:'Alice Chen', email:'alice@example.com', role:'Admin', active:true, lastSeen:'Just now' },
  { name:'Bob Smith', email:'bob@example.com', role:'Editor', active:true, lastSeen:'5 min ago' },
  { name:'Carol Wu', email:'carol@example.com', role:'Viewer', active:false, lastSeen:'2 days ago' },
  { name:'David Lee', email:'david@example.com', role:'Editor', active:true },
  { name:'Eva Moore', email:'eva@example.com', role:'Viewer', active:true },
];
const ROLES = ['All', 'Admin', 'Editor', 'Viewer'];
const RC: Record<string,string> = { Admin:'#6366f1', Editor:'#f59e0b', Viewer:'#22c55e' };
function ini(n: string) { return n.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2); }
export default function UserManagement({ users: init = DEFAULT_USERS, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [users, setUsers] = useState(init);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [nu, setNu] = useState({ name:'', email:'', role:'Viewer' });
  const filtered = users.filter(u => (roleFilter === 'All' || u.role === roleFilter) && (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())));
  const toggle = (idx: number) => setUsers(list => list.map((u, i) => i === idx ? { ...u, active: !u.active } : u));
  const add = () => { if (!nu.name || !nu.email) return; setUsers(u => [...u, { ...nu, active:true }]); setNu({ name:'', email:'', role:'Viewer' }); setShowAdd(false); };
  const inp = { padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border, #e5e7eb)', fontSize: 13, outline: 'none' } as const;
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, flex: 1 }}>Users</h3>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inp, width: 180 }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inp, background: 'var(--card, #fff)', cursor: 'pointer' }}>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 16px', borderRadius: 8, background: accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>+ Add User</button>
      </div>
      {showAdd && (
        <div style={{ padding: '16px 24px', background: 'var(--bg, #f9fafb)', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input value={nu.name} onChange={e => setNu(u => ({ ...u, name: e.target.value }))} placeholder="Full name" style={{ ...inp, width: 150 }} />
          <input value={nu.email} onChange={e => setNu(u => ({ ...u, email: e.target.value }))} placeholder="Email" style={{ ...inp, width: 180 }} />
          <select value={nu.role} onChange={e => setNu(u => ({ ...u, role: e.target.value }))} style={{ ...inp, background: 'var(--card, #fff)', cursor: 'pointer' }}>{['Admin','Editor','Viewer'].map(r => <option key={r}>{r}</option>)}</select>
          <button onClick={add} style={{ padding: '8px 16px', borderRadius: 8, background: accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Add</button>
          <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: 'var(--muted, #888)', border: '1px solid var(--border, #e5e7eb)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      )}
      <div>
        {filtered.map((u, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border, #f0f0f0)' : 'none' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f9fafb)'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: accent, color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ini(u.name)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div><div style={{ fontSize: 12, color: 'var(--muted, #888)' }}>{u.email}</div></div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: (RC[u.role] || '#888') + '22', color: RC[u.role] || '#888', flexShrink: 0 }}>{u.role}</span>
            <div onClick={() => toggle(users.indexOf(u))} style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 50, background: u.active ? accent : '#e5e7eb', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: u.active ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted, #aaa)' }}>No users found.</div>}
      </div>
    </div>
  );
}`,

"/components/sections/NotificationCenter.tsx": `import { useState } from 'react';
interface Notif { icon: string; title: string; message: string; time: string; read?: boolean; type?: string; }
interface Props { items?: Notif[]; accentColor?: string; }
const DEFAULT_NOTIFS: Notif[] = [
  { icon:'✅', title:'Payment received', message:'Order #1042 confirmed', time:'2m ago', read:false, type:'success' },
  { icon:'⚠️', title:'Low disk space', message:'Server storage at 87%', time:'15m ago', read:false, type:'warning' },
  { icon:'👤', title:'New user signup', message:'bob@example.com registered', time:'1h ago', read:false, type:'info' },
  { icon:'❌', title:'Deploy failed', message:'Build #94 failed', time:'2h ago', read:true, type:'error' },
  { icon:'📊', title:'Weekly report', message:'Analytics digest available', time:'1d ago', read:true, type:'info' },
];
const TC: Record<string,string> = { info:'#6366f1', success:'#22c55e', warning:'#f59e0b', error:'#ef4444' };
export default function NotificationCenter({ items: init = DEFAULT_NOTIFS, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(init);
  const unread = items.filter(n => !n.read).length;
  const markAll = () => setItems(l => l.map(n => ({ ...n, read: true })));
  const markOne = (i: number) => setItems(l => l.map((n, idx) => idx === i ? { ...n, read: true } : n));
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} style={{ position: 'relative', width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border, #e5e7eb)', background: 'var(--card, #fff)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        🔔
        {unread > 0 ? <span style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span> : null}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{ position: 'absolute', right: 0, top: 52, width: 340, background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications {unread > 0 ? <span style={{ background: accent, color: '#fff', borderRadius: 50, fontSize: 11, padding: '1px 7px', marginLeft: 6 }}>{unread}</span> : null}</span>
              {unread > 0 ? <button onClick={markAll} style={{ fontSize: 12, color: accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button> : null}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {items.map((n, i) => (
                <div key={i} onClick={() => markOne(i)} style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border, #f0f0f0)', cursor: 'pointer', background: n.read ? 'transparent' : accent + '08' }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f9fafb)'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : accent + '08'}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: (TC[n.type||'info']||accent) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 13 }}>{n.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted, #aaa)', whiteSpace: 'nowrap' }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted, #888)', marginTop: 2 }}>{n.message}</div>
                  </div>
                  {!n.read ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 6 }} /> : null}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}`,

"/components/sections/AnalyticsPanel.tsx": `interface StatBlock { label: string; value: string; delta?: string; }
interface ChartPoint { label: string; value: number; }
interface TableRow { name: string; value: number; max: number; }
interface Props { title?: string; stats?: StatBlock[]; chartData?: ChartPoint[]; tableData?: TableRow[]; accentColor?: string; }
const DS: StatBlock[] = [{ label:'Page Views', value:'124,831', delta:'+18%' },{ label:'Sessions', value:'41,290', delta:'+9%' },{ label:'Bounce Rate', value:'38.4%', delta:'-2%' }];
const DEFAULT_ANALYTICS_CHART: ChartPoint[] = [{ label:'Mon', value:320 },{ label:'Tue', value:480 },{ label:'Wed', value:410 },{ label:'Thu', value:560 },{ label:'Fri', value:720 },{ label:'Sat', value:390 },{ label:'Sun', value:280 }];
const DT: TableRow[] = [{ name:'/home', value:42000, max:60000 },{ name:'/products', value:31000, max:60000 },{ name:'/about', value:18000, max:60000 },{ name:'/blog', value:14000, max:60000 }];
export default function AnalyticsPanel({ title='Analytics Overview', stats=DS, chartData=DEFAULT_ANALYTICS_CHART, tableData=DT, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const maxVal = Math.max(...chartData.map(d => d.value));
  const pts = chartData.map((d, i) => ({ x: (i / (chartData.length - 1)) * 100, y: 100 - (d.value / maxVal) * 100 }));
  const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + ' ' + p.x + ' ' + p.y).join(' ');
  const areaD = pathD + ' L ' + pts[pts.length-1].x + ' 100 L 0 100 Z';
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg, #f9fafb)' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted, #888)', marginTop: 4 }}>{s.label}</div>
            {s.delta ? <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: s.delta.startsWith('-') ? '#ef4444' : '#22c55e' }}>{s.delta} vs last week</div> : null}
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted, #888)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Traffic</div>
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: '100%', height: 100, display: 'block' }}>
          <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity={0.2}/><stop offset="100%" stopColor={accent} stopOpacity={0}/></linearGradient></defs>
          <path d={areaD} fill="url(#ag)" />
          <path d={pathD} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={accent} vectorEffect="non-scaling-stroke" />)}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>{chartData.map((d, i) => <span key={i} style={{ fontSize: 10, color: 'var(--muted, #bbb)' }}>{d.label}</span>)}</div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted, #888)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Pages</div>
        {tableData.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--muted, #888)', width: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--border, #e5e7eb)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: accent, width: (row.value / row.max * 100) + '%' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, width: 48, textAlign: 'right', flexShrink: 0 }}>{(row.value/1000).toFixed(0)}k</span>
          </div>
        ))}
      </div>
    </div>
  );
}`,

"/components/sections/OrdersTable.tsx": `import { useState } from 'react';
interface Order { id: string; customer: string; items: string; total: number; status: string; date: string; }
interface Props { orders?: Order[]; onStatusChange?: (id: string, status: string) => void; accentColor?: string; }
const DEFAULT_ORDERS: Order[] = [
  { id:'#1042', customer:'Alice Chen', items:'2x Widget Pro', total:149.00, status:'Delivered', date:'Jun 28' },
  { id:'#1041', customer:'Bob Smith', items:'1x Premium Plan', total:99.00, status:'Processing', date:'Jun 28' },
  { id:'#1040', customer:'Carol Wu', items:'3x Bundle', total:214.50, status:'Shipped', date:'Jun 27' },
  { id:'#1039', customer:'David Lee', items:'1x Starter Pack', total:49.00, status:'Pending', date:'Jun 27' },
  { id:'#1038', customer:'Eva Moore', items:'1x Enterprise', total:499.00, status:'Delivered', date:'Jun 26' },
  { id:'#1037', customer:'Frank Hall', items:'2x Basic Plan', total:58.00, status:'Cancelled', date:'Jun 25' },
];
const SC: Record<string,{ bg:string; color:string }> = {
  Pending:{ bg:'#fef3c7', color:'#d97706' }, Processing:{ bg:'#dbeafe', color:'#2563eb' },
  Shipped:{ bg:'#ede9fe', color:'#7c3aed' }, Delivered:{ bg:'#dcfce7', color:'#16a34a' }, Cancelled:{ bg:'#fee2e2', color:'#dc2626' },
};
const TABS = ['All','Pending','Processing','Shipped','Delivered','Cancelled'];
export default function OrdersTable({ orders: init = DEFAULT_ORDERS, onStatusChange, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState(init);
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const upd = (id: string, status: string) => { setOrders(l => l.map(o => o.id === id ? { ...o, status } : o)); onStatusChange?.(id, status); };
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700 }}>Orders</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 14px', borderRadius: 50, border: filter === s ? 'none' : '1px solid var(--border, #e5e7eb)', background: filter === s ? accent : 'transparent', color: filter === s ? '#fff' : 'var(--muted, #666)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{s}</button>)}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--bg, #f9fafb)' }}>
            {['Order','Customer','Items','Total','Status','Date'].map(h => <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted, #666)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border, #e5e7eb)' }}
                onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f9fafb)'}
                onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <td style={{ padding: '13px 16px', fontWeight: 700, color: accent }}>{o.id}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: accent, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.customer.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()}</div>
                    {o.customer}
                  </div>
                </td>
                <td style={{ padding: '13px 16px', color: 'var(--muted, #888)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.items}</td>
                <td style={{ padding: '13px 16px', fontWeight: 700 }}>\${o.total.toFixed(2)}</td>
                <td style={{ padding: '13px 16px' }}>
                  <select value={o.status} onChange={e => upd(o.id, e.target.value)} style={{ padding: '4px 10px', borderRadius: 50, border: 'none', background: (SC[o.status]?.bg||'#f3f4f6'), color: (SC[o.status]?.color||'#888'), fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                    {Object.keys(SC).map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding: '13px 16px', color: 'var(--muted, #888)', whiteSpace: 'nowrap' }}>{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,

"/components/sections/FormBuilder.tsx": `import { useState } from 'react';
interface FieldDef { label: string; key: string; type: 'text'|'email'|'tel'|'select'|'textarea'|'toggle'; placeholder?: string; options?: string[]; value?: any; }
interface Sec { title: string; fields: FieldDef[]; }
interface Props { title?: string; subtitle?: string; sections?: Sec[]; onSave?: (data: Record<string,any>) => void; accentColor?: string; }
const DEF: Sec[] = [
  { title:'Profile', fields:[{ label:'Full Name', key:'name', type:'text', placeholder:'John Doe', value:'Alice Chen' },{ label:'Email', key:'email', type:'email', placeholder:'you@example.com', value:'alice@example.com' },{ label:'Role', key:'role', type:'select', options:['Admin','Editor','Viewer'], value:'Admin' }] },
  { title:'Preferences', fields:[{ label:'Bio', key:'bio', type:'textarea', placeholder:'Tell us about yourself...' },{ label:'Email Notifications', key:'notifs', type:'toggle', value:true },{ label:'Dark Mode', key:'dark', type:'toggle', value:false }] },
];
export default function FormBuilder({ title='Account Settings', subtitle='Manage your profile and preferences.', sections=DEF, onSave, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const init: Record<string,any> = {};
  sections.forEach(s => s.fields.forEach(f => { init[f.key] = f.value ?? (f.type === 'toggle' ? false : ''); }));
  const [data, setData] = useState<Record<string,any>>(init);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (key: string, val: any) => { setData(d => ({ ...d, [key]: val })); setSaved(false); };
  const save = async () => { setLoading(true); await new Promise(r => setTimeout(r, 900)); onSave?.(data); setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)', fontSize: 14, outline: 'none', background: 'var(--bg, #f9fafb)', boxSizing: 'border-box' as const };
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, overflow: 'hidden', maxWidth: 640 }}>
      <div style={{ padding: 24, borderBottom: '1px solid var(--border, #e5e7eb)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{title}</h2>
        {subtitle ? <p style={{ margin: 0, color: 'var(--muted, #888)', fontSize: 14 }}>{subtitle}</p> : null}
      </div>
      {sections.map((sec, si) => (
        <div key={si} style={{ padding: 24, borderBottom: '1px solid var(--border, #e5e7eb)' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted, #888)' }}>{sec.title}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sec.fields.map((f, fi) => (
              <div key={fi}>
                {f.type === 'toggle' ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</label>
                    <div onClick={() => set(f.key, !data[f.key])} style={{ width: 44, height: 24, borderRadius: 50, background: data[f.key] ? accent : '#e5e7eb', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 3, left: data[f.key] ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{f.label}</label>
                    {f.type === 'select' ? <select value={data[f.key]||''} onChange={e => set(f.key, e.target.value)} style={{ ...inp, cursor: 'pointer' }}>{f.options?.map(o => <option key={o}>{o}</option>)}</select>
                    : f.type === 'textarea' ? <textarea value={data[f.key]||''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} rows={3} style={{ ...inp, resize: 'vertical' }} />
                    : <input type={f.type} value={data[f.key]||''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={inp} />}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {saved ? <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Changes saved!</span> : <span />}
        <button onClick={save} disabled={loading} style={{ padding: '10px 28px', borderRadius: 9, background: accent, color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: loading ? 0.8 : 1 }}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}`,

"/components/sections/FileManager.tsx": `import { useState } from 'react';
interface FileItem { name: string; type: string; size: string; date: string; url?: string; }
interface Props { files?: FileItem[]; accentColor?: string; }
const DEFAULT_FILES: FileItem[] = [
  { name:'hero-image.png', type:'image', size:'2.4 MB', date:'Jun 28', url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200' },
  { name:'annual-report.pdf', type:'pdf', size:'1.1 MB', date:'Jun 27' },
  { name:'product-shot.jpg', type:'image', size:'3.8 MB', date:'Jun 26', url:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200' },
  { name:'data-export.csv', type:'csv', size:'142 KB', date:'Jun 25' },
  { name:'brand-assets.zip', type:'zip', size:'18.2 MB', date:'Jun 24' },
  { name:'team-photo.jpg', type:'image', size:'4.1 MB', date:'Jun 23', url:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200' },
];
const FI: Record<string,string> = { image:'🖼️', pdf:'📄', csv:'📊', zip:'🗜️', default:'📁' };
export default function FileManager({ files = DEFAULT_FILES, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [search, setSearch] = useState('');
  const filt = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const tog = (i: number) => setSel(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, flex: 1 }}>Files</h3>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)', fontSize: 13, outline: 'none', width: 160 }} />
        {sel.size > 0 ? <button onClick={() => setSel(new Set())} style={{ padding: '7px 14px', borderRadius: 8, background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Delete ({sel.size})</button> : null}
        <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', cursor: 'pointer', fontSize: 12 }}>{view === 'grid' ? 'List' : 'Grid'}</button>
        <button style={{ padding: '7px 14px', borderRadius: 8, background: accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Upload</button>
      </div>
      <div style={{ padding: 16 }}>
        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {filt.map((f, i) => (
              <div key={i} onClick={() => tog(i)} style={{ borderRadius: 10, border: '2px solid ' + (sel.has(i) ? accent : 'var(--border, #e5e7eb)'), overflow: 'hidden', cursor: 'pointer', background: sel.has(i) ? accent + '08' : 'var(--bg, #f9fafb)' }}>
                <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {f.url ? <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display='none'; const p = el.parentElement; if(p){ p.style.background='linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'; p.style.display='flex'; p.style.alignItems='center'; p.style.justifyContent='center'; } }} /> : <span style={{ fontSize: 36 }}>{FI[f.type]||FI.default}</span>}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted, #aaa)', marginTop: 2 }}>{f.size}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>{filt.map((f, i) => (
            <div key={i} onClick={() => tog(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: sel.has(i) ? accent + '10' : 'transparent', marginBottom: 2 }}
              onMouseOver={e => { if (!sel.has(i)) (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f9fafb)'; }}
              onMouseOut={e => { if (!sel.has(i)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <input type="checkbox" checked={sel.has(i)} onChange={() => tog(i)} onClick={e => e.stopPropagation()} />
              <span style={{ fontSize: 20 }}>{FI[f.type]||FI.default}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted, #aaa)' }}>{f.size}</span>
              <span style={{ fontSize: 11, color: 'var(--muted, #bbb)' }}>{f.date}</span>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}`,

"/components/sections/CalendarWidget.tsx": `import { useState } from 'react';
interface CalEvent { date: string; title: string; color?: string; }
interface Props { events?: CalEvent[]; accentColor?: string; }
const DEFAULT_EVENTS: CalEvent[] = [
  { date:'2026-06-08', title:'Product launch', color:'#22c55e' },
  { date:'2026-06-15', title:'Investor call', color:'#ef4444' },
  { date:'2026-06-20', title:'Sprint review', color:'#6366f1' },
  { date:'2026-06-25', title:'Design review', color:'#06b6d4' },
  { date:'2026-06-30', title:'Month-end close', color:'#8b5cf6' },
];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export default function CalendarWidget({ events = DEFAULT_EVENTS, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const today = new Date();
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [sel, setSel] = useState<string | null>(null);
  const first = new Date(cur.year, cur.month, 1).getDay();
  const dim = new Date(cur.year, cur.month + 1, 0).getDate();
  const cells: (number|null)[] = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const fmt = (d: number) => cur.year + '-' + String(cur.month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
  const evFor = (d: number) => events.filter(e => e.date === fmt(d));
  const selEvs = sel ? events.filter(e => e.date === sel) : [];
  const isToday = (d: number) => fmt(d) === today.toISOString().split('T')[0];
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}>
      <div style={{ padding: 20, flex: '1 1 260px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setCur(c => c.month === 0 ? { year: c.year-1, month: 11 } : { ...c, month: c.month-1 })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted, #888)' }}>&#8249;</button>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{MONTHS[cur.month]} {cur.year}</span>
          <button onClick={() => setCur(c => c.month === 11 ? { year: c.year+1, month: 0 } : { ...c, month: c.month+1 })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted, #888)' }}>&#8250;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted, #aaa)', padding: '3px 0' }}>{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const ds = fmt(d), evs = evFor(d), isSel = sel === ds, isTod = isToday(d);
            return (
              <div key={i} onClick={() => setSel(isSel ? null : ds)} style={{ textAlign: 'center', padding: '5px 1px', borderRadius: 7, cursor: 'pointer', background: isSel ? accent : isTod ? accent + '18' : 'transparent', color: isSel ? '#fff' : 'var(--fg, #111)', fontWeight: isTod ? 800 : 400, fontSize: 12 }}
                onMouseOver={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f3f4f6)'; }}
                onMouseOut={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = isTod ? accent + '18' : 'transparent'; }}>
                {d}
                {evs.length > 0 ? <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 1 }}>{evs.slice(0,3).map((e,j) => <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#fff' : (e.color || accent) }} />)}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
      {sel && selEvs.length > 0 ? (
        <div style={{ width: 170, borderLeft: '1px solid var(--border, #e5e7eb)', padding: 16, background: 'var(--bg, #f9fafb)', flex: '0 0 170px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted, #888)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Events</div>
          {selEvs.map((e, i) => <div key={i} style={{ padding: '7px 10px', borderRadius: 7, marginBottom: 7, borderLeft: '3px solid ' + (e.color || accent), background: 'var(--card, #fff)', fontSize: 12, fontWeight: 600 }}>{e.title}</div>)}
        </div>
      ) : null}
    </div>
  );
}`,

"/components/sections/QuickActions.tsx": `interface ActionItem { icon: string; label: string; desc?: string; color: string; onClick?: () => void; }
interface Props { title?: string; items?: ActionItem[]; columns?: number; accentColor?: string; }
const DEFAULT_ACTIONS: ActionItem[] = [
  { icon:'➕', label:'New Project', desc:'Start from scratch', color:'#6366f1' },
  { icon:'📤', label:'Export Data', desc:'CSV or JSON', color:'#f59e0b' },
  { icon:'👥', label:'Invite Team', desc:'Add collaborators', color:'#22c55e' },
  { icon:'💳', label:'Billing', desc:'Manage subscription', color:'#06b6d4' },
  { icon:'📊', label:'Reports', desc:'View analytics', color:'#8b5cf6' },
  { icon:'⚙️', label:'Settings', desc:'Configure workspace', color:'#ec4899' },
];
export default function QuickActions({ title='Quick Actions', items=DEFAULT_ACTIONS, columns=3, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  return (
    <div style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {title ? <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>{title}</h3> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + columns + ', 1fr)', gap: 14 }}>
        {items.map((item, i) => (
          <button key={i} onClick={item.onClick} style={{ padding: '18px 16px', borderRadius: 12, border: '1px solid var(--border, #e5e7eb)', background: item.color + '0c', cursor: 'pointer', textAlign: 'left', outline: 'none' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.background = item.color + '18'; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.background = item.color + '0c'; }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</div>
            {item.desc ? <div style={{ fontSize: 11, color: 'var(--muted, #888)', marginTop: 3 }}>{item.desc}</div> : null}
          </button>
        ))}
      </div>
    </div>
  );
}`,

"/components/sections/DashboardShell.tsx": `import React, { useState } from 'react';
interface NavItem { label: string; icon: string; active?: boolean; }
interface Props { brand: string; navItems?: NavItem[]; pageTitle?: string; breadcrumbs?: string[]; userName?: string; userRole?: string; notifications?: number; children?: React.ReactNode; accentColor?: string; }
const DN: NavItem[] = [{ label:'Dashboard', icon:'🏠', active:true },{ label:'Analytics', icon:'📊' },{ label:'Users', icon:'👥' },{ label:'Orders', icon:'📦' },{ label:'Settings', icon:'⚙️' }];
function ini(n: string) { return n.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase(); }
export default function DashboardShell({ brand, navItems=DN, pageTitle='Dashboard', breadcrumbs=['Home','Dashboard'], userName='Admin User', userRole='Super Admin', notifications=4, children, accentColor }: Props) {
  const accent = accentColor || 'var(--primary, #6366f1)';
  const [active, setActive] = useState(() => navItems.findIndex(n => n.active) || 0);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: 'flex', height: '100vh', minHeight: 600, background: 'var(--bg, #f3f4f6)', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <div style={{ width: open ? 220 : 64, background: 'var(--card, #fff)', borderRight: '1px solid var(--border, #e5e7eb)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: open ? '20px 18px 14px' : '20px 14px 14px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>{brand[0]}</div>
          {open ? <span style={{ fontWeight: 800, fontSize: 16, color: accent, whiteSpace: 'nowrap' }}>{brand}</span> : null}
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map((item, i) => (
            <div key={i} onClick={() => setActive(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: active === i ? accent + '15' : 'transparent', color: active === i ? accent : 'var(--fg, #444)', fontWeight: active === i ? 700 : 500, fontSize: 13, overflow: 'hidden', whiteSpace: 'nowrap' }}
              onMouseOver={e => { if (active !== i) (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f5f5f5)'; }}
              onMouseOut={e => { if (active !== i) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {open ? item.label : null}
            </div>
          ))}
        </nav>
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#fee2e2'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <span style={{ flexShrink: 0 }}>🚪</span>
            {open ? 'Logout' : null}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: 60, background: 'var(--card, #fff)', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', flexShrink: 0 }}>
          <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted, #888)' }}>☰</button>
          <input placeholder="Search..." style={{ flex: 1, maxWidth: 300, padding: '7px 14px', borderRadius: 9, border: '1px solid var(--border, #e5e7eb)', fontSize: 13, outline: 'none', background: 'var(--bg, #f3f4f6)' }} />
          <div style={{ flex: 1 }} />
          <button style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🔔
            {notifications > 0 ? <span style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifications}</span> : null}
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenu(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ini(userName || 'AU')}</div>
              <span style={{ fontSize: 10, color: 'var(--muted, #aaa)' }}>v</span>
            </button>
            {menu ? (
              <>
                <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div style={{ position: 'absolute', right: 0, top: 48, background: 'var(--card, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 160, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border, #f0f0f0)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted, #888)' }}>{userRole}</div>
                  </div>
                  {['Profile','Settings','Help'].map(item => <div key={item} style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer' }} onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg, #f5f5f5)'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>{item}</div>)}
                  <div style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#ef4444', borderTop: '1px solid var(--border, #f0f0f0)' }} onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#fee2e2'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Sign out</div>
                </div>
              </>
            ) : null}
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            {breadcrumbs ? <div style={{ display: 'flex', gap: 4, fontSize: 12, color: 'var(--muted, #aaa)', marginBottom: 6 }}>{breadcrumbs.map((b,i) => <span key={i}>{i > 0 ? <span style={{ margin: '0 4px' }}>/</span> : null}{b}</span>)}</div> : null}
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{pageTitle}</h1>
          </div>
          {children || <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #aaa)', background: 'var(--card, #fff)', borderRadius: 16, border: '1px solid var(--border, #e5e7eb)' }}>Page content goes here</div>}
        </main>
      </div>
    </div>
  );
}`,


"/components/sections/ComingSoon.tsx": `
import React, { useState, useEffect } from 'react';
interface Social { platform: string; href: string; }
interface ComingSoonProps { title?: string; subtitle?: string; launchDate?: string; backgroundImage?: string; socials?: Social[]; accentColor?: string; }
export default function ComingSoon({ title = 'Coming Soon', subtitle = 'Something amazing is on the way.', launchDate, backgroundImage, socials = [], accentColor = '#6366f1' }: ComingSoonProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!launchDate) return;
    const calc = () => {
      const diff = new Date(launchDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
    };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [launchDate]);
  const icons: Record<string, string> = { instagram: 'IG', twitter: 'TW', facebook: 'FB', linkedin: 'LI', youtube: 'YT', tiktok: 'TK' };
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 24px', position: 'relative', background: backgroundImage ? \`url(\${backgroundImage}) center/cover no-repeat\` : \`linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)\`, color: '#fff' }}>
      {backgroundImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, width: '100%' }}>
        <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 40, border: \`1px solid \${accentColor}60\`, color: accentColor, fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>We Are Launching</div>
        <h1 style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.05 }}>{title}</h1>
        <p style={{ fontSize: 18, opacity: 0.75, marginBottom: 48, lineHeight: 1.6 }}>{subtitle}</p>
        {launchDate && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 48, flexWrap: 'wrap' as const }}>
            {([['days','Days'],['hours','Hours'],['minutes','Min'],['seconds','Sec']] as [string,string][]).map(([k, lbl]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px 24px', minWidth: 80 }}>
                <div style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>{String((timeLeft as any)[k]).padStart(2,'0')}</div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}
        {submitted ? (
          <div style={{ padding: '20px 32px', borderRadius: 16, background: \`\${accentColor}20\`, border: \`1px solid \${accentColor}40\`, color: accentColor, fontWeight: 700, fontSize: 16 }}>You are on the list!</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); if (email) setSubmitted(true); }} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap' as const }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required style={{ flex: 1, minWidth: 200, padding: '14px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, outline: 'none' }} />
            <button type="submit" style={{ padding: '14px 28px', borderRadius: 12, background: accentColor, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' as const }}>Notify Me</button>
          </form>
        )}
        {socials.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 40 }}>
            {socials.map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, textDecoration: 'none', color: '#fff' }}>{icons[s.platform] || s.platform.slice(0,2).toUpperCase()}</a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}`,

"/components/sections/MaintenanceMode.tsx": `
import React, { useEffect, useState } from 'react';
interface MaintenanceModeProps { title?: string; message?: string; returnTime?: string; email?: string; accentColor?: string; }
export default function MaintenanceMode({ title = "We will Be Right Back", message = 'We are performing scheduled maintenance to improve your experience.', returnTime, email, accentColor = '#6366f1' }: MaintenanceModeProps) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPct(p => { if (p >= 85) { clearInterval(id); return 85; } return p + 1; }), 60);
    return () => clearInterval(id);
  }, []);
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d14', color: '#f0f0f8', textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🔧</div>
        <h1 style={{ fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 16px' }}>{title}</h1>
        <p style={{ fontSize: 17, opacity: 0.65, lineHeight: 1.7, marginBottom: 40 }}>{message}</p>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', height: 8, marginBottom: 12 }}>
          <div style={{ height: '100%', width: \`\${pct}%\`, background: \`linear-gradient(90deg, \${accentColor}, \${accentColor}99)\`, borderRadius: 999, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 40 }}>Estimated progress: {pct}%</div>
        {returnTime && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, marginBottom: 28 }}>Expected back: <strong>{returnTime}</strong></div>}
        {email && <div style={{ fontSize: 14, opacity: 0.55 }}>Questions? <a href={\`mailto:\${email}\`} style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>{email}</a></div>}
      </div>
    </section>
  );
}`,

"/components/sections/StickyContactBar.tsx": `
import React, { useState, useEffect } from 'react';
interface StickyContactBarProps { phone?: string; ctaText?: string; ctaHref?: string; message?: string; accentColor?: string; }
export default function StickyContactBar({ phone = '(555) 123-4567', ctaText = 'Book Now', ctaHref = '#booking', message, accentColor = '#6366f1' }: StickyContactBarProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const h = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  if (!visible || dismissed) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, background: '#fff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
      {message && <span style={{ flex: 1, fontSize: 14, color: '#374151', minWidth: 150 }}>{message}</span>}
      {phone && <a href={\`tel:\${phone.replace(/[^0-9+]/g,'')}\`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', textDecoration: 'none', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' as const }}>📞 {phone}</a>}
      <a href={ctaHref} style={{ padding: '10px 24px', borderRadius: 10, background: accentColor, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' as const, marginLeft: 'auto' }}>{ctaText}</a>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1, padding: '0 4px' }}>x</button>
    </div>
  );
}`,

"/components/sections/PopupModal.tsx": `
import React, { useState, useEffect } from 'react';
interface PopupModalProps { title?: string; description?: string; ctaText?: string; ctaHref?: string; image?: string; delay?: number; accentColor?: string; }
export default function PopupModal({ title = 'Special Offer', description = 'Sign up now and get 20% off your first order.', ctaText = 'Claim Offer', ctaHref = '#contact', image, delay = 5000, accentColor = '#6366f1' }: PopupModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem('popup_dismissed')) return; } catch {}
    const id = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  const dismiss = () => { setOpen(false); try { localStorage.setItem('popup_dismissed', String(Date.now() + 7 * 86400000)); } catch {} };
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={dismiss} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 24, overflow: 'hidden', maxWidth: 480, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
        {image && <img src={image} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />}
        <button onClick={dismiss} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.35)', color: '#fff', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
        <div style={{ padding: 36 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h2>
          <p style={{ margin: '0 0 28px', color: '#6b7280', lineHeight: 1.6 }}>{description}</p>
          {done ? (
            <div style={{ padding: '14px 20px', borderRadius: 12, background: \`\${accentColor}15\`, color: accentColor, fontWeight: 700, textAlign: 'center' as const }}>You are in!</div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setDone(true); }} style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" required style={{ padding: '13px 18px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none' }} />
              <a href={ctaHref} onClick={() => setDone(true)} style={{ display: 'block', padding: '14px', borderRadius: 12, background: accentColor, color: '#fff', textAlign: 'center' as const, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>{ctaText}</a>
            </form>
          )}
          <button onClick={dismiss} style={{ display: 'block', marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, width: '100%', textAlign: 'center' as const }}>No thanks</button>
        </div>
      </div>
    </div>
  );
}`,

"/components/sections/InteractiveMap.tsx": `
import React from 'react';
interface HoursRow { day: string; time: string; }
interface InteractiveMapProps { businessName?: string; address?: string; phone?: string; hours?: HoursRow[]; mapQuery?: string; accentColor?: string; }
export default function InteractiveMap({ businessName = 'Our Location', address = '123 Main St, City, ST 00000', phone = '(555) 123-4567', hours = [], mapQuery, accentColor = '#6366f1' }: InteractiveMapProps) {
  const query = encodeURIComponent(mapQuery || address);
  const mapsHref = \`https://www.google.com/maps/search/?api=1&query=\${query}\`;
  const embedSrc = \`https://maps.google.com/maps?q=\${query}&t=&z=15&ie=UTF8&iwloc=&output=embed\`;
  return (
    <section style={{ padding: '80px 40px', background: 'var(--bg, #fff)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 40, flexWrap: 'wrap' as const, alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 320px', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.1)', minHeight: 360 }}>
          <iframe title="map" src={embedSrc} width="100%" height="100%" style={{ border: 0, display: 'block', minHeight: 360 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 20 }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, letterSpacing: '-0.02em' }}>{businessName}</h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><span style={{ fontSize: 20 }}>📍</span><span style={{ fontSize: 15, lineHeight: 1.6, color: '#374151' }}>{address}</span></div>
          {phone && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 20 }}>📞</span><a href={\`tel:\${phone.replace(/[^0-9+]/g,'')}\`} style={{ fontSize: 15, color: accentColor, fontWeight: 600, textDecoration: 'none' }}>{phone}</a></div>}
          {hours.length > 0 && (
            <div style={{ background: 'var(--card, #f9fafb)', borderRadius: 14, padding: '16px 20px' }}>
              {hours.map((h, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14, borderBottom: i < hours.length - 1 ? '1px solid #f0f0f0' : 'none' }}><span style={{ fontWeight: 600 }}>{h.day}</span><span style={{ color: '#6b7280' }}>{h.time}</span></div>)}
            </div>
          )}
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 12, background: accentColor, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>Get Directions</a>
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/TestimonialsCarousel.tsx": `
import React, { useState, useEffect, useRef } from 'react';
interface TItem { name: string; text: string; rating?: number; image?: string; role?: string; }
interface TestimonialsCarouselProps { title?: string; items?: TItem[]; accentColor?: string; }
export default function TestimonialsCarousel({ title = 'What Our Clients Say', items = [], accentColor = '#6366f1' }: TestimonialsCarouselProps) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const list = items.length > 0 ? items : [{ name: 'Sarah K.', role: 'Verified Customer', text: 'Absolutely incredible experience from start to finish. Would recommend to anyone.', rating: 5, image: '' }];
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % list.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, list.length]);
  const prev = () => setIdx(i => (i - 1 + list.length) % list.length);
  const next = () => setIdx(i => (i + 1) % list.length);
  const item = list[idx];
  return (
    <section style={{ padding: '80px 40px', background: 'var(--bg, #fff)' }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' as const }}>
        <h2 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, marginBottom: 48, letterSpacing: '-0.02em' }}>{title}</h2>
        <div style={{ position: 'relative', background: 'var(--card, #f9fafb)', borderRadius: 24, padding: '48px 52px', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 56, color: accentColor, lineHeight: 1, marginBottom: 20, opacity: 0.3 }}>"</div>
          <p style={{ fontSize: 'clamp(16px,2.5vw,20px)', lineHeight: 1.75, margin: '0 0 28px', color: '#374151', fontStyle: 'italic' as const }}>{item.text}</p>
          {item.rating && <div style={{ color: '#f59e0b', fontSize: 22, marginBottom: 20 }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            {item.image && <img src={item.image} alt={item.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />}
            <div style={{ textAlign: 'left' as const }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{item.name}</div>
              {item.role && <div style={{ fontSize: 13, color: '#9ca3af' }}>{item.role}</div>}
            </div>
          </div>
          <button onClick={prev} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>&#8249;</button>
          <button onClick={next} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>&#8250;</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {list.map((_, i) => <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, background: i === idx ? accentColor : '#d1d5db', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />)}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/ImageCompare.tsx": `
import React, { useState, useRef, useCallback } from 'react';
interface Pair { before: string; after: string; caption?: string; }
interface ImageCompareProps { pairs?: Pair[]; accentColor?: string; title?: string; }
export default function ImageCompare({ pairs = [], accentColor = '#6366f1', title }: ImageCompareProps) {
  const [sliders, setSliders] = useState<number[]>((pairs.length > 0 ? pairs : [{}]).map(() => 50));
  const dragging = useRef<number | null>(null);
  const list = pairs.length > 0 ? pairs : [{ before: 'https://source.unsplash.com/600x400/?before,dull', after: 'https://source.unsplash.com/600x400/?after,bright', caption: 'Before and After' }];
  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent, i: number) => {
    if (dragging.current !== i) return;
    const el = (e.currentTarget as HTMLElement).parentElement!;
    const rect = el.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliders(s => { const c = [...s]; c[i] = pct; return c; });
  }, []);
  return (
    <section style={{ padding: '80px 40px', background: 'var(--bg, #fff)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {title && <h2 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>{title}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 32 }}>
          {list.map((p, i) => (
            <div key={i}>
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'col-resize', userSelect: 'none' as const, aspectRatio: '3/2' }}
                onMouseMove={e => onMove(e, i)} onTouchMove={e => onMove(e, i)}
                onMouseUp={() => { dragging.current = null; }} onMouseLeave={() => { dragging.current = null; }}>
                <img src={p.after} alt="After" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: \`\${sliders[i]}%\` }}>
                  <img src={p.before} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover', minWidth: '200%' }} />
                </div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: \`\${sliders[i]}%\`, transform: 'translateX(-50%)', width: 3, background: '#fff', cursor: 'col-resize' }}
                  onMouseDown={() => { dragging.current = i; }} onTouchStart={() => { dragging.current = i; }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 36, height: 36, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>||</div>
                </div>
                <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>Before</span>
                <span style={{ position: 'absolute', top: 12, right: 12, background: accentColor, color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>After</span>
              </div>
              {p.caption && <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: '#6b7280' }}>{p.caption}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/VideoTestimonial.tsx": `
import React, { useState } from 'react';
interface VItem { videoId: string; thumbnail?: string; name: string; role?: string; }
interface VideoTestimonialProps { title?: string; videos?: VItem[]; accentColor?: string; }
export default function VideoTestimonial({ title = 'Hear From Our Customers', videos = [], accentColor = '#6366f1' }: VideoTestimonialProps) {
  const [active, setActive] = useState<string | null>(null);
  const list = videos.length > 0 ? videos : [{ videoId: 'dQw4w9WgXcQ', name: 'Jane D.', role: 'CEO, Acme Corp' }];
  return (
    <section style={{ padding: '80px 40px', background: 'var(--bg, #fff)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {title && <h2 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>{title}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 28 }}>
          {list.map((v, i) => (
            <div key={i} onClick={() => setActive(v.videoId)} style={{ cursor: 'pointer', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', transition: 'transform 0.2s,box-shadow 0.2s' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(0,0,0,0.15)'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 24px rgba(0,0,0,0.1)'; }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                <img src={v.thumbnail || \`https://img.youtube.com/vi/\${v.videoId}/hqdefault.jpg\`} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: \`0 0 0 8px \${accentColor}40\`, color: '#fff', fontWeight: 700 }}>&#9654;</div>
                </div>
              </div>
              <div style={{ padding: '16px 20px', background: 'var(--card, #fff)' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{v.name}</div>
                {v.role && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{v.role}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {active && (
        <div onClick={() => setActive(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 860, aspectRatio: '16/9' }}>
            <iframe src={\`https://www.youtube.com/embed/\${active}?autoplay=1\`} title="video" allow="autoplay; fullscreen" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 }} />
            <button onClick={() => setActive(null)} style={{ position: 'absolute', top: -44, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', lineHeight: 1 }}>x</button>
          </div>
        </div>
      )}
    </section>
  );
}`,

"/components/sections/AffiliatePartners.tsx": `
import React from 'react';
interface Partner { name: string; logo?: string; url?: string; tier?: string; }
interface AffiliatePartnersProps { title?: string; subtitle?: string; partners?: Partner[]; accentColor?: string; }
export default function AffiliatePartners({ title = 'Our Partners', subtitle, partners = [], accentColor = '#6366f1' }: AffiliatePartnersProps) {
  const tierOrder = ['gold','silver','bronze',''];
  const sorted = [...partners].sort((a, b) => tierOrder.indexOf(a.tier || '') - tierOrder.indexOf(b.tier || ''));
  const tierColors: Record<string, string> = { gold: '#d4a843', silver: '#94a3b8', bronze: '#cd7f32' };
  const defaults = ['Acme Corp','TechFlow','BuildRight','SwiftLabs','NovaCo','Meridian'];
  return (
    <section style={{ padding: '80px 40px', background: 'var(--bg, #fff)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' as const }}>
        <h2 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, marginBottom: subtitle ? 12 : 48, letterSpacing: '-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 17, color: '#6b7280', marginBottom: 48 }}>{subtitle}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 24, justifyContent: 'center' }}>
          {(sorted.length > 0 ? sorted : defaults.map(n => ({ name: n }))).map((p, i) => {
            const tc = tierColors[p.tier || ''] || 'transparent';
            const inner = (<div style={{ padding: '20px 32px', borderRadius: 14, border: p.tier ? \`2px solid \${tc}60\` : '1.5px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, transition: 'all 0.25s', minWidth: 140, cursor: 'pointer' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(0,0,0,0.1)'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow=''; }}>
              {p.tier && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: tc }}>{p.tier}</span>}
              {p.logo ? <img src={p.logo} alt={p.name} style={{ width: 80, height: 40, objectFit: 'contain', filter: 'grayscale(1)', transition: 'filter 0.2s' }} onMouseOver={e => (e.currentTarget as HTMLImageElement).style.filter=''} onMouseOut={e => (e.currentTarget as HTMLImageElement).style.filter='grayscale(1)'} /> : <span style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>{p.name}</span>}
            </div>);
            return p.url ? <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a> : <div key={i}>{inner}</div>;
          })}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/StatsCounter.tsx": `
import React, { useEffect, useRef, useState } from 'react';
interface StatItem { value: string; label: string; icon?: string; prefix?: string; suffix?: string; }
interface StatsCounterProps { stats?: StatItem[]; background?: string; accentColor?: string; title?: string; }
export default function StatsCounter({ stats = [], background = 'dark', accentColor = '#6366f1', title }: StatsCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);
  const [counts, setCounts] = useState<number[]>([]);
  const list = stats.length > 0 ? stats : [{ value: '10000', label: 'Happy Customers', icon: '😊', suffix: '+' }, { value: '4.9', label: 'Average Rating', icon: '⭐', suffix: ' stars' }, { value: '98', label: 'Satisfaction Rate', icon: '❤️', suffix: '%' }, { value: '24', label: 'Support Hours', icon: '🛠', suffix: '/7' }];
  useEffect(() => {
    setCounts(list.map(() => 0));
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !triggered) { setTriggered(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!triggered) return;
    const targets = list.map(s => parseFloat(s.value.replace(/[^0-9.]/g, '')) || 0);
    const duration = 1800; const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounts(targets.map(t => t * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [triggered]);
  const isDark = background === 'dark';
  const isAccent = background === 'accent';
  const bg = isDark ? 'linear-gradient(135deg,#0f0f1a,#1a1a2e)' : isAccent ? \`linear-gradient(135deg,\${accentColor},\${accentColor}cc)\` : 'var(--bg,#fff)';
  const fg = (isDark || isAccent) ? '#fff' : 'var(--fg,#111)';
  return (
    <section ref={ref} style={{ padding: '80px 40px', background: bg, color: fg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' as const }}>
        {title && <h2 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, marginBottom: 56, letterSpacing: '-0.02em', color: fg }}>{title}</h2>}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 40, justifyContent: 'center' }}>
          {list.map((s, i) => {
            const decimals = s.value.includes('.') ? 1 : 0;
            const hasLetters = /[a-zA-Z/]/.test(s.value);
            const num = (counts[i] || 0).toFixed(decimals);
            const display = triggered && !hasLetters ? (s.prefix || '') + num + (s.suffix || s.value.replace(/[0-9.]/g, '')) : (s.prefix || '') + s.value + (s.suffix || '');
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', minWidth: 160 }}>
                {s.icon && <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>}
                <div style={{ fontSize: 'clamp(42px,7vw,72px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: (isDark || isAccent) ? accentColor : fg }}>{display}</div>
                <div style={{ fontSize: 15, marginTop: 8, opacity: 0.65, fontWeight: 500 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}`,


"/components/sections/HeroCentered.tsx": `
import React from 'react';

interface HeroCenteredProps {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  backgroundImage?: string;
  accentColor?: string;
  badge?: string;
}

export default function HeroCentered({ title = 'Welcome', subtitle, description, ctaText = 'Get Started', ctaHref = '#contact', secondaryCtaText, secondaryCtaHref = '#features', backgroundImage, accentColor = '#6366f1', badge }: HeroCenteredProps) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  return (
    <section id="hero" style={{
      position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '120px 40px 80px',
      background: backgroundImage ? \`url(\${backgroundImage}) center/cover no-repeat\` : \`linear-gradient(135deg, \${accentColor}18 0%, var(--bg) 60%)\`,
      overflow: 'hidden',
    }}>
      {backgroundImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />}

      <div style={{
        position: 'relative', maxWidth: 800, margin: '0 auto',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {badge && (
          <div style={{ display: 'inline-block', background: \`\${accentColor}20\`, border: \`1px solid \${accentColor}40\`,
            color: accentColor, padding: '6px 16px', borderRadius: 30, fontSize: 13, fontWeight: 700,
            letterSpacing: '0.05em', marginBottom: 24, textTransform: 'uppercase' }}>
            {badge}
          </div>
        )}
        <h1 style={{
          fontSize: 'clamp(42px, 7vw, 84px)', fontWeight: 900, lineHeight: 1.05,
          color: backgroundImage ? '#fff' : 'var(--fg)', marginBottom: 20,
          letterSpacing: '-0.03em',
        }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', color: backgroundImage ? 'rgba(255,255,255,0.9)' : 'var(--fg)', opacity: backgroundImage ? 1 : 0.75, marginBottom: 12, fontWeight: 400, lineHeight: 1.4 }}>{subtitle}</p>}
        {description && <p style={{ fontSize: 17, color: backgroundImage ? 'rgba(255,255,255,0.8)' : 'var(--fg)', opacity: backgroundImage ? 1 : 0.65, marginBottom: 36, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 36px' }}>{description}</p>}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={ctaHref} style={{
            background: accentColor, color: '#fff', padding: '16px 36px', borderRadius: 50,
            textDecoration: 'none', fontWeight: 800, fontSize: 17,
            boxShadow: \`0 8px 30px \${accentColor}50\`, transition: 'all 0.2s',
            display: 'inline-block',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = \`0 12px 40px \${accentColor}60\`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = \`0 8px 30px \${accentColor}50\`; }}>
            {ctaText}
          </a>
          {secondaryCtaText && (
            <a href={secondaryCtaHref} style={{
              background: 'transparent', color: backgroundImage ? '#fff' : 'var(--fg)',
              padding: '16px 36px', borderRadius: 50, textDecoration: 'none', fontWeight: 700, fontSize: 17,
              border: \`2px solid \${backgroundImage ? 'rgba(255,255,255,0.4)' : 'var(--border)'}\`,
              transition: 'all 0.2s', display: 'inline-block',
            }}>{secondaryCtaText}</a>
          )}
        </div>
      </div>
    </section>
  );
}
`,

"/components/sections/HeroSplit.tsx": `
import React from 'react';

interface HeroSplitProps {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  image?: string;
  accentColor?: string;
  badge?: string;
  imagePosition?: 'left' | 'right';
  stats?: { value: string; label: string }[];
}

export default function HeroSplit({ title = 'Build Something Amazing', subtitle, description, ctaText = 'Get Started', ctaHref = '#contact', secondaryCtaText, secondaryCtaHref = '#features', image, accentColor = '#6366f1', badge, imagePosition = 'right', stats }: HeroSplitProps) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  const textContent = (
    <div style={{ flex: 1, padding: '0 20px', opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-30px)', transition: 'all 0.7s ease' }}>
      {badge && <span style={{ display: 'inline-block', background: \`\${accentColor}15\`, color: accentColor, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{badge}</span>}
      <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.1, color: 'var(--fg)', marginBottom: 16, letterSpacing: '-0.03em' }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 'clamp(18px, 2vw, 22px)', color: 'var(--fg)', opacity: 0.75, marginBottom: 12, fontWeight: 400, lineHeight: 1.4 }}>{subtitle}</p>}
      {description && <p style={{ fontSize: 16, color: 'var(--fg)', opacity: 0.65, marginBottom: 32, lineHeight: 1.7 }}>{description}</p>}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: stats ? 40 : 0 }}>
        <a href={ctaHref} style={{ background: accentColor, color: '#fff', padding: '14px 32px', borderRadius: 50, textDecoration: 'none', fontWeight: 800, fontSize: 16, boxShadow: \`0 6px 24px \${accentColor}45\`, display: 'inline-block' }}>{ctaText}</a>
        {secondaryCtaText && <a href={secondaryCtaHref} style={{ color: 'var(--fg)', padding: '14px 32px', borderRadius: 50, textDecoration: 'none', fontWeight: 700, fontSize: 16, border: '2px solid var(--border)', display: 'inline-block' }}>{secondaryCtaText}</a>}
      </div>
      {stats && stats.length > 0 && (
        <div style={{ display: 'flex', gap: 32, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 28, fontWeight: 900, color: accentColor }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--fg)', opacity: 0.6, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const imageContent = (
    <div style={{ flex: 1, padding: '0 20px', opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(30px)', transition: 'all 0.7s ease 0.15s' }}>
      {image ? (
        <img src={image} alt={title} style={{ width: '100%', height: '100%', maxHeight: 520, objectFit: 'cover', borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.15)' }} />
      ) : (
        <div style={{ width: '100%', paddingTop: '75%', borderRadius: 24, background: \`linear-gradient(135deg, \${accentColor}30, \${accentColor}10)\`, border: \`2px solid \${accentColor}20\` }} />
      )}
    </div>
  );

  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 40px', background: 'var(--bg)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
        {imagePosition === 'left' ? <>{imageContent}{textContent}</> : <>{textContent}{imageContent}</>}
      </div>
    </section>
  );
}
`,

"/components/sections/HeroVideo.tsx": `
import React from 'react';

interface HeroVideoProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  videoUrl?: string;
  accentColor?: string;
  overlayOpacity?: number;
}

export default function HeroVideo({ title = 'Experience the Difference', subtitle, ctaText = 'Learn More', ctaHref = '#about', videoUrl, accentColor = '#6366f1', overlayOpacity = 0.55 }: HeroVideoProps) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t); }, []);

  return (
    <section id="hero" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}>
      {videoUrl ? (
        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}>
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: \`linear-gradient(135deg, #0f0f1a, #1a0a2e, #0d1b2a)\`, zIndex: 0 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: \`rgba(0,0,0,\${overlayOpacity})\`, zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, padding: '0 40px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}>
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 20, letterSpacing: '-0.03em', textShadow: '0 4px 40px rgba(0,0,0,0.3)' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', color: 'rgba(255,255,255,0.85)', marginBottom: 40, lineHeight: 1.5 }}>{subtitle}</p>}
        <a href={ctaHref} style={{ background: accentColor, color: '#fff', padding: '18px 44px', borderRadius: 50, textDecoration: 'none', fontWeight: 800, fontSize: 18, display: 'inline-block', boxShadow: \`0 8px 40px \${accentColor}70\`, letterSpacing: '0.01em' }}>{ctaText}</a>
        <div style={{ position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)', animation: 'heroScroll 2s ease-in-out infinite' }}>
          <div style={{ width: 2, height: 40, background: 'rgba(255,255,255,0.4)', margin: '0 auto', borderRadius: 2 }} />
        </div>
      </div>
      <style>{'.heroScroll { animation: heroScrollAnim 2s ease-in-out infinite; } @keyframes heroScrollAnim { 0%,100%{opacity:0.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(8px)} }'}</style>
    </section>
  );
}
`,

"/components/sections/StructuredData.tsx": `
import React from 'react';

interface StructuredDataProps {
  type?: 'LocalBusiness' | 'Restaurant' | 'MedicalBusiness' | 'LegalService' | 'HealthAndBeautyBusiness' | 'SportsActivityLocation' | 'Store' | 'Organization';
  name?: string;
  description?: string;
  url?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string[];
  priceRange?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
}

export default function StructuredData({ type = 'LocalBusiness', name, description, url, phone, address, city, state, zip, latitude, longitude, openingHours, priceRange, image, rating, reviewCount }: StructuredDataProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    ...(name && { name }),
    ...(description && { description }),
    ...(url && { url }),
    ...(phone && { telephone: phone }),
    ...(priceRange && { priceRange }),
    ...(image && { image }),
    ...((address || city) && {
      address: {
        "@type": "PostalAddress",
        ...(address && { streetAddress: address }),
        ...(city && { addressLocality: city }),
        ...(state && { addressRegion: state }),
        ...(zip && { postalCode: zip }),
        addressCountry: "US"
      }
    }),
    ...((latitude && longitude) && {
      geo: { "@type": "GeoCoordinates", latitude, longitude }
    }),
    ...(openingHours && openingHours.length > 0 && { openingHours }),
    ...((rating && reviewCount) && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        reviewCount
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
`,

"/components/sections/GoogleAnalytics.tsx": `
import React from 'react';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  if (!measurementId) return null;

  React.useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = \`https://www.googletagmanager.com/gtag/js?id=\${measurementId}\`;
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = \`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '\${measurementId}');\`;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [measurementId]);

  return null;
}
`,

"/components/sections/CookieBanner.tsx": `
import React from 'react';

interface CookieBannerProps {
  accentColor?: string;
  privacyUrl?: string;
  cookieName?: string;
  message?: string;
}

export default function CookieBanner({ accentColor = '#6366f1', privacyUrl = '#', cookieName = 'cookie_consent', message }: CookieBannerProps) {
  const [visible, setVisible] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(cookieName)) {
        setTimeout(() => setVisible(true), 1500);
      }
    } catch {}
  }, [cookieName]);

  const accept = (all: boolean) => {
    try { localStorage.setItem(cookieName, all ? 'all' : 'essential'); } catch {}
    setAnimating(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: \`translateX(-50%) translateY(\${animating ? '120px' : '0'})\`,
      width: 'min(600px, calc(100vw - 32px))', background: 'var(--card)',
      borderRadius: 16, padding: '20px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
      border: '1px solid var(--border)', zIndex: 9999, transition: 'transform 0.3s ease',
      display: 'flex', flexDirection: 'column', gap: 16,
    }} role="dialog" aria-label="Cookie consent">
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🍪</span>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--fg)', marginBottom: 4, fontSize: 16 }}>We use cookies</p>
          <p style={{ color: 'var(--fg)', opacity: 0.7, fontSize: 14, lineHeight: 1.5, margin: 0 }}>
            {message || \`We use cookies to improve your experience, analyze traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.\`}
            {' '}<a href={privacyUrl} style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => accept(false)} style={{
          background: 'transparent', color: 'var(--fg)', border: '1px solid var(--border)',
          padding: '9px 18px', borderRadius: 25, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'}
           onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
          Essential Only
        </button>
        <button type="button" onClick={() => accept(true)} style={{
          background: accentColor, color: '#fff', border: 'none',
          padding: '9px 20px', borderRadius: 25, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: \`0 4px 14px \${accentColor}40\`, transition: 'all 0.15s',
        }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'}
           onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}>
          Accept All
        </button>
      </div>
    </div>
  );
}
`,


"/components/sections/SocialWall.tsx": `import React from 'react';
interface SocialPost { image?: string; caption?: string; likes?: number; platform?: string; url?: string; }
interface SocialWallProps { title?: string; subtitle?: string; posts?: SocialPost[]; handle?: string; platform?: string; accentColor?: string; }
export default function SocialWall({ title = 'Follow Along', subtitle, posts = [], handle, platform = 'Instagram', accentColor = '#6366f1' }: SocialWallProps) {
  const [ref, setRef] = React.useState<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(ref); return () => obs.disconnect();
  }, [ref]);
  const defaultPosts: SocialPost[] = Array(9).fill(null).map((_, i) => ({ image: \`https://source.unsplash.com/400x400/?lifestyle,\${i}\`, likes: Math.floor(Math.random() * 500) + 50 }));
  const displayPosts = posts.length > 0 ? posts : defaultPosts;
  return (
    <section ref={setRef as any} style={{ padding: '80px 40px', background: 'var(--bg)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {(title || subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {title && <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: 'var(--fg)', marginBottom: 8 }}>{title}</h2>}
            {handle && <p style={{ color: accentColor, fontWeight: 600, fontSize: 16 }}>@{handle}</p>}
            {subtitle && <p style={{ color: 'var(--fg)', opacity: 0.7 }}>{subtitle}</p>}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 4 }}>
          {displayPosts.slice(0, 9).map((post, i) => (
            <a key={i} href={post.url || '#'} target={post.url ? '_blank' : undefined} rel="noopener noreferrer" style={{ position: 'relative', paddingTop: '100%', display: 'block', overflow: 'hidden', borderRadius: 4 }}>
              {post.image ? (
                <img src={post.image} alt={post.caption || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = ''}
                  onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: \`linear-gradient(135deg, \${accentColor}30, \${accentColor}10)\` }} />
              )}
              {post.likes && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', color: '#fff', fontWeight: 700, opacity: 0, fontSize: 15 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.5)'; (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'; (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
                  ♥ {post.likes}
                </div>
              )}
            </a>
          ))}
        </div>
        {handle && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href={\`https://www.instagram.com/\${handle}\`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: accentColor, color: '#fff', padding: '12px 28px', borderRadius: 30, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              Follow on {platform}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}`,

"LoginForm": `import { useState } from 'react';
export default function LoginForm({ accentColor = 'var(--primary)' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, width: '100%', maxWidth: 440 }}>
        <h2 style={{ color: 'var(--fg)', fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Welcome back</h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 32, fontSize: 15 }}>Sign in to your account to continue</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[{ icon: '🇬', label: 'Google' }, { icon: '🐙', label: 'GitHub' }].map(s => (
            <button key={s.label} style={{ flex: 1, padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--fg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>or email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        {[{ label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'you@example.com' },
          { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' }].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--fg)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
            <input value={f.value} onChange={e => f.setter(e.target.value)} type={f.type} placeholder={f.placeholder}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--fg)', fontSize: 14 }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember me
          </label>
          <a href="#" style={{ color: accentColor, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
        </div>
        <button style={{ width: '100%', padding: '12px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 14 }}>Don't have an account? <a href="#" style={{ color: accentColor, fontWeight: 600, textDecoration: 'none' }}>Sign up free</a></p>
      </div>
    </section>
  );
}`,

"RegisterForm": `import { useState } from 'react';
export default function RegisterForm({ accentColor = 'var(--primary)' }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
    { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
  ];
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, width: '100%', maxWidth: 480 }}>
        <h2 style={{ color: 'var(--fg)', fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Create your account</h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 32, fontSize: 15 }}>Start for free — no credit card required</p>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--fg)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
            <input value={form[f.key]} onChange={e => upd(f.key, e.target.value)} type={f.type} placeholder={f.placeholder}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer', color: 'var(--muted)', fontSize: 14 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
          I agree to the <a href="#" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
        </label>
        <button style={{ width: '100%', padding: '12px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Create Account</button>
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 14 }}>Already have an account? <a href="#" style={{ color: accentColor, fontWeight: 600, textDecoration: 'none' }}>Sign in</a></p>
      </div>
    </section>
  );
}`,

"CheckoutForm": `import { useState } from 'react';
export default function CheckoutForm({ accentColor = 'var(--primary)', items = [{ name: 'Premium Subscription', price: 29, qty: 1 }, { name: 'Setup Fee', price: 9, qty: 1 }] }) {
  const [step, setStep] = useState(0);
  const steps = ['Cart', 'Shipping', 'Payment'];
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 40 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= step ? accentColor : 'var(--border)', color: i <= step ? 'var(--primary-fg)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{i + 1}</div>
                <span style={{ color: i <= step ? 'var(--fg)' : 'var(--muted)', fontWeight: i === step ? 700 : 400, fontSize: 14 }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? accentColor : 'var(--border)', margin: '0 12px' }} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
            {step === 0 && (
              <div>
                <h3 style={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 24 }}>Your Cart</h3>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ color: 'var(--fg)', fontWeight: 600 }}>{item.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ color: 'var(--fg)', fontWeight: 700 }}>\${(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
            {step === 1 && (
              <div>
                <h3 style={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 24 }}>Shipping Address</h3>
                {[['Full Name', 'text'], ['Email', 'email'], ['Address', 'text'], ['City', 'text'], ['ZIP Code', 'text']].map(([lbl, typ]) => (
                  <div key={lbl} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: 'var(--fg)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{lbl}</label>
                    <input type={typ} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            )}
            {step === 2 && (
              <div>
                <h3 style={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 24 }}>Payment Details</h3>
                {[['Card Number', '4242 4242 4242 4242'], ['Cardholder Name', 'Jane Smith'], ['Expiry', 'MM/YY'], ['CVV', '•••']].map(([lbl, ph]) => (
                  <div key={lbl} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: 'var(--fg)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{lbl}</label>
                    <input placeholder={ph} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 24px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Back</button>}
              <button onClick={() => setStep(s => Math.min(s + 1, 2))} style={{ marginLeft: 'auto', padding: '10px 28px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                {step === 2 ? 'Place Order' : 'Continue →'}
              </button>
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, height: 'fit-content' }}>
            <h3 style={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)', fontSize: 14 }}>{item.name}</span>
                <span style={{ color: 'var(--fg)', fontSize: 14 }}>\${item.price}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--fg)', fontWeight: 700 }}>Total</span>
              <span style={{ color: accentColor, fontWeight: 800, fontSize: 18 }}>\${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,

"ProductDetail": `import { useState } from 'react';
export default function ProductDetail({ accentColor = 'var(--primary)', product = { name: 'Handcrafted Leather Wallet', price: 89, originalPrice: 120, rating: 4.8, reviews: 142, description: 'Premium full-grain leather. RFID blocking. 8 card slots, 2 cash compartments. Slim profile fits any pocket.', sizes: ['S','M','L'], colors: ['#1a1a1a','#8B4513','#2F4F4F'], images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'] } }) {
  const [img, setImg] = useState(0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <img src={product.images[img]} alt={product.name} style={{ width: '100%', height: 400, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            {product.images.map((src, i) => (
              <img key={i} src={src} alt="" onClick={() => setImg(i)} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: \`2px solid \${i === img ? accentColor : 'var(--border)'}\` }} />
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'inline-block', background: accentColor + '22', color: accentColor, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>In Stock</div>
          <h1 style={{ color: 'var(--fg)', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ color: '#f59e0b', fontSize: 18 }}>{'★'.repeat(Math.round(product.rating))}</span>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>{product.rating}</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>({product.reviews} reviews)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 28 }}>
            <span style={{ color: accentColor, fontSize: 32, fontWeight: 800 }}>\${product.price}</span>
            {product.originalPrice && <span style={{ color: 'var(--muted)', fontSize: 18, textDecoration: 'line-through' }}>\${product.originalPrice}</span>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'var(--fg)', fontWeight: 600, marginBottom: 10 }}>Color</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {product.colors.map((c, i) => (
                <div key={i} onClick={() => setColor(i)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: \`3px solid \${i === color ? accentColor : 'transparent'}\`, outline: '2px solid var(--border)' }} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <p style={{ color: 'var(--fg)', fontWeight: 600, marginBottom: 10 }}>Size</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {product.sizes.map(s => (
                <button key={s} onClick={() => setSize(s)} style={{ width: 48, height: 48, border: \`2px solid \${s === size ? accentColor : 'var(--border)'}\`, borderRadius: 8, background: s === size ? accentColor + '22' : 'var(--bg)', color: s === size ? accentColor : 'var(--fg)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '10px 16px', background: 'var(--bg)', border: 'none', cursor: 'pointer', color: 'var(--fg)', fontSize: 18 }}>−</button>
              <span style={{ padding: '10px 20px', color: 'var(--fg)', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ padding: '10px 16px', background: 'var(--bg)', border: 'none', cursor: 'pointer', color: 'var(--fg)', fontSize: 18 }}>+</button>
            </div>
            <button style={{ flex: 1, padding: '12px 24px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Add to Cart</button>
          </div>
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
            {['description', 'shipping', 'returns'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', border: 'none', background: 'none', color: t === tab ? accentColor : 'var(--muted)', fontWeight: t === tab ? 700 : 400, cursor: 'pointer', borderBottom: \`2px solid \${t === tab ? accentColor : 'transparent'}\`, textTransform: 'capitalize', fontSize: 14 }}>{t}</button>
            ))}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>
            {tab === 'description' && product.description}
            {tab === 'shipping' && 'Free shipping on orders over $50. Standard delivery 3-5 business days. Express 1-2 days available at checkout.'}
            {tab === 'returns' && '30-day hassle-free returns. Item must be unused and in original packaging. Free return label included.'}
          </p>
        </div>
      </div>
    </section>
  );
}`,

"JobListing": `export default function JobListing({ accentColor = 'var(--primary)', job = { title: 'Senior Frontend Engineer', company: 'TechCorp Inc.', location: 'San Francisco, CA (Hybrid)', salary: '$140,000 – $180,000', type: 'Full-time', posted: '2 days ago', requirements: ['5+ years React experience', 'TypeScript proficiency', 'Strong CSS/animation skills', 'Experience with Next.js', 'Team collaboration skills'], description: 'Join our growing product team to build world-class user interfaces for our SaaS platform serving 50,000+ businesses. You will own the frontend architecture and mentor junior developers.', benefits: ['Health, dental & vision', 'Unlimited PTO', '$5K annual learning budget', '401k 4% match', 'Remote-friendly'] } }) {
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{ color: 'var(--fg)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{job.title}</h1>
              <div style={{ color: 'var(--muted)', fontSize: 16, fontWeight: 600 }}>{job.company}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ color: '#22c55e', background: '#22c55e22', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>Actively Hiring</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Posted {job.posted}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            {[{ icon: '📍', text: job.location }, { icon: '💰', text: job.salary }, { icon: '⏱', text: job.type }].map(b => (
              <span key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px', fontSize: 14, color: 'var(--fg)' }}>{b.icon} {b.text}</span>
            ))}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>{job.description}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
            <div>
              <h3 style={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 14, fontSize: 16 }}>Requirements</h3>
              {job.requirements.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, color: 'var(--muted)', fontSize: 14 }}>
                  <span style={{ color: accentColor, fontWeight: 700 }}>✓</span> {r}
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 14, fontSize: 16 }}>Benefits</h3>
              {job.benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, color: 'var(--muted)', fontSize: 14 }}>
                  <span style={{ color: '#22c55e' }}>★</span> {b}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button style={{ flex: 1, padding: '14px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Apply Now →</button>
            <button style={{ padding: '14px 24px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Save Job</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,

"JobBoard": `import { useState } from 'react';
export default function JobBoard({ accentColor = 'var(--primary)', title = 'Open Positions' }) {
  const jobs = [
    { title: 'Senior React Engineer', company: 'Stripe', location: 'Remote', salary: '$160k–$200k', type: 'Full-time', dept: 'Engineering' },
    { title: 'Product Designer', company: 'Figma', location: 'San Francisco', salary: '$130k–$170k', type: 'Full-time', dept: 'Design' },
    { title: 'Growth Marketing Manager', company: 'Linear', location: 'New York', salary: '$110k–$140k', type: 'Full-time', dept: 'Marketing' },
    { title: 'Data Scientist', company: 'Vercel', location: 'Remote', salary: '$140k–$180k', type: 'Full-time', dept: 'Engineering' },
    { title: 'Customer Success Lead', company: 'Notion', location: 'Austin', salary: '$90k–$120k', type: 'Full-time', dept: 'Operations' },
  ];
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const depts = ['All', 'Engineering', 'Design', 'Marketing', 'Operations'];
  const filtered = jobs.filter(j => (dept === 'All' || j.dept === dept) && (j.title + j.company).toLowerCase().includes(search.toLowerCase()));
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ color: 'var(--fg)', fontSize: 36, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>{title}</h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 40 }}>Join our world-class team and build products people love</p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." style={{ flex: 1, minWidth: 200, padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--card)', color: 'var(--fg)', fontSize: 15, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {depts.map(d => <button key={d} onClick={() => setDept(d)} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 20, background: d === dept ? accentColor : 'var(--card)', color: d === dept ? 'var(--primary-fg)' : 'var(--fg)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{d}</button>)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((job, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{job.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>{job.company} · {job.location} · {job.salary}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ background: accentColor + '22', color: accentColor, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{job.type}</span>
                <button style={{ padding: '8px 20px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 32, fontSize: 15 }}>Don't see a fit? <a href="#" style={{ color: accentColor, fontWeight: 600, textDecoration: 'none' }}>Send us your resume anyway →</a></p>
      </div>
    </section>
  );
}`,

"EventCard": `import { useState, useEffect } from 'react';
export default function EventCard({ accentColor = 'var(--primary)', event = { title: 'Future of AI Summit 2026', description: 'The premier conference for AI practitioners, founders, and researchers. 3 days of keynotes, workshops, and networking with 2,000+ attendees.', date: '2026-09-15T09:00:00', endDate: '2026-09-17T18:00:00', location: 'Moscone Center, San Francisco, CA', price: 299, originalPrice: 499, image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop', tags: ['AI', 'Technology', 'Networking'] } }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(event.date).getTime() - Date.now();
      if (diff <= 0) return;
      setCountdown({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event.date]);
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        <img src={event.image} alt={event.title} style={{ width: '100%', height: 280, objectFit: 'cover' }} />
        <div style={{ padding: 40 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {event.tags.map(t => <span key={t} style={{ background: accentColor + '22', color: accentColor, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{t}</span>)}
          </div>
          <h2 style={{ color: 'var(--fg)', fontSize: 30, fontWeight: 800, marginBottom: 16 }}>{event.title}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>{event.description}</p>
          <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
            {[{ icon: '📅', text: new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }, { icon: '📍', text: event.location }, { icon: '🎟', text: \`\${event.price} — Save \${event.originalPrice - event.price}\` }].map(d => (
              <div key={d.icon} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <span style={{ color: 'var(--fg)', fontSize: 14 }}>{d.text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>EVENT STARTS IN</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {Object.entries(countdown).map(([unit, val]) => (
                <div key={unit} style={{ textAlign: 'center' }}>
                  <div style={{ color: accentColor, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{String(val).padStart(2, '0')}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', marginTop: 4 }}>{unit}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button style={{ flex: 1, padding: '14px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Get Tickets — \${event.price}</button>
            <button style={{ padding: '14px 20px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, cursor: 'pointer' }}>♡ Save</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,

"CourseCard": `export default function CourseCard({ accentColor = 'var(--primary)', courses = [{ title: 'Complete React & Next.js Bootcamp', instructor: 'Sarah Chen', instructorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1ea?w=100&h=100&fit=crop', rating: 4.9, students: 18420, price: 89, originalPrice: 199, image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=220&fit=crop', badge: 'Bestseller', category: 'Development', duration: '42 hours', lessons: 187 }, { title: 'UI/UX Design Masterclass 2026', instructor: 'Marcus Rivera', instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', rating: 4.8, students: 9810, price: 79, originalPrice: 159, image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=220&fit=crop', badge: 'Hot', category: 'Design', duration: '28 hours', lessons: 124 }, { title: 'Python for Data Science & ML', instructor: 'Aisha Patel', instructorAvatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop', rating: 4.7, students: 23100, price: 94, originalPrice: 189, image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=220&fit=crop', badge: 'New', category: 'Data Science', duration: '56 hours', lessons: 220 }] }) {
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <h2 style={{ color: 'var(--fg)', fontSize: 36, fontWeight: 800, marginBottom: 40, textAlign: 'center' }}>Featured Courses</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, maxWidth: 1100, margin: '0 auto' }}>
        {courses.map((c, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img src={c.image} alt={c.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: 12, left: 12, background: c.badge === 'Bestseller' ? '#f59e0b' : c.badge === 'Hot' ? '#ef4444' : accentColor, color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{c.badge}</span>
            </div>
            <div style={{ padding: 20 }}>
              <span style={{ background: accentColor + '22', color: accentColor, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{c.category}</span>
              <h3 style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 17, margin: '10px 0 8px', lineHeight: 1.4 }}>{c.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <img src={c.instructorAvatar} alt={c.instructor} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{c.instructor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: '#f59e0b', fontSize: 16 }}>{'★'.repeat(5)}</span>
                <span style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 14 }}>{c.rating}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>({c.students.toLocaleString()} students)</span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>{c.duration} · {c.lessons} lessons</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: accentColor, fontSize: 22, fontWeight: 800 }}>\${c.price}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 15, textDecoration: 'line-through', marginLeft: 8 }}>\${c.originalPrice}</span>
                </div>
                <button style={{ padding: '8px 20px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Enroll</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}`,

"ProfileCard": `export default function ProfileCard({ accentColor = 'var(--primary)', profile = { name: 'Dr. Elena Martinez', title: 'Chief Design Officer', company: 'Vercel', bio: 'Building the future of web tooling. 15 years in product design. Speaker at Config, Design+Code, and Awwwards. Previously at Airbnb and Apple.', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop', coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=200&fit=crop', stats: [{ label: 'Projects', value: '142' }, { label: 'Followers', value: '28.4K' }, { label: 'Following', value: '312' }], socials: [{ platform: 'Twitter', icon: '𝕏', href: '#' }, { platform: 'LinkedIn', icon: 'in', href: '#' }, { platform: 'GitHub', icon: '⌥', href: '#' }, { platform: 'Dribbble', icon: '◉', href: '#' }], skills: ['Product Design', 'Figma', 'React', 'Design Systems', 'User Research'] } }) {
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', maxWidth: 500, width: '100%' }}>
        <div style={{ position: 'relative', height: 140, background: \`url(\${profile.coverImage}) center/cover\` }}>
          <img src={profile.avatar} alt={profile.name} style={{ position: 'absolute', bottom: -50, left: 32, width: 100, height: 100, borderRadius: '50%', border: '4px solid var(--card)', objectFit: 'cover' }} />
        </div>
        <div style={{ padding: '60px 32px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ color: 'var(--fg)', fontSize: 22, fontWeight: 800 }}>{profile.name}</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>{profile.title} at {profile.company}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {profile.socials.map(s => (
                <a key={s.platform} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>{s.icon}</a>
              ))}
            </div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{profile.bio}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {profile.skills.map(skill => <span key={skill} style={{ background: accentColor + '18', color: accentColor, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{skill}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg)', borderRadius: 12, padding: '16px 0', marginBottom: 28 }}>
            {profile.stats.map((s, i) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', borderRight: i < profile.stats.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ color: 'var(--fg)', fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ flex: 1, padding: '12px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Follow</button>
            <button style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Message</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,

"CaseStudy": `export default function CaseStudy({ accentColor = 'var(--primary)', studies = [{ client: 'Meridian Health', industry: 'Healthcare Technology', logo: '⚕', challenge: 'Meridian\'s patient scheduling system was causing 35% appointment no-shows and staff were spending 6+ hours daily on manual reminders and rescheduling.', solution: 'We redesigned the scheduling flow with intelligent SMS reminders, one-click rescheduling, and a real-time availability engine that synced across 12 clinic locations.', results: [{ metric: '68%', label: 'Reduction in no-shows' }, { metric: '4.2hrs', label: 'Daily staff time saved' }, { metric: '$1.2M', label: 'Annual revenue recovered' }, { metric: '9.4/10', label: 'Patient satisfaction' }], quote: 'The ROI was visible within the first month. Our staff finally have time to focus on patients instead of administration.', author: 'Dr. Patricia Walsh, CMO' }] }) {
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      {studies.map((study, i) => (
        <div key={i} style={{ maxWidth: 1000, margin: '0 auto 60px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ background: accentColor, padding: '32px 40px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 40 }}>{study.logo}</span>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Case Study</p>
              <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>{study.client}</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: '4px 0 0' }}>{study.industry}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {[{ heading: '01 — Challenge', text: study.challenge, color: 'var(--bg)' }, { heading: '02 — Solution', text: study.solution, color: 'var(--card)' }, { heading: '03 — Outcome', text: 'Our tailored approach delivered measurable results within 30 days of launch, exceeding client expectations across all KPIs.', color: 'var(--bg)' }].map((col, ci) => (
              <div key={ci} style={{ padding: '32px', background: col.color, borderRight: ci < 2 ? '1px solid var(--border)' : 'none' }}>
                <h3 style={{ color: accentColor, fontSize: 14, fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>{col.heading}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.8 }}>{col.text}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: '32px 40px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
            <h3 style={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 24, fontSize: 18 }}>Results at a Glance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
              {study.results.map((r, ri) => (
                <div key={ri} style={{ background: 'var(--bg)', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
                  <div style={{ color: accentColor, fontSize: 32, fontWeight: 800 }}>{r.metric}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{r.label}</div>
                </div>
              ))}
            </div>
            <blockquote style={{ borderLeft: \`4px solid \${accentColor}\`, paddingLeft: 20, margin: 0 }}>
              <p style={{ color: 'var(--fg)', fontSize: 16, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 8 }}>"{study.quote}"</p>
              <cite style={{ color: 'var(--muted)', fontSize: 14, fontStyle: 'normal', fontWeight: 600 }}>— {study.author}</cite>
            </blockquote>
          </div>
        </div>
      ))}
    </section>
  );
}`,

"PropertyListing": `import { useState } from 'react';
export default function PropertyListing({ accentColor = 'var(--primary)', property = { address: '2847 Pacific Heights Blvd', city: 'San Francisco, CA 94115', price: 3200000, beds: 4, baths: 3.5, sqft: 2840, type: 'Single Family Home', status: 'For Sale', yearBuilt: 2019, parking: 2, description: 'Stunning Pacific Heights masterpiece with panoramic bay views. Chef\'s kitchen with Carrara marble, Miele appliances. Primary suite with spa bath. Landscaped garden and rooftop deck.', features: ['Bay Views', 'Chef\'s Kitchen', 'Rooftop Deck', 'Smart Home', 'Wine Cellar', 'Home Theater'], images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=500&fit=crop'], agent: { name: 'Alexandra Chen', title: 'Senior Listing Agent', phone: '(415) 555-0192', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop' } } }) {
  const [photo, setPhoto] = useState(0);
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <img src={property.images[photo]} alt={property.address} style={{ width: '100%', height: 460, objectFit: 'cover', borderRadius: 16 }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8 }}>
            {property.images.map((_, i) => <button key={i} onClick={() => setPhoto(i)} style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', background: i === photo ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }} />)}
          </div>
          <span style={{ position: 'absolute', top: 16, right: 16, background: '#22c55e', color: '#fff', padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>{property.status}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h1 style={{ color: 'var(--fg)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{property.address}</h1>
                <p style={{ color: 'var(--muted)', fontSize: 16 }}>{property.city}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: accentColor, fontSize: 30, fontWeight: 800 }}>\${property.price.toLocaleString()}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>\${Math.round(property.price / property.sqft).toLocaleString()}/sqft</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap' }}>
              {[{ icon: '🛏', value: property.beds, label: 'Beds' }, { icon: '🚿', value: property.baths, label: 'Baths' }, { icon: '📐', value: property.sqft.toLocaleString(), label: 'Sq Ft' }, { icon: '🚗', value: property.parking, label: 'Parking' }, { icon: '📅', value: property.yearBuilt, label: 'Built' }].map(s => (
                <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>{property.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {property.features.map(f => <span key={f} style={{ background: accentColor + '18', color: accentColor, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{f}</span>)}
            </div>
          </div>
          <div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center' }}>
                <img src={property.agent.image} alt={property.agent.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ color: 'var(--fg)', fontWeight: 700 }}>{property.agent.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{property.agent.title}</div>
                </div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>📞 <a href={\`tel:\${property.agent.phone.replace(/[^0-9+]/g,'')}\`} style={{ color: 'inherit', textDecoration: 'none' }}>{property.agent.phone}</a></div>
              <button style={{ width: '100%', padding: '12px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Schedule a Tour</button>
              <button style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Contact Agent</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,

"RestaurantMenu": `import { useState } from 'react';
export default function RestaurantMenu({ accentColor = 'var(--primary)', title = 'Our Menu', categories = [{ name: 'Starters', items: [{ name: 'Burrata & Heirloom Tomatoes', desc: 'Creamy burrata, heirloom tomatoes, aged balsamic, basil oil, sourdough crisps', price: 18, tags: ['V', 'GF'], image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=250&fit=crop' }, { name: 'Crispy Calamari', desc: 'Lightly floured, flash-fried, preserved lemon aioli, smoked paprika', price: 16, tags: ['GF'], image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=250&fit=crop' }, { name: 'Charcuterie Board', desc: 'Rotating selection of cured meats, artisan cheeses, house pickles, honeycomb', price: 28, tags: ['GF'], image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop' }] }, { name: 'Mains', items: [{ name: 'Pan-Seared Branzino', desc: 'Mediterranean sea bass, saffron risotto, roasted cherry tomatoes, caper butter', price: 38, tags: ['GF'], image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=250&fit=crop' }, { name: 'Wagyu Short Rib', desc: '72-hour braised, truffle polenta, roasted bone marrow, gremolata', price: 52, tags: ['Signature'], image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop' }] }, { name: 'Desserts', items: [{ name: 'Valrhona Chocolate Fondant', desc: 'Warm dark chocolate center, vanilla bean gelato, cocoa tuile', price: 14, tags: ['V'], image: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&h=250&fit=crop' }] }] }) {
  const [active, setActive] = useState(0);
  const tagColors = { V: '#22c55e', GF: '#3b82f6', Spicy: '#ef4444', Signature: accentColor };
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ color: 'var(--fg)', fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>{title}</h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 40 }}>Seasonal ingredients. Crafted with care.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
          {categories.map((cat, i) => (
            <button key={cat.name} onClick={() => setActive(i)} style={{ padding: '10px 28px', border: \`2px solid \${i === active ? accentColor : 'var(--border)'}\`, borderRadius: 30, background: i === active ? accentColor : 'var(--bg)', color: i === active ? 'var(--primary-fg)' : 'var(--fg)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{cat.name}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 28 }}>
          {categories[active].items.map((item, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <img src={item.image} alt={item.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {item.tags.map(t => <span key={t} style={{ background: (tagColors[t] || accentColor) + '22', color: tagColors[t] || accentColor, padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{t}</span>)}
                </div>
                <h3 style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{item.name}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: accentColor, fontSize: 22, fontWeight: 800 }}>\${item.price}</span>
                  <button style={{ padding: '8px 18px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add to Order</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"StepProcess": `export default function StepProcess({ accentColor = 'var(--primary)', title = 'How It Works', subtitle = 'Get started in minutes — no technical skills required', steps = [{ icon: '📝', title: 'Describe Your Vision', desc: 'Tell us what you need in plain English. Our AI understands context, industry, and goals to craft the perfect brief.' }, { icon: '⚡', title: 'AI Builds Instantly', desc: 'Watch your website come to life in under 60 seconds. Full responsive design, real content, professional photography.' }, { icon: '🎨', title: 'Customize & Refine', desc: 'Tweak colors, copy, layout with simple prompts. Our smart editor understands "make it more bold" or "add a pricing section".' }, { icon: '🚀', title: 'Publish Worldwide', desc: 'One click to go live on a global CDN. Custom domain, SSL, analytics — everything included at no extra cost.' }] }) {
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ color: 'var(--fg)', fontSize: 40, fontWeight: 800, marginBottom: 12 }}>{title}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 520, margin: '0 auto' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 36, left: '12.5%', right: '12.5%', height: 2, background: 'var(--border)', zIndex: 0 }} />
          {steps.map((step, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 20px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--card)', border: \`3px solid \${accentColor}\`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>{step.icon}</div>
              <div style={{ background: accentColor, color: 'var(--primary-fg)', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, margin: '-10px auto 16px', position: 'relative' }}>{i + 1}</div>
              <h3 style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{step.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <button style={{ padding: '16px 44px', background: accentColor, color: 'var(--primary-fg)', border: 'none', borderRadius: 50, fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>Start Building Free →</button>
        </div>
      </div>
    </section>
  );
}`,

"PricingComparison": `export default function PricingComparison({ accentColor = 'var(--primary)', title = 'Compare Plans', features = [{ name: 'Projects', free: '1', pro: '10', enterprise: 'Unlimited' }, { name: 'AI Builds per month', free: '5', pro: '100', enterprise: 'Unlimited' }, { name: 'Custom domain', free: false, pro: true, enterprise: true }, { name: 'Remove branding', free: false, pro: true, enterprise: true }, { name: 'Team members', free: '1', pro: '5', enterprise: 'Unlimited' }, { name: 'Analytics', free: 'Basic', pro: 'Advanced', enterprise: 'Enterprise' }, { name: 'Priority support', free: false, pro: true, enterprise: true }, { name: 'API access', free: false, pro: false, enterprise: true }, { name: 'White-label', free: false, pro: false, enterprise: true }, { name: 'SLA', free: false, pro: '99.9%', enterprise: '99.99%' }], plans = [{ name: 'Free', price: '$0', period: 'forever', popular: false }, { name: 'Pro', price: '$29', period: '/month', popular: true }, { name: 'Enterprise', price: 'Custom', period: '', popular: false }] }) {
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ color: 'var(--fg)', fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>{title}</h2>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'var(--bg)' }}>
            <div style={{ padding: '20px 24px' }} />
            {plans.map(plan => (
              <div key={plan.name} style={{ padding: '24px 16px', textAlign: 'center', background: plan.popular ? accentColor + '12' : 'transparent', borderBottom: plan.popular ? \`3px solid \${accentColor}\` : '3px solid transparent' }}>
                {plan.popular && <div style={{ background: accentColor, color: 'var(--primary-fg)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'inline-block' }}>POPULAR</div>}
                <div style={{ color: 'var(--fg)', fontWeight: 800, fontSize: 17 }}>{plan.name}</div>
                <div style={{ color: plan.popular ? accentColor : 'var(--fg)', fontWeight: 800, fontSize: 24 }}>{plan.price}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{plan.period}</div>
              </div>
            ))}
          </div>
          {features.map((feat, i) => (
            <div key={feat.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)' }}>
              <div style={{ padding: '14px 24px', color: 'var(--fg)', fontSize: 14 }}>{feat.name}</div>
              {[feat.free, feat.pro, feat.enterprise].map((val, vi) => (
                <div key={vi} style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: val === true ? '#22c55e' : val === false ? 'var(--border)' : 'var(--muted)', fontWeight: typeof val === 'string' ? 600 : 400 }}>
                  {val === true ? '✓' : val === false ? '✕' : val}
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderTop: '1px solid var(--border)', padding: '20px 0', background: 'var(--card)' }}>
            <div />
            {plans.map(plan => (
              <div key={plan.name} style={{ padding: '0 16px', textAlign: 'center' }}>
                <button style={{ width: '100%', padding: '10px', background: plan.popular ? accentColor : 'var(--bg)', color: plan.popular ? 'var(--primary-fg)' : 'var(--fg)', border: \`1px solid \${plan.popular ? accentColor : 'var(--border)'}\`, borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {plan.name === 'Enterprise' ? 'Contact Us' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,

"VideoEmbed": `import { useState } from 'react';
export default function VideoEmbed({ accentColor = 'var(--primary)', title = 'See It In Action', subtitle = 'Watch how teams build entire websites in under 60 seconds', videos = [{ videoId: 'dQw4w9WgXcQ', title: 'Build a Coffee Shop Website in 45 Seconds', duration: '0:45', thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop', views: '142K views' }, { videoId: 'dQw4w9WgXcQ', title: 'From Idea to Live Website — Full Walkthrough', duration: '3:24', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop', views: '89K views' }] }) {
  const [playing, setPlaying] = useState(null);
  const [active, setActive] = useState(0);
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ color: 'var(--fg)', fontSize: 40, fontWeight: 800, marginBottom: 12 }}>{title}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 18 }}>{subtitle}</p>
        </div>
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 20, cursor: 'pointer' }} onClick={() => setPlaying(videos[active].videoId)}>
          {playing === videos[active].videoId ? (
            <iframe src={\`https://www.youtube.com/embed/\${videos[active].videoId}?autoplay=1\`} style={{ width: '100%', height: 480, border: 'none' }} allow="autoplay" />
          ) : (
            <div style={{ position: 'relative' }}>
              <img src={videos[active].thumbnail} alt={videos[active].title} style={{ width: '100%', height: 480, objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, paddingLeft: 4 }}>▶</div>
              </div>
              <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{videos[active].duration}</div>
            </div>
          )}
        </div>
        <p style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{videos[active].title}</p>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>{videos[active].views}</p>
        {videos.length > 1 && (
          <div style={{ display: 'flex', gap: 16 }}>
            {videos.map((v, i) => (
              <div key={i} onClick={() => { setActive(i); setPlaying(null); }} style={{ flex: 1, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: \`2px solid \${i === active ? accentColor : 'var(--border)'}\` }}>
                <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                <div style={{ padding: '10px 12px', background: 'var(--card)' }}>
                  <p style={{ color: 'var(--fg)', fontSize: 13, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{v.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}`,

};

export const SECTION_COMPONENT_LIST = `
## Pre-built page sections (USE THESE to build pages — don't write layouts from scratch):
Import using: import Navbar from '/components/sections/Navbar';
(Use ABSOLUTE paths starting with / — NOT relative ./components):

- Navbar: <Navbar brand="Name" links={["Menu","Story","Contact"]} cta="Order Now" />
- Hero: <Hero tag="Est. 2018" title="Big headline" subtitle="Description" cta1={{text:"See menu"}} cta2={{text:"Find us"}} image="{{unsplash:coffee shop|1600x900}}" />
- Features: <Features tag="Why us" title="Heading" items={[{icon:"☕", title:"Feature", desc:"Description"}]} />
- MenuGrid: <MenuGrid title="Our Menu" items={[{name:"Espresso", price:"$3.50", desc:"Rich shot", category:"Coffee", badge:"Popular"}]} />
- SplitSection: <SplitSection tag="Our story" title="Heading" text="Paragraph..." image="{{unsplash:...|800x600}}" reverse={false} />
- Testimonials: <Testimonials title="What people say" items={[{quote:"Amazing!", name:"Sarah", role:"Regular", image:"{{unsplash:woman portrait|200x200}}"}]} />
- Contact: <Contact title="Get in touch" subtitle="We'd love to hear from you." items={[{icon:"📍", label:"Address", value:"123 Main St"},{icon:"📞", label:"Phone", value:"(555) 123-4567", href:"tel:5551234567"},{icon:"✉️", label:"Email", value:"hello@brand.com", href:"mailto:hello@brand.com"},{icon:"🕐", label:"Hours", value:"Mon–Fri 9am–6pm"}]} />
  → Has a styled contact form (name, email, message) built-in on the right + contact info on the left. DO NOT write your own form.
- Footer: <Footer logo="Name" tagline="Tagline" columns={[{heading:"Links",links:[{label:"About",href:"#"}]}]} email="hello@brand.com" socials={[{platform:"instagram",href:"#"}]} accentColor="var(--primary)" />
- DarkModeToggle: <DarkModeToggle position="fixed-bottom-right" />
- ShopGrid: <ShopGrid title="Shop" items={[{id:1, name:"Item", price:3.50, desc:"Desc", category:"Cat", badge:"Popular", image:"{{unsplash:product|400x300}}"}]} />
  → Built-in cart + checkout. Use instead of MenuGrid for ordering.
- PricingTable: <PricingTable title="Pricing" plans={[{name:"Pro", price:"$29", period:"mo", features:["Feature 1","Feature 2"], cta:"Get Started", popular:true}]} />
- FAQ: <FAQ title="FAQ" items={[{q:"Question?", a:"Answer here."}]} />
- CTA: <CTA title="Ready to start?" subtitle="Join thousands" cta={{text:"Get Started"}} image="{{unsplash:abstract|1600x600}}" />
- Gallery: <Gallery title="Gallery" images={[{src:"{{unsplash:photo|400x300}}", alt:"Photo"}]} /> → Lightbox on click
- Stats: <Stats items={[{value:"10K+", label:"Customers"}]} dark={false} />
- Team: <Team title="Our Team" members={[{name:"John", role:"CEO", image:"{{unsplash:man portrait|200x200}}"}]} />
- Newsletter: <Newsletter title="Stay Updated" subtitle="Get weekly tips" />
- Timeline: <Timeline title="Our Journey" events={[{year:"2020", title:"Founded", desc:"Started in a garage"}]} />
- LogoCloud: <LogoCloud title="Trusted by" logos={[{name:"Acme"},{name:"Globex"}]} />
- BlogGrid: <BlogGrid title="Blog" posts={[{title:"Post", excerpt:"...", image:"{{unsplash:blog|400x300}}", date:"Jun 2026", author:"Sarah"}]} />
- Tabs: <Tabs tabs={[{label:"Tab 1", content:"Content here"},{label:"Tab 2", content:"More content"}]} />
- Banner: <Banner text="Free shipping today!" cta="Shop now" />
- Booking: <Booking title="Reserve a Table" subtitle="Book online in seconds" fields={["name","email","date","time","guests","notes"]} cta="Confirm Reservation →" />
  → Fully styled reservation/booking form. Use for restaurants, spas, salons, services. NEVER write a custom booking form.

- ComingSoon: <ComingSoon title="Coming Soon" subtitle="We are launching something incredible." launchDate="2026-12-31" accentColor="var(--primary)" socials={[{platform:"instagram",href:"#"},{platform:"twitter",href:"#"}]} />
  → Full-page coming soon with live countdown timer, email capture form, and social links.
- MaintenanceMode: <MaintenanceMode title="We will Be Right Back" message="Scheduled maintenance in progress." returnTime="2:00 AM EST" email="support@brand.com" accentColor="var(--primary)" />
  → Full-page dark maintenance screen with animated progress bar.
- StickyContactBar: <StickyContactBar phone="(555) 123-4567" ctaText="Book Now" ctaHref="#booking" message="Limited availability this week!" accentColor="var(--primary)" />
  → Fixed bottom bar shown after 400px scroll. Dismissible. Mobile-optimized.
- PopupModal: <PopupModal title="Special Offer" description="Sign up and get 20% off your first order." ctaText="Claim Offer" ctaHref="#contact" delay={5000} accentColor="var(--primary)" />
  → Timed popup (default 5s). Cookie-based dismissal (7 days). Email capture.
- InteractiveMap: <InteractiveMap businessName="Our Studio" address="123 Main St, San Francisco, CA" phone="(555) 123-4567" hours={[{day:"Monday",time:"9am-6pm"},{day:"Sunday",time:"Closed"}]} accentColor="var(--primary)" />
  → Embedded Google Map + address + hours + Get Directions button.
- TestimonialsCarousel: <TestimonialsCarousel title="What Our Clients Say" items={[{name:"Sarah K.",role:"CEO",text:"Incredible!",rating:5,image:"{{unsplash:professional woman portrait|100x100}}"}]} accentColor="var(--primary)" />
  → Auto-advancing carousel with arrows, dots, pause-on-hover.
- ImageCompare: <ImageCompare title="See The Results" pairs={[{before:"{{unsplash:before dull|600x400}}",after:"{{unsplash:after bright|600x400}}",caption:"After one session"}]} accentColor="var(--primary)" />
  → Drag-slider before/after image comparison. Multiple pairs supported.
- VideoTestimonial: <VideoTestimonial title="Hear From Our Customers" videos={[{videoId:"dQw4w9WgXcQ",name:"Jane D.",role:"CEO, Acme Corp"}]} accentColor="var(--primary)" />
  → YouTube video cards with play button. Lightbox on click.
- AffiliatePartners: <AffiliatePartners title="As Featured In" subtitle="Trusted by industry leaders" partners={[{name:"Forbes",logo:"https://...",url:"#",tier:"gold"}]} accentColor="var(--primary)" />
  → Partner/sponsor logos with tier badges (gold/silver/bronze), grayscale-to-color hover.
- StatsCounter: <StatsCounter title="By The Numbers" stats={[{value:"10000",label:"Happy Customers",icon:"😊",suffix:"+"},{value:"4.9",label:"Rating",icon:"⭐",suffix:"★"}]} background="dark" accentColor="var(--primary)" />
  → Scroll-triggered count-up animation. background: "dark" | "light" | "accent".

## Auth & Forms:
- LoginForm: <LoginForm accentColor="var(--primary)" /> → Email/password login with Google+GitHub social buttons, remember me, forgot password.
- RegisterForm: <RegisterForm accentColor="var(--primary)" /> → Sign-up form with name, email, password, confirm password, terms checkbox.
- CheckoutForm: <CheckoutForm accentColor="var(--primary)" items={[{name:"Item",price:29,qty:1}]} /> → 3-step checkout wizard: cart → shipping → payment.

## Product & E-commerce:
- ProductDetail: <ProductDetail accentColor="var(--primary)" product={{name:"Product",price:89,originalPrice:120,rating:4.8,reviews:142,description:"...",sizes:["S","M","L"],colors:["#000"],images:["url1","url2","url3"]}} /> → Full product page: image gallery, variants, qty selector, Add to Cart, tabbed description.
- CourseCard: <CourseCard accentColor="var(--primary)" courses={[{title:"Course",instructor:"Name",instructorAvatar:"url",rating:4.9,students:1000,price:89,originalPrice:199,image:"url",badge:"Bestseller",category:"Dev",duration:"42 hours",lessons:180}]} /> → Course cards with rating, instructor, price, Enroll button.
- PricingComparison: <PricingComparison accentColor="var(--primary)" title="Compare Plans" features={[{name:"Feature",free:"1",pro:"10",enterprise:"Unlimited"}]} plans={[{name:"Free",price:"$0",period:"forever",popular:false},{name:"Pro",price:"$29",period:"/mo",popular:true},{name:"Enterprise",price:"Custom",period:"",popular:false}]} /> → Full feature matrix comparison table.

## Jobs & Careers:
- JobListing: <JobListing accentColor="var(--primary)" job={{title:"Senior Engineer",company:"Acme",location:"Remote",salary:"$140k–$180k",type:"Full-time",posted:"2 days ago",requirements:["5yrs experience"],description:"...",benefits:["Health insurance"]}} /> → Full job listing page with requirements, benefits, Apply Now button.
- JobBoard: <JobBoard accentColor="var(--primary)" title="Open Positions" /> → Searchable/filterable job listings board.

## Events & Media:
- EventCard: <EventCard accentColor="var(--primary)" event={{title:"Summit 2026",description:"...",date:"2026-09-15T09:00:00",location:"SF",price:299,originalPrice:499,image:"url",tags:["Tech"]}} /> → Full event card with live countdown timer, date, location, Get Tickets CTA.
- VideoEmbed: <VideoEmbed accentColor="var(--primary)" title="See It In Action" subtitle="..." videos={[{videoId:"youtubeId",title:"...",duration:"3:24",thumbnail:"url",views:"10K views"}]} /> → Video player with thumbnail+play overlay, playlist below.

## People & Teams:
- ProfileCard: <ProfileCard accentColor="var(--primary)" profile={{name:"Jane Smith",title:"CEO",company:"Acme",bio:"...",avatar:"url",coverImage:"url",stats:[{label:"Projects",value:"42"}],socials:[{platform:"Twitter",icon:"𝕏",href:"#"}],skills:["React","Design"]}} /> → Full social profile card with cover, avatar, stats, follow/message buttons.

## Properties & Restaurants:
- PropertyListing: <PropertyListing accentColor="var(--primary)" property={{address:"123 Main St",city:"San Francisco, CA",price:3200000,beds:4,baths:3.5,sqft:2840,type:"Single Family",status:"For Sale",yearBuilt:2019,parking:2,description:"...",features:["Views"],images:["url1","url2"],agent:{name:"Agent",title:"Listing Agent",phone:"(555) 555-0100",image:"url"}}} /> → Real estate listing with photo carousel, specs, agent card, Schedule Tour button.
- RestaurantMenu: <RestaurantMenu accentColor="var(--primary)" title="Our Menu" categories={[{name:"Starters",items:[{name:"Dish",desc:"...",price:18,tags:["V","GF"],image:"url"}]}]} /> → Tabbed menu with images, dietary tags (V/GF/Spicy), Add to Order button.

## Process & Case Studies:
- StepProcess: <StepProcess accentColor="var(--primary)" title="How It Works" subtitle="..." steps={[{icon:"📝",title:"Step 1",desc:"..."}]} /> → Numbered horizontal process steps with connector lines, icons, CTA button.
- CaseStudy: <CaseStudy accentColor="var(--primary)" studies={[{client:"Acme Corp",industry:"SaaS",logo:"🏢",challenge:"...",solution:"...",results:[{metric:"3x",label:"Growth"}],quote:"Great results.",author:"CEO, Acme"}]} /> → Challenge/Solution/Results 3-column layout with metrics and testimonial quote.

RULES:
- The AI just passes DATA as props — components handle all styling, layout, hover effects, and responsive behavior.
- ALWAYS prefer these sections over writing raw HTML. They are pre-styled and look professional.
- When user asks for "checkout", "cart", "ordering", "e-commerce" → use ShopGrid instead of MenuGrid.
- When editing: if the current code uses MenuGrid and user wants cart/checkout, REPLACE MenuGrid with ShopGrid.
- CRITICAL: ONLY import from this exact list. NEVER invent component names like CartDrawer, PizzaBuilder, OrderTracker, ProductCard, HeroSection, etc. If you need a feature not in this list, BUILD IT IN /App.tsx as a regular React component — do NOT import it from /components/sections/. Importing a non-existent component causes a fatal crash.`;
