// Pre-built page section components — injected into every Sandpack project
// The AI composes pages by picking sections and passing props (data only, no styling needed)

export const SECTION_COMPONENTS: Record<string, string> = {

"/components/sections/Navbar.tsx": `import React, { useState } from 'react';
export default function Navbar({ brand, links, cta }: { brand: string; links: string[]; cta?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid #eee', padding:'0 40px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <a href="#" style={{ fontSize:20, fontWeight:800, color:'#111', textDecoration:'none', letterSpacing:'-0.02em' }}>{brand}</a>
        <div style={{ display:'flex', gap:32, alignItems:'center' }}>
          {links.map(l => <a key={l} href={\`#\${l.toLowerCase()}\`} style={{ fontSize:14, color:'#555', textDecoration:'none', fontWeight:500, transition:'color 0.2s' }} onMouseOver={e=>(e.target as HTMLElement).style.color='#111'} onMouseOut={e=>(e.target as HTMLElement).style.color='#555'}>{l}</a>)}
          {cta && <a href="#contact" style={{ background:'#111', color:'#fff', padding:'10px 24px', borderRadius:50, fontSize:14, fontWeight:600, textDecoration:'none', transition:'background 0.2s' }} onMouseOver={e=>(e.target as HTMLElement).style.background='#333'} onMouseOut={e=>(e.target as HTMLElement).style.background='#111'}>{cta}</a>}
        </div>
      </div>
    </nav>
  );
}`,

"/components/sections/Hero.tsx": `import React from 'react';
export default function Hero({ tag, title, subtitle, cta1, cta2, image }: { tag?: string; title: string; subtitle: string; cta1?: { text: string; href?: string }; cta2?: { text: string; href?: string }; image: string }) {
  return (
    <section style={{ position:'relative', minHeight:'85vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
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

"/components/sections/MenuGrid.tsx": `import React, { useState } from 'react';
type MenuItem = { name: string; price: string; desc: string; category: string; badge?: string; image?: string };
export default function MenuGrid({ title, subtitle, items, categories }: { title: string; subtitle?: string; items: MenuItem[]; categories?: string[] }) {
  const cats = categories || [...new Set(items.map(i => i.category))];
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? items : items.filter(i => i.category === active);
  return (
    <section id="menu" style={{ padding:'100px 40px', background:'#faf9f7' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <h2 style={{ fontSize:40, fontWeight:700, textAlign:'center', letterSpacing:'-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ textAlign:'center', color:'#666', fontSize:16, marginTop:12, marginBottom:40 }}>{subtitle}</p>}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:48, flexWrap:'wrap' }}>
          {['All', ...cats].map(c => (
            <button key={c} onClick={() => setActive(c)} style={{ padding:'8px 20px', borderRadius:50, border: active===c ? 'none' : '1px solid #ddd', background: active===c ? 'var(--accent, #c2410c)' : '#fff', color: active===c ? '#fff' : '#555', fontSize:14, fontWeight:500, cursor:'pointer', transition:'all 0.2s' }}>{c}</button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:24 }}>
          {filtered.map((item, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:12, border:'1px solid #eee', padding:24, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <h3 style={{ fontSize:17, fontWeight:600 }}>{item.name}</h3>
                  {item.badge && <span style={{ fontSize:11, background:'var(--accent, #c2410c)', color:'#fff', padding:'2px 8px', borderRadius:50, fontWeight:600 }}>{item.badge}</span>}
                </div>
                <p style={{ fontSize:14, color:'#888', marginTop:4 }}>{item.desc}</p>
              </div>
              <span style={{ fontSize:17, fontWeight:700, whiteSpace:'nowrap' }}>{item.price}</span>
            </div>
          ))}
        </div>
      </div>
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
                  <button onClick={() => addToCart(item)} style={{ marginTop:16, width:'100%', background:'#111', color:'#fff', border:'none', padding:'12px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', transition:'background 0.2s' }} onMouseOver={e=>(e.target as HTMLElement).style.background='#333'} onMouseOut={e=>(e.target as HTMLElement).style.background='#111'}>Add to Cart</button>
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

};

export const SECTION_COMPONENT_LIST = `
## Pre-built page sections (USE THESE to build pages — don't write layouts from scratch):
Import from /components/sections/:

- Navbar: <Navbar brand="Name" links={["Menu","Story","Contact"]} cta="Order Now" />
- Hero: <Hero tag="Est. 2018" title="Big headline" subtitle="Description" cta1={{text:"See menu"}} cta2={{text:"Find us"}} image="{{unsplash:coffee shop|1600x900}}" />
- Features: <Features tag="Why us" title="Heading" items={[{icon:"☕", title:"Feature", desc:"Description"}]} />
- MenuGrid: <MenuGrid title="Our Menu" items={[{name:"Espresso", price:"$3.50", desc:"Rich shot", category:"Coffee", badge:"Popular"}]} />
- SplitSection: <SplitSection tag="Our story" title="Heading" text="Paragraph..." image="{{unsplash:...|800x600}}" reverse={false} />
- Testimonials: <Testimonials title="What people say" items={[{quote:"Amazing!", name:"Sarah", role:"Regular", image:"{{unsplash:woman portrait|200x200}}"}]} />
- Contact: <Contact title="Visit us" items={[{label:"Address", value:"123 Main St"}, {label:"Phone", value:"908-783-4220", href:"tel:9087834220"}]} />
- Footer: <Footer brand="Name" tagline="Tagline" />
- ShopGrid: <ShopGrid title="Our Menu" items={[{id:1, name:"Espresso", price:3.50, desc:"Rich shot", category:"Coffee", badge:"Popular", image:"{{unsplash:espresso|400x300}}"}]} />
  → Has built-in Add to Cart buttons, cart drawer with +/- quantity, checkout button. USE THIS instead of MenuGrid when user wants ordering/checkout/cart.

RULES:
- The AI just passes DATA as props — components handle all styling, layout, hover effects, and responsive behavior.
- ALWAYS prefer these sections over writing raw HTML. They are pre-styled and look professional.
- When user asks for "checkout", "cart", "ordering", "e-commerce" → use ShopGrid instead of MenuGrid.
- When editing: if the current code uses MenuGrid and user wants cart/checkout, REPLACE MenuGrid with ShopGrid.`;
