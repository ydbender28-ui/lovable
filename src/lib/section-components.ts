// Pre-built page section components — injected into every Sandpack project
// The AI composes pages by picking sections and passing props (data only, no styling needed)

export const SECTION_COMPONENTS: Record<string, string> = {

"/components/sections/Navbar.tsx": `import React, { useState, useEffect } from 'react';
export default function Navbar({ brand, links, cta, ctaHref, showCart, onNavigate, cartCount: cartCountProp, onCartClick, accentColor }: { brand: string; links: any[]; cta?: string; ctaHref?: string; showCart?: boolean; onNavigate?: (page: string) => void; cartCount?: number; onCartClick?: () => void; accentColor?: string }) {
  const accent = accentColor || '#111';
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(cartCountProp ?? 0);
  const cartOpenerRef = React.useRef<(() => void) | null>(null);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 10); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => { const h = (e: Event) => { const d = (e as CustomEvent).detail; setCartCount(d.count); if (d.open) cartOpenerRef.current = d.open; }; window.addEventListener('cartupdate', h); return () => window.removeEventListener('cartupdate', h); }, []);
  const handleCartClick = () => { if (onCartClick) onCartClick(); else if (cartOpenerRef.current) cartOpenerRef.current(); else window.dispatchEvent(new CustomEvent('carttrigger', { detail: 'open' })); };
  const safeLinks = (Array.isArray(links) ? links : []).map(l => typeof l === 'string' ? l : (l?.label || l?.name || l?.text || String(l)));
  const handleClick = (l: string) => (e: React.MouseEvent) => {
    if (onNavigate) { e.preventDefault(); onNavigate(String(l).toLowerCase()); return; }
    const slug = String(l).toLowerCase().replace(/\s+/g, '-');
    // Try id match (exact, then no-hyphens, then common aliases)
    const aliases: Record<string,string> = { services:'services', about:'about', reviews:'reviews', menu:'menu', booking:'booking', book:'booking', reserve:'booking', reservations:'booking', contact:'contact', gallery:'gallery', team:'team', pricing:'pricing', plans:'pricing', faq:'faq', location:'location', directions:'location', hours:'hours', results:'results', portfolio:'portfolio', shop:'shop', work:'portfolio', process:'process', features:'features', stats:'stats', video:'video', events:'events', partners:'partners', blog:'blog', download:'download', offer:'offer' };
    let el: HTMLElement | null = document.getElementById(slug) || document.getElementById(slug.replace(/-/g,'')) || document.getElementById(aliases[slug] || slug);
    // Fallback: find a section whose h2/h3 text contains the link text
    if (!el) {
      const secs = document.querySelectorAll('section, [id]');
      for (const s of secs) {
        const h = s.querySelector('h1,h2,h3');
        if (h && h.textContent && h.textContent.toLowerCase().includes(String(l).toLowerCase())) { el = s as HTMLElement; break; }
      }
    }
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  return (
    <nav style={{ position:'sticky', top:0, zIndex:100, background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f0f0f0', padding:'0 40px', transition:'background 0.2s' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <a href="#" onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate('home'); } : undefined} style={{ fontSize:20, fontWeight:800, color:'#111', textDecoration:'none', letterSpacing:'-0.02em' }}>{brand}</a>
        <div style={{ display:'flex', gap:28, alignItems:'center' }}>
          {safeLinks.map(l => <a key={String(l)} href={\`#\${String(l).toLowerCase().replace(/\s+/g,'-')}\`} onClick={handleClick(String(l))} style={{ fontSize:14, color:'#666', textDecoration:'none', fontWeight:500, cursor:'pointer', transition:'color 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.color='#111'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.color='#666'}>{String(l)}</a>)}
          {cta && <a href={ctaHref||'#contact'} onClick={ctaHref?undefined:handleClick('contact')} style={{ background:accent, color:'#fff', padding:'10px 24px', borderRadius:50, fontSize:14, fontWeight:700, textDecoration:'none', cursor:'pointer', transition:'opacity 0.2s', letterSpacing:'-0.01em' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>{cta}</a>}
          {showCart && <button onClick={handleCartClick} style={{ position:'relative', background:'none', border:'1.5px solid #e5e5e5', padding:'8px 14px', borderRadius:50, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:600, color:'#111', transition:'border-color 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.borderColor='#111'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor='#e5e5e5'}>
            🛒 {cartCount > 0 && <span style={{ background:accent, color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{cartCount}</span>}
          </button>}
        </div>
      </div>
    </nav>
  );
}`,

"/components/sections/Hero.tsx": `import React from 'react';
export default function Hero({ tag, title, subtitle, cta1, cta2, image }: { tag?: string; title: string; subtitle: string; cta1?: { text: string; href?: string }; cta2?: { text: string; href?: string }; image: string }) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{ position:'relative', minHeight:'65vh', display:'flex', alignItems:'center', overflow:'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <img src={image} alt={title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))' }} />
      <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'80px 40px', color:'#fff' }}>
        {tag && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:16, opacity:0.8 }}>{tag}</p>}
        <h1 style={{ fontSize:'clamp(36px, 6vw, 72px)', fontWeight:800, lineHeight:1.05, maxWidth:700, letterSpacing:'-0.03em' }}>{title}</h1>
        <p style={{ fontSize:18, lineHeight:1.6, maxWidth:500, marginTop:24, opacity:0.85 }}>{subtitle}</p>
        <div style={{ display:'flex', gap:16, marginTop:40, flexWrap:'wrap' }}>
          {cta1 && <a href={cta1.href||'#'} style={{ background:'var(--accent, #c2410c)', color:'#fff', padding:'14px 32px', borderRadius:50, fontSize:15, fontWeight:600, textDecoration:'none', transition:'opacity 0.2s' }} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{cta1.text}</a>}
          {cta2 && <a href={cta2.href||'#'} style={{ border:'1px solid rgba(255,255,255,0.4)', color:'#fff', padding:'14px 32px', borderRadius:50, fontSize:15, fontWeight:600, textDecoration:'none', transition:'background 0.2s' }} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{cta2.text}</a>}
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
  return (
    <section ref={ref as any} style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
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
            <button key={c} onClick={() => setActive(c)} style={{ padding:'8px 20px', borderRadius:50, border: active===c ? 'none' : '1.5px solid #e5e5e5', background: active===c ? accent : 'transparent', color: active===c ? '#fff' : '#666', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.18s', letterSpacing:'0.01em' }}>{c}</button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:24 }}>
          {filtered.map((item, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', transition:'transform 0.2s,box-shadow 0.2s' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 16px 40px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'}}>
              {item.image && <div style={{ position:'relative' }}><img src={item.image} alt={item.name} style={{ width:'100%', height:210, objectFit:'cover', display:'block' }} />{item.badge && <span style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:50, letterSpacing:'0.05em', textTransform:'uppercase' }}>{item.badge}</span>}</div>}
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
              <button onClick={() => setCartOpen(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:50, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#666', transition:'background 0.15s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#eee'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='#f5f5f5'}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
              {cart.length === 0 && <div style={{ textAlign:'center', padding:'60px 0', color:'#ccc' }}><div style={{ fontSize:48, marginBottom:12 }}>🛍️</div><p style={{ fontSize:15, fontWeight:500 }}>Your cart is empty</p></div>}
              {cart.map((c, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid #f5f5f5' }}>
                  {c.item.image && <img src={c.item.image} alt={c.item.name} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', flexShrink:0 }} />}
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

"/components/sections/Testimonials.tsx": `import React from 'react';
type Testimonial = { quote: string; name: string; role: string; image?: string };
export default function Testimonials({ title, items }: { title: string; items: Testimonial[] }) {
  const safeItems = (items || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:60 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:32 }}>
        {safeItems.map((t, i) => (
          <div key={i} style={{ background:'#faf9f7', borderRadius:16, padding:32, transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
            <p style={{ fontSize:16, lineHeight:1.7, color:'#333', fontStyle:'italic', marginBottom:24 }}>"{t.quote}"</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {t.image && <img src={t.image} alt={t.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />}
              <div>
                <p style={{ fontWeight:600, fontSize:15 }}>{t.name}</p>
                <p style={{ fontSize:13, color:'#888' }}>{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/Contact.tsx": `import React, { useState } from 'react';
type ContactInfo = { label: string; value: string; href?: string; icon?: string };
export default function Contact({ title, subtitle, items }: { title: string; subtitle?: string; items: ContactInfo[] }) {
  const safeItems = (items || []).filter(Boolean);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const accent = 'var(--accent, #c2410c)';
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fafafa', boxSizing: 'border-box', transition: 'border-color 0.2s' };
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} id="contact" style={{ padding: '100px 40px', background: '#fff', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</h2>
        {subtitle && <p style={{ color: '#666', fontSize: 16, marginBottom: 56 }}>{subtitle}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'start' }}>
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
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Your Name</label>
                    <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Jane Smith" style={inputStyle} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Email Address</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="jane@example.com" style={inputStyle} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} placeholder="Tell us how we can help..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                </div>
                <button onClick={() => { if (form.name && form.email) setSent(true); }} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 50, padding: '14px 36px', fontSize: 15, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', transition: 'opacity 0.2s' }} onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity='0.85'} onMouseOut={e => (e.currentTarget as HTMLElement).style.opacity='1'} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>Send Message →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Footer.tsx": `import React from 'react';
export default function Footer({ brand, tagline, links, year }: { brand: string; tagline?: string; links?: string[]; year?: number }) {
  const y = year || new Date().getFullYear();
  const safeLinks = (links || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <footer ref={ref as any} style={{ borderTop:'1px solid #eee', padding:'48px 40px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24 }}>
        <div>
          <p style={{ fontWeight:700, fontSize:16 }}>{brand}</p>
          {tagline && <p style={{ fontSize:14, color:'#888', marginTop:4 }}>{tagline}</p>}
        </div>
        {safeLinks.length > 0 && (
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {safeLinks.map((l, i) => (
              <a key={i} href={\`#\${String(l).toLowerCase().replace(/\\s+/g,'-')}\`} style={{ fontSize:14, color:'#888', textDecoration:'none', transition:'color 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.color='#111'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.color='#888'}>{l}</a>
            ))}
          </div>
        )}
        <p style={{ fontSize:13, color:'#999' }}>© {y} {brand}. All rights reserved.</p>
      </div>
    </footer>
  );
}`,

"/components/sections/SplitSection.tsx": `import React from 'react';
export default function SplitSection({ tag, title, text, image, reverse }: { tag?: string; title: string; text: string; image: string; reverse?: boolean }) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{ maxWidth:1200, margin:'0 auto', padding:'100px 40px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center', direction: reverse ? 'rtl' : 'ltr', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ direction:'ltr' }}>
        {tag && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', color:'var(--accent, #c2410c)', marginBottom:12 }}>{tag}</p>}
        <h2 style={{ fontSize:36, fontWeight:700, lineHeight:1.15, letterSpacing:'-0.02em', marginBottom:20 }}>{title}</h2>
        <p style={{ fontSize:17, lineHeight:1.7, color:'#555' }}>{text}</p>
      </div>
      <div style={{ borderRadius:16, overflow:'hidden', direction:'ltr' }}>
        <img src={image} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
      </div>
    </section>
  );
}`,

"/components/sections/ShopGrid.tsx": `import React, { useState } from 'react';
type Product = { id: number; name: string; price: number; desc: string; category: string; badge?: string; image?: string };
type CartItem = Product & { qty: number };

export default function ShopGrid({ title, subtitle, items, onCheckout }: { title: string; subtitle?: string; items: Product[]; onCheckout?: (items: CartItem[]) => void }) {
  const safeItems = (items || []).filter(Boolean) as Product[];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const cats = ['All', ...new Set(safeItems.map(i => i.category))];
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? safeItems : safeItems.filter(i => i.category === active);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (item: Product) => {
    setCart(prev => {
      const found = prev.find(c => c.id === item.id);
      if (found) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  return (
    <>
      <section id="menu" style={{ padding:'100px 40px', background:'#faf9f7' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40 }}>
            <div>
              <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em' }}>{title}</h2>
              {subtitle && <p style={{ color:'#666', fontSize:16, marginTop:8 }}>{subtitle}</p>}
            </div>
            <button onClick={() => setShowCart(true)} style={{ position:'relative', background:'#111', color:'#fff', border:'none', padding:'12px 24px', borderRadius:50, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Cart {cartCount > 0 && <span style={{ position:'absolute', top:-8, right:-8, background:'var(--accent, #c2410c)', color:'#fff', width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{cartCount}</span>}
            </button>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap' }}>
            {cats.map(c => <button key={c} onClick={() => setActive(c)} style={{ padding:'8px 20px', borderRadius:50, border:active===c?'none':'1px solid #ddd', background:active===c?'var(--accent, #c2410c)':'#fff', color:active===c?'#fff':'#555', fontSize:14, cursor:'pointer' }}>{c}</button>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:24 }}>
            {filtered.map(item => (
              <div key={item.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #eee', overflow:'hidden', transition:'transform 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-4px)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
                {item.image && <img src={item.image} alt={item.name} style={{ width:'100%', height:200, objectFit:'cover' }} />}
                <div style={{ padding:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <h3 style={{ fontSize:17, fontWeight:600 }}>{item.name}</h3>
                    <span style={{ fontSize:17, fontWeight:700 }}>\${item.price.toFixed(2)}</span>
                  </div>
                  {item.badge && <span style={{ fontSize:11, background:'var(--accent,#c2410c)', color:'#fff', padding:'2px 8px', borderRadius:50, fontWeight:600, display:'inline-block', marginTop:6 }}>{item.badge}</span>}
                  <p style={{ fontSize:14, color:'#888', marginTop:8 }}>{item.desc}</p>
                  <button onClick={() => addToCart(item)} style={{ marginTop:16, width:'100%', background:'#111', color:'#fff', border:'none', padding:'12px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', transition:'background 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#333'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='#111'}>Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showCart && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <div onClick={() => setShowCart(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'100%', maxWidth:420, background:'#fff', boxShadow:'-8px 0 30px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'24px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontSize:24, fontWeight:700 }}>Your Cart</h2>
              <button onClick={() => setShowCart(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#999' }}>×</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:24 }}>
              {cart.length === 0 ? <p style={{ color:'#999', textAlign:'center', marginTop:40 }}>Your cart is empty</p> : cart.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 0', borderBottom:'1px solid #f0f0f0' }}>
                  <div>
                    <p style={{ fontWeight:600 }}>{item.name}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                      <button onClick={() => setCart(prev => prev.map(c => c.id===item.id ? {...c, qty: Math.max(1, c.qty-1)} : c))} style={{ width:28, height:28, border:'1px solid #ddd', borderRadius:4, background:'#fff', cursor:'pointer' }}>-</button>
                      <span style={{ fontSize:14, minWidth:20, textAlign:'center' }}>{item.qty}</span>
                      <button onClick={() => setCart(prev => prev.map(c => c.id===item.id ? {...c, qty: c.qty+1} : c))} style={{ width:28, height:28, border:'1px solid #ddd', borderRadius:4, background:'#fff', cursor:'pointer' }}>+</button>
                      <button onClick={() => setCart(prev => prev.filter(c => c.id!==item.id))} style={{ marginLeft:8, color:'#999', background:'none', border:'none', fontSize:13, cursor:'pointer' }}>Remove</button>
                    </div>
                  </div>
                  <span style={{ fontWeight:600 }}>\${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding:24, borderTop:'1px solid #eee' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:700, marginBottom:16 }}>
                  <span>Total</span><span>\${cartTotal.toFixed(2)}</span>
                </div>
                {checkedOut ? (
                  <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'20px', textAlign:'center' }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>✓</div>
                    <div style={{ fontWeight:800, fontSize:15, color:'#166534' }}>Order Placed!</div>
                    <div style={{ fontSize:13, color:'#4ade80', marginTop:4 }}>We'll have it ready shortly.</div>
                  </div>
                ) : (
                  <button onClick={() => { setCheckedOut(true); setTimeout(() => { setCart([]); setCheckedOut(false); setShowCart(false); }, 3000); }} style={{ width:'100%', background:'var(--accent, #c2410c)', color:'#fff', border:'none', padding:'14px', borderRadius:50, fontSize:16, fontWeight:600, cursor:'pointer' }}>Checkout — \${cartTotal.toFixed(2)}</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}`,

"/components/sections/PricingTable.tsx": `import React, { useState } from 'react';
type Plan = { name: string; price: string; yearlyPrice?: string; period?: string; features: string[]; cta: string; ctaHref?: string; popular?: boolean; desc?: string };
export default function PricingTable({ title, subtitle, plans, accentColor }: { title: string; subtitle?: string; plans: Plan[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const [billing, setBilling] = useState<'monthly'|'yearly'>('monthly');
  const [selected, setSelected] = useState<number|null>(plans.findIndex(p=>p.popular) ?? null);
  const hasYearly = plans.some(p=>p.yearlyPrice);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} id="pricing" style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16,marginBottom:hasYearly?28:0}}>{subtitle}</p>}
          {hasYearly&&<div style={{display:'inline-flex',background:'#f5f5f5',borderRadius:50,padding:4,gap:0}}>
            <button onClick={()=>setBilling('monthly')} style={{padding:'8px 20px',borderRadius:50,border:'none',background:billing==='monthly'?'#fff':'transparent',fontWeight:600,fontSize:14,cursor:'pointer',boxShadow:billing==='monthly'?'0 2px 8px rgba(0,0,0,0.1)':'none',transition:'all 0.2s'}}>Monthly</button>
            <button onClick={()=>setBilling('yearly')} style={{padding:'8px 20px',borderRadius:50,border:'none',background:billing==='yearly'?'#fff':'transparent',fontWeight:600,fontSize:14,cursor:'pointer',boxShadow:billing==='yearly'?'0 2px 8px rgba(0,0,0,0.1)':'none',transition:'all 0.2s'}}>
              Yearly <span style={{fontSize:11,background:'#dcfce7',color:'#16a34a',padding:'2px 6px',borderRadius:50,marginLeft:4,fontWeight:700}}>Save 20%</span>
            </button>
          </div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:\`repeat(\${Math.min(plans.length,3)},1fr)\`,gap:20,alignItems:'start'}}>
          {(plans||[]).map((p,i)=>{
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

"/components/sections/FAQ.tsx": `import React, { useState } from 'react';
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
  return (
    <section ref={ref as any} id="faq" style={{ padding:'100px 40px', maxWidth:800, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      {safeItems.map((item, i) => (
        <div key={i} style={{ borderBottom:'1px solid var(--border,#eee)' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0', background:'none', border:'none', cursor:'pointer', fontSize:16, fontWeight:600, color:'var(--text,#111)', textAlign:'left' }}>
            {item.q}
            <span style={{ fontSize:20, transform: open === i ? 'rotate(45deg)' : 'none', transition:'transform 0.2s' }}>+</span>
          </button>
          {open === i && <p style={{ padding:'0 0 20px', fontSize:15, lineHeight:1.7, color:'var(--muted,#666)' }}>{item.a}</p>}
        </div>
      ))}
    </section>
  );
}`,

"/components/sections/CTA.tsx": `import React from 'react';
export default function CTA({ title, subtitle, cta, image }: { title: string; subtitle?: string; cta: { text: string; href?: string }; image?: string }) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{ position:'relative', padding:'100px 40px', textAlign:'center', overflow:'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      {image && <><img src={image} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} /><div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)' }} /></>}
      <div style={{ position:'relative', zIndex:1, maxWidth:700, margin:'0 auto' }}>
        <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, lineHeight:1.1, color: image ? '#fff' : 'var(--text,#111)', letterSpacing:'-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize:18, marginTop:16, color: image ? 'rgba(255,255,255,0.8)' : 'var(--muted,#666)' }}>{subtitle}</p>}
        <a href={cta.href||'#'} style={{ display:'inline-block', marginTop:32, background:'var(--accent,#c2410c)', color:'#fff', padding:'16px 40px', borderRadius:50, fontSize:16, fontWeight:600, textDecoration:'none' }} onMouseDown={e=>(e.currentTarget as HTMLElement).style.transform='scale(0.97)'} onMouseUp={e=>(e.currentTarget as HTMLElement).style.transform='scale(1)'}>{cta.text}</a>
      </div>
    </section>
  );
}`,

"/components/sections/Gallery.tsx": `import React, { useState } from 'react';
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
  return (
    <section ref={ref as any} id="gallery" style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:16 }}>
        {safeImages.map((img, i) => (
          <div key={i} onClick={() => setSelected(i)} style={{ borderRadius:12, overflow:'hidden', cursor:'pointer', aspectRatio:'4/3' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
            <img src={img.src} alt={img.alt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.3s' }} />
          </div>
        ))}
      </div>
      {selected !== null && (
        <div onClick={() => setSelected(null)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <img src={safeImages[selected].src} alt={safeImages[selected].alt} style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:8 }} />
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
  React.useEffect(() => {
    if (!started) return;
    const target = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    if (target === 0) return;
    const duration = 1500; const steps = 40; let step = 0;
    const timer = setInterval(() => { step++; setDisplayed(Math.round((step/steps)*target)); if(step>=steps) clearInterval(timer); }, duration/steps);
    return () => clearInterval(timer);
  }, [started, value]);
  const suffix = value.replace(/[0-9,]/g, '');
  const target = parseInt(value.replace(/[^0-9]/g, '')) || 0;
  return <span style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, color: dark ? '#fff' : 'var(--accent,#c2410c)', letterSpacing:'-0.02em' }} ref={(el) => { if(el && !started) { const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setStarted(true); obs.disconnect(); } }); obs.observe(el); } }}>{target > 0 ? displayed.toLocaleString() + suffix : value}</span>;
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
  return (
    <section ref={ref as any} style={{ padding:'80px 40px', background: dark ? 'var(--accent,#111)' : 'var(--card,#faf9f7)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:\`repeat(\${Math.min(safeItems.length, 4)}, 1fr)\`, gap:32, textAlign:'center' }}>
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

"/components/sections/Team.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} id="team" style={{ padding:'80px 40px', background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <h2 style={{ fontSize:38, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:56 }}>{title}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:32 }}>
          {list.map((m, i) => (
            <div key={i} style={{ textAlign:'center', padding:'32px 20px', background:'#fafafa', borderRadius:20, border:'1px solid #f0f0f0', transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
              {m.image ? <img src={m.image} alt={m.name} style={{ width:100, height:100, borderRadius:'50%', objectFit:'cover', margin:'0 auto 16px', display:'block' }} /> : <div style={{ width:100, height:100, borderRadius:'50%', background:accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:800, margin:'0 auto 16px' }}>{m.name[0]}</div>}
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

"/components/sections/Newsletter.tsx": `import React, { useState } from 'react';
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
  return (
    <section ref={ref as any} style={{ padding:'80px 40px', background:'var(--accent,#111)', color:'#fff', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
        <h2 style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize:16, opacity:0.8, marginTop:12 }}>{subtitle}</p>}
        {sent ? <p style={{ marginTop:24, fontSize:16, color:'#4ade80' }}>Thanks for subscribing!</p> : (
          <div style={{ display:'flex', gap:8, marginTop:32, maxWidth:440, margin:'32px auto 0' }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={placeholder || 'Enter your email'} style={{ flex:1, padding:'14px 20px', borderRadius:50, border:'none', fontSize:14, outline:'none' }} />
            <button onClick={() => { if (email.includes('@')) setSent(true); }} style={{ background:'#fff', color:'var(--accent,#111)', padding:'14px 28px', borderRadius:50, border:'none', fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>Subscribe</button>
          </div>
        )}
      </div>
    </section>
  );
}`,

"/components/sections/Timeline.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{ padding:'100px 40px', maxWidth:800, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
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

"/components/sections/LogoCloud.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{ padding:'60px 40px', borderTop:'1px solid var(--border,#eee)', borderBottom:'1px solid var(--border,#eee)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease', overflow:'hidden' }}>
      <style>{\`@keyframes logoScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }\`}</style>
      <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
        {title && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', color:'var(--muted,#999)', marginBottom:32 }}>{title}</p>}
        <div style={{ overflow:'hidden', position:'relative' }}>
          <div style={{ display:'flex', gap:60, alignItems:'center', opacity:0.5, width:'max-content', animation:'logoScroll 20s linear infinite' }}>
            {doubled.map((l, i) => l.image
              ? <img key={i} src={l.image} alt={l.name} style={{ height:28, objectFit:'contain', flexShrink:0 }} />
              : <span key={i} style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', whiteSpace:'nowrap', flexShrink:0 }}>{l.name}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/BlogGrid.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} id="blog" style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:32 }}>
        {safePosts.map((p, i) => (
          <article key={i} style={{ borderRadius:16, overflow:'hidden', border:'1px solid var(--border,#eee)', background:'var(--card,#fff)', transition: \`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform='translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'; }}>
            <img src={p.image} alt={p.title} style={{ width:'100%', height:200, objectFit:'cover' }} />
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

"/components/sections/Tabs.tsx": `import React, { useState } from 'react';
type Tab = { label: string; content: string };
export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const safeTabs = (tabs || []).filter(Boolean);
  const [active, setActive] = useState(0);
  return (
    <section style={{ padding:'80px 40px', maxWidth:800, margin:'0 auto' }}>
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border,#eee)' }}>
        {safeTabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding:'12px 24px', background:'none', border:'none', borderBottom: active === i ? '2px solid var(--accent,#c2410c)' : '2px solid transparent', marginBottom:-2, fontSize:14, fontWeight: active === i ? 600 : 400, color: active === i ? 'var(--text,#111)' : 'var(--muted,#888)', cursor:'pointer', transition:'all 0.2s' }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding:'32px 0', fontSize:15, lineHeight:1.8, color:'var(--text,#333)' }}>{safeTabs[active]?.content}</div>
    </section>
  );
}`,

"/components/sections/Booking.tsx": `import React, { useState } from 'react';
export default function Booking({ title, subtitle, fields, cta }: { title: string; subtitle?: string; fields?: string[]; cta?: string }) {
  const accent = 'var(--accent, #c2410c)';
  const defaultFields = fields || ['name', 'email', 'date', 'time', 'guests', 'notes'];
  const [form, setForm] = useState<Record<string,string>>({});
  const [sent, setSent] = useState(false);
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
    <section id="booking" style={{ padding:'100px 40px', background:'#fafafa' }}>
      <div style={{ maxWidth:560, margin:'0 auto', background:'#fff', borderRadius:24, padding:60, textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:28 }}>✓</div>
        <h3 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>You're all set!</h3>
        <p style={{ color:'#666', fontSize:16 }}>We'll confirm your booking shortly.</p>
        <button onClick={() => setSent(false)} style={{ marginTop:24, background:'none', border:'1.5px solid #ddd', borderRadius:50, padding:'10px 28px', fontSize:14, cursor:'pointer', color:'#666' }}>Book again</button>
      </div>
    </section>
  );
  return (
    <section id="booking" style={{ padding:'100px 40px', background:'#fafafa' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:12 }}>{title}</h2>
          {subtitle && <p style={{ color:'#666', fontSize:17 }}>{subtitle}</p>}
        </div>
        <div style={{ background:'#fff', borderRadius:24, padding:48, boxShadow:'0 4px 32px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'grid', gridTemplateColumns: defaultFields.includes('date') && defaultFields.includes('time') ? '1fr 1fr' : '1fr', gap:20 }}>
            {defaultFields.map(f => {
              const def = fieldDefs[f] || { label: f, type:'text', placeholder:'' };
              if (def.type === 'textarea') return (
                <div key={f} style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>{def.label}</label>
                  <textarea value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={def.placeholder} rows={3} style={{...inp, resize:'none'}} onFocus={onFocus} onBlur={onBlur} />
                </div>
              );
              if (def.type === 'select' && f === 'time') return (
                <div key={f}><label style={lbl}>{def.label}</label>
                  <select value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} style={inp} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Select time</option>
                    {timeSlots.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              );
              if (def.type === 'select' && f === 'guests') return (
                <div key={f}><label style={lbl}>{def.label}</label>
                  <select value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} style={inp} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Select guests</option>
                    {guestOptions.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              );
              return (
                <div key={f} style={{ gridColumn: (f==='name'||f==='email') && defaultFields.includes('email') ? 'auto' : defaultFields.includes('date') ? '1 / -1' : 'auto' }}>
                  <label style={lbl}>{def.label}</label>
                  <input type={def.type} value={form[f]||''} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={def.placeholder} style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>
              );
            })}
          </div>
          <button onClick={() => { if (form.name || form.email) setSent(true); }} style={{ marginTop:28, width:'100%', background:accent, color:'#fff', border:'none', borderRadius:50, padding:'16px 36px', fontSize:16, fontWeight:700, cursor:'pointer', transition:'opacity 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>{cta || 'Confirm Booking →'}</button>
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
      <button onClick={() => setShow(false)} style={{ position:'absolute', right:16, background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:18, lineHeight:1, padding:'0 4px' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.color='#fff'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'}>×</button>
    </div>
  );
}`,

"/components/sections/Reviews.tsx": `import React, { useState } from 'react';
type Review = { name: string; rating: number; text: string; date?: string; avatar?: string; source?: string };
export default function Reviews({ title, subtitle, items, reviews, accentColor }: { title: string; subtitle?: string; items?: Review[]; reviews?: Review[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || reviews || []).filter(Boolean);
  const stars = (n: number) => Array.from({length:5},(_,i)=><span key={i} style={{color:i<n?'#f59e0b':'#e5e7eb',fontSize:16}}>★</span>);
  const avg = safeItems.length > 0 ? (safeItems.reduce((s,r)=>s+(r.rating||5),0)/safeItems.length).toFixed(1) : '5.0';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:12}}>
            <span style={{fontSize:48,fontWeight:900,letterSpacing:'-0.03em'}}>{avg}</span>
            <div><div style={{display:'flex',gap:2}}>{stars(5)}</div><p style={{fontSize:12,color:'#999',margin:'2px 0 0'}}>from {safeItems.length} reviews</p></div>
          </div>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 10px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:24}}>
          {safeItems.map((r,i)=>(
            <div key={i} style={{background:'#fafafa',borderRadius:20,padding:28,border:'1px solid #f0f0f0',transition:\`all 0.25s ease, opacity 0.5s ease \${i*0.1}s, transform 0.5s ease \${i*0.1}s\`,opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', boxShadow:'0 2px 16px rgba(0,0,0,0.06)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow='0 20px 60px rgba(0,0,0,0.12)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 16px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',gap:4,marginBottom:12}}>{stars(r.rating)}</div>
              <p style={{fontSize:14,lineHeight:1.7,color:'#444',margin:'0 0 20px',fontStyle:'italic'}}>"{r.text}"</p>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:50,background:accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,flexShrink:0}}>{r.avatar?<img src={r.avatar} style={{width:40,height:40,borderRadius:50,objectFit:'cover'}} alt={r.name}/>:r.name[0]}</div>
                <div><div style={{fontWeight:700,fontSize:14}}>{r.name}</div>{(r.date||r.source)&&<div style={{fontSize:12,color:'#aaa'}}>{r.source||''}{r.source&&r.date?' · ':''}{r.date||''}</div>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/MapSection.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',marginBottom:48,textAlign:'center'}}>{title}</h2>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'start'}}>
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
                <div><div style={{fontWeight:700,fontSize:15,marginBottom:2}}>Phone</div><a href={\`tel:\${phone.replace(/\s/g,'')}\`} style={{color:accent,textDecoration:'none',fontSize:14,fontWeight:600}}>{phone}</a></div>
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

"/components/sections/ServiceCards.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fafafa)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:17,maxWidth:560,margin:'0 auto'}}>{subtitle}</p>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:\`repeat(\${cols},1fr)\`,gap:24}}>
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

"/components/sections/StepProcess.tsx": `import React from 'react';
type Step = { title: string; desc: string; icon?: string };
export default function StepProcess({ title, subtitle, steps, accentColor, layout }: { title: string; subtitle?: string; steps: Step[]; accentColor?: string; layout?: 'horizontal'|'vertical' }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeSteps = (steps || []).filter(Boolean);
  const horiz = layout !== 'vertical';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
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

"/components/sections/VideoSection.tsx": `import React, { useState } from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:960,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:40}}>
          {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 10px'}}>{title}</h2>}
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>}
        <div style={{borderRadius:24,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,0.15)',position:'relative',aspectRatio:'16/9',background:'#000'}}>
          {playing ? (
            <iframe src={embedUrl} width="100%" height="100%" style={{border:'none',position:'absolute',inset:0}} allow="autoplay; fullscreen" allowFullScreen />
          ) : (
            <div onClick={()=>setPlaying(true)} style={{cursor:'pointer',position:'relative',width:'100%',height:'100%'}}>
              {thumbnail&&<img src={thumbnail} alt="video" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />}
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

"/components/sections/AppDownload.tsx": `import React from 'react';
export default function AppDownload({ title, subtitle, description, appStoreUrl, playStoreUrl, mockupImage, accentColor, features }: { title: string; subtitle?: string; description?: string; appStoreUrl?: string; playStoreUrl?: string; mockupImage?: string; accentColor?: string; features?: string[] }) {
  const accent = accentColor || 'var(--accent,#111)';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:accent,color:'#fff',overflow:'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:mockupImage?'1fr 1fr':'1fr',gap:60,alignItems:'center'}}>
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
        {mockupImage&&<div style={{display:'flex',justifyContent:'center'}}><img src={mockupImage} alt="app mockup" style={{maxHeight:480,objectFit:'contain',filter:'drop-shadow(0 32px 64px rgba(0,0,0,0.4))'}} /></div>}
      </div>
    </section>
  );
}`,

"/components/sections/Comparison.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>
        <div style={{borderRadius:24,overflow:'hidden',border:'1px solid #f0f0f0',boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
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

"/components/sections/Portfolio.tsx": `import React, { useState } from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16,marginBottom:0}}>{subtitle}</p>}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:40,flexWrap:'wrap'}}>
          {cats.map(c=><button key={c} onClick={()=>setActive(c)} style={{padding:'8px 20px',borderRadius:50,border:active===c?'none':'1.5px solid #e5e5e5',background:active===c?accent:'transparent',color:active===c?'#fff':'#666',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.18s'}}>{c}</button>)}
        </div>
        <div style={{columns:3,gap:20}}>
          {filtered.map((p,i)=>(
            <div key={i} style={{breakInside:'avoid',marginBottom:20,borderRadius:16,overflow:'hidden',position:'relative',cursor:'pointer'}} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}>
              <img src={p.image} alt={p.title} style={{width:'100%',display:'block',transition:'transform 0.4s',transform:hover===i?'scale(1.05)':'scale(1)'}} />
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

"/components/sections/EventsList.tsx": `import React from 'react';
type Event = { title: string; date: string; time?: string; location?: string; desc?: string; image?: string; link?: string; badge?: string };
export default function EventsList({ title, subtitle, items, accentColor, layout }: { title: string; subtitle?: string; items: Event[]; accentColor?: string; layout?: 'list'|'grid' }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean) as Event[];
  const grid = layout === 'grid';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 10px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16,margin:0}}>{subtitle}</p>}
        </div>
        <div style={{display:grid?'grid':'flex',gridTemplateColumns:grid?'repeat(auto-fill,minmax(300px,1fr))':undefined,flexDirection:grid?undefined:'column',gap:grid?24:0}}>
          {safeItems.map((ev,i)=>(
            <div key={i} style={{background:'#fafafa',borderRadius:grid?20:0,overflow:'hidden',borderBottom:!grid&&i<safeItems.length-1?'1px solid #f0f0f0':'none',display:'flex',flexDirection:grid?'column':'row',alignItems:grid?'stretch':'center',gap:grid?0:24,padding:grid?0:'20px 0',transition:'box-shadow 0.2s'}} onMouseOver={e=>grid&&((e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.08)')} onMouseOut={e=>grid&&((e.currentTarget as HTMLElement).style.boxShadow='none')}>
              {ev.image&&<img src={ev.image} alt={ev.title} style={{width:grid?'100%':100,height:grid?180:100,objectFit:'cover',flexShrink:0,borderRadius:grid?'0':'12px'}}/>}
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
              {ev.link&&<a href={ev.link} style={{display:'inline-flex',alignItems:'center',padding:'8px 18px',borderRadius:50,background:accent,color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700,flexShrink:0,margin:grid?'0 20px 20px':'0'}}>RSVP →</a>}
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
  return (
    <section style={{padding:'80px 40px',background:bg,color:fg}}>
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

"/components/sections/TrustBadges.tsx": `import React from 'react';
type Badge = { label: string; icon?: string; sub?: string };
export default function TrustBadges({ items, title, accentColor }: { items: Badge[]; title?: string; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = (items || []).filter(Boolean);
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{padding:'48px 40px',background:'var(--bg,#fafafa)',borderTop:'1px solid #f0f0f0',borderBottom:'1px solid #f0f0f0', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
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

"/components/sections/BeforeAfter.tsx": `import React, { useState, useRef, useCallback } from 'react';
type Item = { title?: string; before: string; after: string; beforeLabel?: string; afterLabel?: string };
export default function BeforeAfter({ title, subtitle, items, accentColor }: { title?: string; subtitle?: string; items: Item[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const safeItems = items || [];
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
  return (
    <section ref={sectionRef as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
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
                <img src={item.after} alt="after" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
                <div style={{position:'absolute',inset:0,overflow:'hidden',width:\`\${pos[i]}%\`}}>
                  <img src={item.before} alt="before" style={{position:'absolute',inset:0,width:\`\${10000/pos[i]}%\`,maxWidth:'none',height:'100%',objectFit:'cover'}} />
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

"/components/sections/HoursTable.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'60px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
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

"/components/sections/ProductSpotlight.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center',direction:imageLeft?'rtl':'ltr'}}>
        <div style={{borderRadius:24,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,0.1)',position:'relative',direction:'ltr'}}>
          <img src={image} alt={title} style={{width:'100%',display:'block',aspectRatio:'4/3',objectFit:'cover'}} />
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

"/components/sections/LocationCards.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:24}}>
          {safeItems.map((loc,i)=>(
            <div key={i} style={{background:'#fafafa',borderRadius:20,overflow:'hidden',border:'1px solid #f0f0f0',transition:'box-shadow 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.boxShadow='none'}>
              {loc.image&&<img src={loc.image} alt={loc.name} style={{width:'100%',height:180,objectFit:'cover',display:'block'}}/>}
              <div style={{padding:24}}>
                <h3 style={{fontSize:18,fontWeight:700,margin:'0 0 8px'}}>{loc.name}</h3>
                <p style={{fontSize:14,color:'#888',margin:'0 0 4px'}}>📍 {loc.address}</p>
                {loc.phone&&<p style={{fontSize:14,color:'#888',margin:'0 0 4px'}}>📞 <a href={\`tel:\${loc.phone}\`} style={{color:'inherit',textDecoration:'none'}}>{loc.phone}</a></p>}
                {loc.hours&&<p style={{fontSize:14,color:'#888',margin:'0 0 16px'}}>🕐 {loc.hours}</p>}
                {loc.link&&<a href={loc.link} style={{fontSize:13,fontWeight:700,color:accent,textDecoration:'none'}}>Get Directions →</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/QuoteBlock.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:bg, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
        <div style={{fontSize:80,lineHeight:0.8,color:dark?'rgba(255,255,255,0.2)':accent,marginBottom:24,fontFamily:'Georgia,serif'}}>"</div>
        <blockquote style={{fontSize:28,fontWeight:700,lineHeight:1.4,letterSpacing:'-0.02em',color:fg,margin:'0 0 40px',fontStyle:'italic'}}>{quote}</blockquote>
        {(author||image)&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14}}>
          {image&&<img src={image} alt={author||''} style={{width:52,height:52,borderRadius:50,objectFit:'cover'}}/>}
          <div style={{textAlign:'left'}}>
            {author&&<div style={{fontWeight:800,fontSize:16,color:fg}}>{author}</div>}
            {role&&<div style={{fontSize:13,color:dark?'rgba(255,255,255,0.6)':'#999'}}>{role}</div>}
          </div>
        </div>}
      </div>
    </section>
  );
}`,

"/components/sections/IconFeatures.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:bg, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:56}}>
          {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px',color:fg}}>{title}</h2>}
          {subtitle&&<p style={{color:dark?'rgba(255,255,255,0.55)':'#888',fontSize:17,maxWidth:540,margin:'0 auto'}}>{subtitle}</p>}
        </div>}
        <div style={{display:'grid',gridTemplateColumns:\`repeat(\${cols},1fr)\`,gap:32}}>
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

"/components/sections/VideoHero.tsx": `import React from 'react';
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

"/components/sections/RichText.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
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

"/components/sections/Partners.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:48}}>
          {title&&<h2 style={{fontSize:38,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 12px'}}>{title}</h2>}
          {subtitle&&<p style={{color:'#888',fontSize:16}}>{subtitle}</p>}
        </div>}
        <div style={{display:'grid',gridTemplateColumns:showDesc?\`repeat(auto-fill,minmax(240px,1fr))\`:\`repeat(auto-fill,minmax(160px,1fr))\`,gap:showDesc?24:16,alignItems:'center'}}>
          {safeItems.map((p,i)=>(
            <a key={i} href={p.url||'#'} style={{textDecoration:'none',display:'flex',flexDirection:showDesc?'column':'row',alignItems:'center',gap:12,padding:showDesc?24:16,borderRadius:16,border:'1.5px solid #f0f0f0',background:'#fafafa',transition:'all 0.2s',color:'inherit'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.borderColor=accent;(e.currentTarget as HTMLElement).style.background='#fff'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.borderColor='#f0f0f0';(e.currentTarget as HTMLElement).style.background='#fafafa'}}>
              {p.logo?<img src={p.logo} alt={p.name} style={{height:36,objectFit:'contain',filter:'grayscale(1)',transition:'filter 0.2s'}} onMouseOver={e=>(e.currentTarget as HTMLElement).style.filter='none'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.filter='grayscale(1)'}/>:<div style={{fontWeight:800,fontSize:16,color:'#bbb'}}>{p.name}</div>}
              {showDesc&&<div><div style={{fontWeight:700,fontSize:14}}>{p.name}</div>{p.desc&&<p style={{fontSize:13,color:'#888',margin:'4px 0 0'}}>{p.desc}</p>}</div>}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Awards.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'60px 40px',background:'var(--bg,#fafafa)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {(title||subtitle)&&<div style={{textAlign:'center',marginBottom:40}}>
          {title&&<h2 style={{fontSize:34,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 8px'}}>{title}</h2>}
          {subtitle&&<p style={{color:'#888',fontSize:15}}>{subtitle}</p>}
        </div>}
        <div style={{display:'flex',flexWrap:'wrap',gap:20,justifyContent:'center'}}>
          {safeItems.map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'16px 24px',background:'#fff',borderRadius:16,border:'1.5px solid #f0f0f0',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
              {a.image?<img src={a.image} alt={a.title} style={{height:48,objectFit:'contain'}}/>:<div style={{fontSize:32}}>{a.icon||'🏆'}</div>}
              <div><div style={{fontWeight:700,fontSize:15,color:'#222'}}>{a.title}</div>{(a.org||a.year)&&<div style={{fontSize:12,color:'#aaa'}}>{[a.org,a.year].filter(Boolean).join(' · ')}</div>}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/SocialProof.tsx": `import React from 'react';
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
  return (
    <section ref={ref as any} style={{padding:'80px 40px',background:bg,color:'#fff', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        {stats&&<div style={{display:'grid',gridTemplateColumns:\`repeat(\${stats.length},1fr)\`,gap:32,marginBottom:quotes?60:0}}>
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
                {q.image?<img src={q.image} alt={q.author} style={{width:36,height:36,borderRadius:50,objectFit:'cover'}}/>:<div style={{width:36,height:36,borderRadius:50,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{q.author[0]}</div>}
                <span style={{fontWeight:700,fontSize:14}}>{q.author}</span>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </section>
  );
}`,

"/components/sections/ImageText.tsx": `import React from 'react';
type Block = { image: string; title: string; desc: string; cta?: string; ctaHref?: string; badge?: string; imageLeft?: boolean };
export default function ImageText({ blocks, accentColor }: { blocks: Block[]; accentColor?: string }) {
  const accent = accentColor || 'var(--accent,#111)';
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref as any} style={{padding:'60px 40px',background:'var(--bg,#fff)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'flex',flexDirection:'column',gap:80}}>
        {blocks.map((b,i)=>{
          const left = b.imageLeft !== undefined ? b.imageLeft : i%2===0;
          return (
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center',direction:left?'ltr':'rtl'}}>
              <div style={{borderRadius:24,overflow:'hidden',boxShadow:'0 16px 64px rgba(0,0,0,0.1)',direction:'ltr',position:'relative'}}>
                <img src={b.image} alt={b.title} style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',display:'block'}}/>
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
        <img src={image} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
        {image ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>{initials}</div>}
      </div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
      <div style={{ color: accent, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{role}</div>
      {bio && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, margin: '12px 0' }}>{bio}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
        {twitter && <a href={twitter} target="_blank" rel="noreferrer" style={{ fontSize: 18, textDecoration: 'none' }}>𝕏</a>}
        {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 18, textDecoration: 'none' }}>in</a>}
        {instagram && <a href={instagram} target="_blank" rel="noreferrer" style={{ fontSize: 18, textDecoration: 'none' }}>📷</a>}
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
      {dismissible && <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', padding: 0, lineHeight: 1 }}>✕</button>}
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
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (ytMatch) return \`https://www.youtube.com/embed/\${ytMatch[1]}?autoplay=1\`;
    if (vmMatch) return \`https://player.vimeo.com/video/\${vmMatch[1]}?autoplay=1\`;
    return url;
  };
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', paddingBottom: pad, background: '#000', fontFamily: 'inherit' }}>
      {playing ? (
        <iframe src={getEmbed()} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen title={title} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} onClick={() => setPlaying(true)}>
          {thumbnail && <img src={thumbnail} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
        <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: accent, color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Open in Maps</a>
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
        <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ width: dim, height: dim, borderRadius: '50%', border: \`2px solid \${accent}\`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, color: accent, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent', fontWeight: 700, textTransform: 'uppercase' as const }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = accent; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = accent; }}>
          {ICONS[item.platform] || item.platform[0].toUpperCase()}
        </a>
      ))}
    </div>
  );
}`,

"/components/sections/NewsletterInline.tsx": `import React, { useState } from 'react';
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
  return (
    <nav aria-label="breadcrumb" style={{ fontFamily: 'inherit' }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0, fontSize: 14 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'hsl(var(--muted-foreground))' }}>/</span>}
            {item.href && i < items.length - 1
              ? <a href={item.href} style={{ color: accent, textDecoration: 'none', fontWeight: 500 }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}>{item.label}</a>
              : <span style={{ color: i === items.length - 1 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', fontWeight: i === items.length - 1 ? 600 : 400 }}>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}`,

"/components/sections/TabsInline.tsx": `import React, { useState } from 'react';
export default function TabsInline({ tabs, defaultTab, accentColor }: { tabs: { label: string; content: React.ReactNode }[]; defaultTab?: number; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const [active, setActive] = useState(defaultTab ?? 0);
  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 4, background: 'hsl(var(--muted))', borderRadius: 12, marginBottom: 20, width: 'fit-content' }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding: '7px 18px', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: active === i ? accent : 'transparent', color: active === i ? '#fff' : 'hsl(var(--muted-foreground))' }}>{tab.label}</button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  );
}`,

"/components/sections/AccordionItem.tsx": `import React, { useState } from 'react';
export default function AccordionItem({ title, children, defaultOpen, accentColor }: { title: string; children: React.ReactNode; defaultOpen?: boolean; accentColor?: string }) {
  const accent = accentColor || 'hsl(var(--primary))';
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 12, overflow: 'hidden', fontFamily: 'inherit', marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: open ? accent + '18' : 'hsl(var(--card))', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: open ? accent : 'hsl(var(--foreground))', textAlign: 'left' as const, transition: 'background 0.2s' }}>
        <span>{title}</span>
        <span style={{ fontSize: 18, transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none', color: accent, display: 'inline-block' }}>v</span>
      </button>
      {open && <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'hsl(var(--muted-foreground))', lineHeight: 1.7, background: 'hsl(var(--card))' }}>{children}</div>}
    </div>
  );
}`,

"/components/sections/ImageGalleryGrid.tsx": `import React, { useState, useEffect } from 'react';
export default function ImageGalleryGrid({ images, columns }: { images: { url: string; caption?: string }[]; columns?: 2|3|4; accentColor?: string }) {
  const [lightbox, setLightbox] = useState<number|null>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox(l => l !== null && l < images.length - 1 ? l + 1 : l);
      if (e.key === 'ArrowLeft') setLightbox(l => l !== null && l > 0 ? l - 1 : l);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [images.length]);
  const cols = columns || 3;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${cols}, 1fr)\`, gap: 8 }}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setLightbox(i)} style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1/1', position: 'relative', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
            <img src={img.url} alt={img.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <img src={images[lightbox].url} alt={images[lightbox].caption || ''} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          {images[lightbox].caption && <p style={{ color: '#fff', marginTop: 14, fontSize: 14, opacity: 0.8 }}>{images[lightbox].caption}</p>}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(l => l !== null && l > 0 ? l - 1 : l)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 18 }}>{'<'}</button>
            <span style={{ color: '#fff', fontSize: 13, alignSelf: 'center' }}>{lightbox + 1} / {images.length}</span>
            <button onClick={() => setLightbox(l => l !== null && l < images.length - 1 ? l + 1 : l)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 18 }}>{'>'}</button>
          </div>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1 }}>x</button>
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
      {cta && <button onClick={onAction} style={{ padding: '10px 24px', borderRadius: 10, background: accent, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{cta}</button>}
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
  return <a href={`#${to}`} className={className}>{children}</a>;
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
- Footer: <Footer brand="Name" tagline="Tagline" />
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

RULES:
- The AI just passes DATA as props — components handle all styling, layout, hover effects, and responsive behavior.
- ALWAYS prefer these sections over writing raw HTML. They are pre-styled and look professional.
- When user asks for "checkout", "cart", "ordering", "e-commerce" → use ShopGrid instead of MenuGrid.
- When editing: if the current code uses MenuGrid and user wants cart/checkout, REPLACE MenuGrid with ShopGrid.
- CRITICAL: ONLY import from this exact list. NEVER invent component names like CartDrawer, PizzaBuilder, OrderTracker, ProductCard, HeroSection, etc. If you need a feature not in this list, BUILD IT IN /App.tsx as a regular React component — do NOT import it from /components/sections/. Importing a non-existent component causes a fatal crash.`;
