// Pre-built UI component library — injected into every Sandpack project
// Uses inline styles with CSS variable references (no Tailwind dependency)

export const UI_COMPONENTS: Record<string, string> = {
  "/components/ui/button.tsx": `import React from "react";
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
};
const base: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: "var(--radius, 8px)", fontWeight: 500, cursor: "pointer", transition: "all 0.2s", border: "none", fontFamily: "inherit" };
const variants: Record<string, React.CSSProperties> = {
  default: { ...base, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", padding: "10px 20px" },
  outline: { ...base, background: "transparent", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", padding: "10px 20px" },
  ghost: { ...base, background: "transparent", color: "hsl(var(--foreground))", padding: "10px 20px" },
  destructive: { ...base, background: "hsl(var(--destructive, 0 84% 60%))", color: "#fff", padding: "10px 20px" },
};
const sizes: Record<string, React.CSSProperties> = {
  default: {}, sm: { padding: "6px 12px", fontSize: 13 }, lg: { padding: "14px 28px", fontSize: 16 },
};
export function Button({ variant = "default", size = "default", style, ...props }: ButtonProps) {
  return <button style={{ ...variants[variant], ...sizes[size], ...style }} {...props} />;
}`,

  "/components/ui/card.tsx": `import React from "react";
const cardStyle: React.CSSProperties = { borderRadius: "var(--radius, 12px)", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" };
export function Card({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div style={{ ...cardStyle, ...style }} {...props} />; }
export function CardHeader({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div style={{ padding: "24px 24px 0", ...style }} {...props} />; }
export function CardTitle({ style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", ...style }} {...props} />; }
export function CardDescription({ style, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", marginTop: 4, ...style }} {...props} />; }
export function CardContent({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div style={{ padding: 24, ...style }} {...props} />; }
export function CardFooter({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div style={{ display: "flex", alignItems: "center", padding: "0 24px 24px", ...style }} {...props} />; }`,

  "/components/ui/input.tsx": `import React from "react";
const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: "var(--radius, 8px)", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", padding: "0 12px", fontSize: 14, outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" };
export function Input({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input style={{ ...inputStyle, ...style }} onFocus={e => e.target.style.borderColor = "hsl(var(--primary))"} onBlur={e => e.target.style.borderColor = "hsl(var(--border))"} {...props} />;
}`,

  "/components/ui/badge.tsx": `import React from "react";
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" };
const variants: Record<string, React.CSSProperties> = {
  default: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" },
  secondary: { background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground, var(--foreground)))" },
  outline: { border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", background: "transparent" },
};
export function Badge({ variant = "default", style, ...props }: BadgeProps) {
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600, ...variants[variant], ...style }} {...props} />;
}`,
};

export const UI_COMPONENT_LIST = `
## Pre-built UI components (USE THESE — don't write from scratch):
Import from /components/ui/:
- Button: import { Button } from "./components/ui/button"
  <Button variant="default|outline|ghost|destructive" size="default|sm|lg">Click</Button>
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter: import from "./components/ui/card"
- Input: import { Input } from "./components/ui/input"
- Badge: import { Badge } from "./components/ui/badge"

Use these for consistent, professional UI. They read CSS variables from /index.css.`;
