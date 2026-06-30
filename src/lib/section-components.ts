// Pre-built page section components — injected into every Sandpack project
// The AI composes pages by picking sections and passing props (data only, no styling needed)

export const SECTION_COMPONENTS: Record<string, string> = {

"/components/sections/Navbar.tsx": `import React, { useState, useEffect } from 'react';
export default function Navbar({ brand, links, cta, onNavigate, cartCount: cartCountProp, onCartClick }: { brand: string; links: any[]; cta?: string; onNavigate?: (page: string) => void; cartCount?: number; onCartClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(cartCountProp ?? 0);
  const cartOpenerRef = React.useRef<(() => void) | null>(null);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 10); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => { const h = (e: Event) => { const d = (e as CustomEvent).detail; setCartCount(d.count); if (d.open) cartOpenerRef.current = d.open; }; window.addEventListener('cartupdate', h); return () => window.removeEventListener('cartupdate', h); }, []);
  const handleCartClick = () => { if (onCartClick) onCartClick(); else if (cartOpenerRef.current) cartOpenerRef.current(); else window.dispatchEvent(new CustomEvent('carttrigger', { detail: 'open' })); };
  const safeLinks = (Array.isArray(links) ? links : []).map(l => typeof l === 'string' ? l : (l?.label || l?.name || l?.text || String(l)));
  const handleClick = (l: string) => (e: React.MouseEvent) => {
    if (onNavigate) { e.preventDefault(); onNavigate(String(l).toLowerCase()); }
  };
  return (
    <nav style={{ position:'sticky', top:0, zIndex:100, background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid #eee', padding:'0 40px', transition:'background 0.2s' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <a href="#" onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate('home'); } : undefined} style={{ fontSize:20, fontWeight:800, color:'#111', textDecoration:'none', letterSpacing:'-0.02em' }}>{brand}</a>
        <div style={{ display:'flex', gap:24, alignItems:'center' }}>
          {safeLinks.map(l => <a key={String(l)} href={\`#\${String(l).toLowerCase()}\`} onClick={handleClick(String(l))} style={{ fontSize:14, color:'#555', textDecoration:'none', fontWeight:500, cursor:'pointer', transition:'color 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.color='#111'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.color='#555'}>{String(l)}</a>)}
          {cta && <a href="#contact" onClick={handleClick('contact')} style={{ background:'#111', color:'#fff', padding:'10px 24px', borderRadius:50, fontSize:14, fontWeight:600, textDecoration:'none', cursor:'pointer', transition:'background 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#333'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='#111'}>{cta}</a>}
          <button onClick={handleCartClick} style={{ position:'relative', background:'none', border:'1.5px solid #ddd', padding:'8px 14px', borderRadius:50, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:600, color:'#111', transition:'border-color 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.borderColor='#111'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor='#ddd'}>
            🛒 {cartCount > 0 && <span style={{ background:'var(--accent,#c2410c)', color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}`,

"/components/sections/Hero.tsx": `import React from 'react';
export default function Hero({ tag, title, subtitle, cta1, cta2, image }: { tag?: string; title: string; subtitle: string; cta1?: { text: string; href?: string }; cta2?: { text: string; href?: string }; image: string }) {
  return (
    <section style={{ position:'relative', minHeight:'65vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
      <img src={image} alt={title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))' }} />
      <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'80px 40px', color:'#fff' }}>
        {tag && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:16, opacity:0.8 }}>{tag}</p>}
        <h1 style={{ fontSize:'clamp(36px, 6vw, 72px)', fontWeight:800, lineHeight:1.05, maxWidth:700, letterSpacing:'-0.03em' }}>{title}</h1>
        <p style={{ fontSize:18, lineHeight:1.6, maxWidth:500, marginTop:24, opacity:0.85 }}>{subtitle}</p>
        <div style={{ display:'flex', gap:16, marginTop:40, flexWrap:'wrap' }}>
          {cta1 && <a href={cta1.href||'#'} style={{ background:'var(--accent, #c2410c)', color:'#fff', padding:'14px 32px', borderRadius:50, fontSize:15, fontWeight:600, textDecoration:'none', transition:'opacity 0.2s' }}>{cta1.text}</a>}
          {cta2 && <a href={cta2.href||'#'} style={{ border:'1px solid rgba(255,255,255,0.4)', color:'#fff', padding:'14px 32px', borderRadius:50, fontSize:15, fontWeight:600, textDecoration:'none', transition:'background 0.2s' }}>{cta2.text}</a>}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/Features.tsx": `import React from 'react';
type Feature = { icon?: string; title: string; desc: string };
export default function Features({ tag, title, items }: { tag?: string; title: string; items: Feature[] }) {
  return (
    <section style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto' }}>
      {tag && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', color:'var(--accent, #c2410c)', marginBottom:8 }}>{tag}</p>}
      <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:60 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:32 }}>
        {items.map((f, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #eee', borderRadius:16, padding:32, transition:'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 30px rgba(0,0,0,0.08)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
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
  const accent = accentColor || '#c2410c';
  const cats = categories || [...new Set(items.map(i => i.category))];
  const [active, setActive] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const filtered = active === 'All' ? items : items.filter(i => i.category === active);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + (parseFloat(String(c.item.price)) * c.qty), 0);
  useEffect(() => { window.dispatchEvent(new CustomEvent('cartupdate', { detail: { count: cartCount, open: () => setCartOpen(true) } })); }, [cartCount]);
  useEffect(() => { const h = (e: Event) => { if ((e as CustomEvent).detail === 'open') setCartOpen(true); }; window.addEventListener('carttrigger', h); return () => window.removeEventListener('carttrigger', h); }, []);
  const addToCart = (item: MenuItem) => setCart(prev => { const ex = prev.find(c => c.item.name === item.name); return ex ? prev.map(c => c.item.name === item.name ? {...c, qty: c.qty+1} : c) : [...prev, {item, qty:1}]; });
  const updateQty = (name: string, delta: number) => setCart(prev => prev.map(c => c.item.name === name ? {...c, qty: Math.max(0, c.qty+delta)} : c).filter(c => c.qty > 0));
  return (
    <section id="menu" style={{ padding:'80px 40px', background:'#faf9f7' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom:8 }}>
          <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em' }}>{title}</h2>
        </div>
        {subtitle && <p style={{ color:'#666', fontSize:16, marginBottom:32 }}>{subtitle}</p>}
        <div style={{ display:'flex', gap:8, marginBottom:40, flexWrap:'wrap' }}>
          {['All', ...cats].map(c => (
            <button key={c} onClick={() => setActive(c)} style={{ padding:'8px 20px', borderRadius:50, border: active===c ? 'none' : '1px solid #ddd', background: active===c ? accent : '#fff', color: active===c ? '#fff' : '#555', fontSize:14, fontWeight:500, cursor:'pointer', transition:'all 0.2s' }}>{c}</button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:24 }}>
          {filtered.map((item, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:16, border:'1px solid #eee', overflow:'hidden', transition:'transform 0.2s,box-shadow 0.2s' }} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 32px rgba(0,0,0,0.1)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
              {item.image && <div style={{ position:'relative' }}><img src={item.image} alt={item.name} style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />{item.badge && <span style={{ position:'absolute', top:10, left:10, background:accent, color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50 }}>{item.badge}</span>}<span style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:50 }}>{item.category}</span></div>}
              <div style={{ padding:'16px 18px 18px' }}>
                {!item.image && item.badge && <span style={{ fontSize:11, background:accent, color:'#fff', padding:'2px 8px', borderRadius:50, fontWeight:600, marginBottom:8, display:'inline-block' }}>{item.badge}</span>}
                <h3 style={{ fontSize:17, fontWeight:700, margin:'0 0 6px' }}>{item.name}</h3>
                <p style={{ fontSize:13, color:'#888', margin:'0 0 14px', lineHeight:1.5 }}>{item.desc}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:19, fontWeight:800, color:accent }}>from \${parseFloat(String(item.price)).toFixed(2)}</span>
                  <button onClick={() => addToCart(item)} style={{ background:accent, color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontWeight:700, fontSize:13, cursor:'pointer', transition:'opacity 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.85'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>Add to Cart +</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {cartOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:500 }}>
          <div onClick={() => setCartOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'100%', maxWidth:400, background:'#fff', display:'flex', flexDirection:'column', boxShadow:'-4px 0 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontSize:20, fontWeight:800, margin:0 }}>Your Order ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} style={{ background:'#f0f0f0', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
              {cart.map((c, i) => (
                <div key={i} style={{ background:'#faf9f7', borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{c.item.name}</div>
                    <div style={{ fontWeight:700, color:accent }}>\${(parseFloat(String(c.item.price))*c.qty).toFixed(2)}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => updateQty(c.item.name, -1)} style={{ background:'#eee', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', fontWeight:700, fontSize:14 }}>−</button>
                    <span style={{ fontWeight:700, minWidth:20, textAlign:'center' }}>{c.qty}</span>
                    <button onClick={() => updateQty(c.item.name, 1)} style={{ background:accent, color:'#fff', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', fontWeight:700, fontSize:14 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:'20px 24px', borderTop:'1px solid #eee' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, fontSize:18, fontWeight:800 }}>
                <span>Total</span><span style={{ color:accent }}>\${cartTotal.toFixed(2)}</span>
              </div>
              <button style={{ width:'100%', background:accent, color:'#fff', border:'none', borderRadius:12, padding:'14px', fontWeight:800, fontSize:16, cursor:'pointer' }}>Checkout →</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}`,

"/components/sections/Testimonials.tsx": `import React from 'react';
type Testimonial = { quote: string; name: string; role: string; image?: string };
export default function Testimonials({ title, items }: { title: string; items: Testimonial[] }) {
  return (
    <section style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:60 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:32 }}>
        {items.map((t, i) => (
          <div key={i} style={{ background:'#faf9f7', borderRadius:16, padding:32 }}>
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

"/components/sections/Contact.tsx": `import React from 'react';
type ContactInfo = { label: string; value: string; href?: string };
export default function Contact({ title, subtitle, items }: { title: string; subtitle?: string; items: ContactInfo[] }) {
  return (
    <section id="contact" style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:12 }}>{title}</h2>
      {subtitle && <p style={{ color:'#666', fontSize:16, marginBottom:48 }}>{subtitle}</p>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:32 }}>
        {items.map((c, i) => (
          <div key={i}>
            <h3 style={{ fontSize:14, textTransform:'uppercase', letterSpacing:'0.1em', color:'#999', marginBottom:8 }}>{c.label}</h3>
            {c.href ? <a href={c.href} style={{ fontSize:16, color:'#111', textDecoration:'none' }}>{c.value}</a> : <p style={{ fontSize:16, color:'#111' }}>{c.value}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/Footer.tsx": `import React from 'react';
export default function Footer({ brand, tagline, links, year }: { brand: string; tagline?: string; links?: string[]; year?: number }) {
  const y = year || new Date().getFullYear();
  return (
    <footer style={{ borderTop:'1px solid #eee', padding:'48px 40px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24 }}>
        <div>
          <p style={{ fontWeight:700, fontSize:16 }}>{brand}</p>
          {tagline && <p style={{ fontSize:14, color:'#888', marginTop:4 }}>{tagline}</p>}
        </div>
        <p style={{ fontSize:13, color:'#999' }}>© {y} {brand}. All rights reserved.</p>
      </div>
    </footer>
  );
}`,

"/components/sections/SplitSection.tsx": `import React from 'react';
export default function SplitSection({ tag, title, text, image, reverse }: { tag?: string; title: string; text: string; image: string; reverse?: boolean }) {
  return (
    <section style={{ maxWidth:1200, margin:'0 auto', padding:'100px 40px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center', direction: reverse ? 'rtl' : 'ltr' }}>
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const cats = ['All', ...new Set(items.map(i => i.category))];
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? items : items.filter(i => i.category === active);
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
                <button onClick={() => { alert('Order placed! Total: $' + cartTotal.toFixed(2)); setCart([]); setShowCart(false); }} style={{ width:'100%', background:'var(--accent, #c2410c)', color:'#fff', border:'none', padding:'14px', borderRadius:50, fontSize:16, fontWeight:600, cursor:'pointer' }}>Checkout — \${cartTotal.toFixed(2)}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}`,

"/components/sections/PricingTable.tsx": `import React, { useState } from 'react';
type Plan = { name: string; price: string; period?: string; features: string[]; cta: string; popular?: boolean };
export default function PricingTable({ title, subtitle, plans }: { title: string; subtitle?: string; plans: Plan[] }) {
  return (
    <section id="pricing" style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em' }}>{title}</h2>
      {subtitle && <p style={{ textAlign:'center', color:'var(--muted,#888)', fontSize:16, marginTop:12, marginBottom:48 }}>{subtitle}</p>}
      <div style={{ display:'grid', gridTemplateColumns:\`repeat(\${Math.min(plans.length, 3)}, 1fr)\`, gap:24, alignItems:'start' }}>
        {plans.map((p, i) => (
          <div key={i} style={{ background: p.popular ? 'var(--accent,#111)' : 'var(--card,#fff)', color: p.popular ? '#fff' : 'var(--text,#111)', border: p.popular ? 'none' : '1px solid var(--border,#eee)', borderRadius:16, padding:32, position:'relative', transform: p.popular ? 'scale(1.05)' : 'none' }}>
            {p.popular && <span style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'var(--accent2,#c2410c)', color:'#fff', fontSize:11, padding:'4px 12px', borderRadius:50, fontWeight:600 }}>Most Popular</span>}
            <h3 style={{ fontSize:20, fontWeight:700 }}>{p.name}</h3>
            <div style={{ margin:'16px 0' }}><span style={{ fontSize:40, fontWeight:800 }}>{p.price}</span>{p.period && <span style={{ fontSize:14, opacity:0.7 }}>/{p.period}</span>}</div>
            <ul style={{ listStyle:'none', padding:0, margin:'24px 0' }}>{p.features.map((f, j) => <li key={j} style={{ fontSize:14, padding:'8px 0', borderBottom:'1px solid ' + (p.popular ? 'rgba(255,255,255,0.1)' : 'var(--border,#eee)') }}>✓ {f}</li>)}</ul>
            <button style={{ width:'100%', padding:'14px', borderRadius:50, border: p.popular ? 'none' : '1px solid var(--border,#ddd)', background: p.popular ? '#fff' : 'var(--accent,#111)', color: p.popular ? 'var(--accent,#111)' : '#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>{p.cta}</button>
          </div>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/FAQ.tsx": `import React, { useState } from 'react';
type FAQItem = { q: string; a: string };
export default function FAQ({ title, items }: { title: string; items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ padding:'100px 40px', maxWidth:800, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      {items.map((item, i) => (
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
  return (
    <section style={{ position:'relative', padding:'100px 40px', textAlign:'center', overflow:'hidden' }}>
      {image && <><img src={image} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} /><div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)' }} /></>}
      <div style={{ position:'relative', zIndex:1, maxWidth:700, margin:'0 auto' }}>
        <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, lineHeight:1.1, color: image ? '#fff' : 'var(--text,#111)', letterSpacing:'-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize:18, marginTop:16, color: image ? 'rgba(255,255,255,0.8)' : 'var(--muted,#666)' }}>{subtitle}</p>}
        <a href={cta.href||'#'} style={{ display:'inline-block', marginTop:32, background:'var(--accent,#c2410c)', color:'#fff', padding:'16px 40px', borderRadius:50, fontSize:16, fontWeight:600, textDecoration:'none' }}>{cta.text}</a>
      </div>
    </section>
  );
}`,

"/components/sections/Gallery.tsx": `import React, { useState } from 'react';
export default function Gallery({ title, images }: { title: string; images: { src: string; alt: string }[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <section id="gallery" style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:16 }}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setSelected(i)} style={{ borderRadius:12, overflow:'hidden', cursor:'pointer', aspectRatio:'4/3' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
            <img src={img.src} alt={img.alt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.3s' }} />
          </div>
        ))}
      </div>
      {selected !== null && (
        <div onClick={() => setSelected(null)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <img src={images[selected].src} alt={images[selected].alt} style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:8 }} />
        </div>
      )}
    </section>
  );
}`,

"/components/sections/Stats.tsx": `import React from 'react';
type Stat = { value: string; label: string };
export default function Stats({ items, dark }: { items: Stat[]; dark?: boolean }) {
  return (
    <section style={{ padding:'80px 40px', background: dark ? 'var(--accent,#111)' : 'var(--card,#faf9f7)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:\`repeat(\${Math.min(items.length, 4)}, 1fr)\`, gap:32, textAlign:'center' }}>
        {items.map((s, i) => (
          <div key={i}>
            <p style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:800, color: dark ? '#fff' : 'var(--accent,#c2410c)', letterSpacing:'-0.02em' }}>{s.value}</p>
            <p style={{ fontSize:14, color: dark ? 'rgba(255,255,255,0.7)' : 'var(--muted,#888)', marginTop:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/Team.tsx": `import React from 'react';
type Member = { name: string; role: string; image: string; bio?: string };
export default function Team({ title, members }: { title: string; members: Member[] }) {
  return (
    <section id="team" style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:60 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:32 }}>
        {members.map((m, i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <img src={m.image} alt={m.name} style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', margin:'0 auto 16px' }} />
            <h3 style={{ fontSize:18, fontWeight:600 }}>{m.name}</h3>
            <p style={{ fontSize:13, color:'var(--accent,#c2410c)', fontWeight:500, marginTop:4 }}>{m.role}</p>
            {m.bio && <p style={{ fontSize:14, color:'var(--muted,#888)', marginTop:8, lineHeight:1.6 }}>{m.bio}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}`,

"/components/sections/Newsletter.tsx": `import React, { useState } from 'react';
export default function Newsletter({ title, subtitle, placeholder }: { title: string; subtitle?: string; placeholder?: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <section style={{ padding:'80px 40px', background:'var(--accent,#111)', color:'#fff' }}>
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
export default function Timeline({ title, events }: { title: string; events: Event[] }) {
  return (
    <section style={{ padding:'100px 40px', maxWidth:800, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em', marginBottom:60 }}>{title}</h2>
      {events.map((e, i) => (
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
  return (
    <section style={{ padding:'60px 40px', borderTop:'1px solid var(--border,#eee)', borderBottom:'1px solid var(--border,#eee)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
        {title && <p style={{ fontSize:13, textTransform:'uppercase', letterSpacing:'0.2em', color:'var(--muted,#999)', marginBottom:32 }}>{title}</p>}
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:40, alignItems:'center', opacity:0.5 }}>
          {logos.map((l, i) => l.image
            ? <img key={i} src={l.image} alt={l.name} style={{ height:28, objectFit:'contain' }} />
            : <span key={i} style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>{l.name}</span>
          )}
        </div>
      </div>
    </section>
  );
}`,

"/components/sections/BlogGrid.tsx": `import React from 'react';
type Post = { title: string; excerpt: string; image: string; date: string; author: string; category?: string };
export default function BlogGrid({ title, posts }: { title: string; posts: Post[] }) {
  return (
    <section id="blog" style={{ padding:'100px 40px', maxWidth:1200, margin:'0 auto' }}>
      <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:'-0.02em', marginBottom:48 }}>{title}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:32 }}>
        {posts.map((p, i) => (
          <article key={i} style={{ borderRadius:16, overflow:'hidden', border:'1px solid var(--border,#eee)', background:'var(--card,#fff)' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
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
  const [active, setActive] = useState(0);
  return (
    <section style={{ padding:'80px 40px', maxWidth:800, margin:'0 auto' }}>
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border,#eee)' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding:'12px 24px', background:'none', border:'none', borderBottom: active === i ? '2px solid var(--accent,#c2410c)' : '2px solid transparent', marginBottom:-2, fontSize:14, fontWeight: active === i ? 600 : 400, color: active === i ? 'var(--text,#111)' : 'var(--muted,#888)', cursor:'pointer', transition:'all 0.2s' }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding:'32px 0', fontSize:15, lineHeight:1.8, color:'var(--text,#333)' }}>{tabs[active]?.content}</div>
    </section>
  );
}`,

"/components/sections/Banner.tsx": `import React, { useState } from 'react';
export default function Banner({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div style={{ background:'var(--accent,#111)', color:'#fff', padding:'10px 40px', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:16 }}>
      <span>{text}</span>
      {cta && <a href={href||'#'} style={{ color:'#fff', fontWeight:600, textDecoration:'underline' }}>{cta}</a>}
      <button onClick={() => setShow(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:16, marginLeft:8 }}>×</button>
    </div>
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
- Contact: <Contact title="Visit us" items={[{label:"Address", value:"123 Main St"}, {label:"Phone", value:"908-783-4220", href:"tel:9087834220"}]} />
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

RULES:
- The AI just passes DATA as props — components handle all styling, layout, hover effects, and responsive behavior.
- ALWAYS prefer these sections over writing raw HTML. They are pre-styled and look professional.
- When user asks for "checkout", "cart", "ordering", "e-commerce" → use ShopGrid instead of MenuGrid.
- When editing: if the current code uses MenuGrid and user wants cart/checkout, REPLACE MenuGrid with ShopGrid.
- CRITICAL: ONLY import from this exact list. NEVER invent component names like CartDrawer, PizzaBuilder, OrderTracker, ProductCard, HeroSection, etc. If you need a feature not in this list, BUILD IT IN /App.tsx as a regular React component — do NOT import it from /components/sections/. Importing a non-existent component causes a fatal crash.`;
