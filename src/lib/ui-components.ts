// Pre-built UI component library — injected into every Sandpack project
// The AI references these instead of writing UI from scratch

export const UI_COMPONENTS: Record<string, string> = {
  "/components/ui/button.tsx": `import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

const variants: Record<string, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-8 text-base",
  icon: "h-10 w-10",
};

export function Button({ variant = "default", size = "default", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={\`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 \${variants[variant]} \${sizes[size]} \${className}\`}
      {...props}
    />
  );
}`,

  "/components/ui/card.tsx": `import React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={\`rounded-lg border border-border bg-card text-card-foreground shadow-sm \${className}\`} {...props} />;
}
export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={\`flex flex-col space-y-1.5 p-6 \${className}\`} {...props} />;
}
export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={\`text-2xl font-semibold leading-none tracking-tight \${className}\`} {...props} />;
}
export function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={\`text-sm text-muted-foreground \${className}\`} {...props} />;
}
export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={\`p-6 pt-0 \${className}\`} {...props} />;
}
export function CardFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={\`flex items-center p-6 pt-0 \${className}\`} {...props} />;
}`,

  "/components/ui/input.tsx": `import React from "react";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={\`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`}
      {...props}
    />
  );
}`,

  "/components/ui/badge.tsx": `import React from "react";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
};

const variants: Record<string, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return <div className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors \${variants[variant]} \${className}\`} {...props} />;
}`,

  "/components/ui/separator.tsx": `import React from "react";

export function Separator({ className = "", orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      className={\`shrink-0 bg-border \${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"} \${className}\`}
    />
  );
}`,

  "/components/ui/avatar.tsx": `import React from "react";

export function Avatar({ src, alt, fallback, className = "" }: { src?: string; alt?: string; fallback?: string; className?: string }) {
  return (
    <div className={\`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full \${className}\`}>
      {src ? (
        <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
          {fallback || "?"}
        </div>
      )}
    </div>
  );
}`,

  "/components/ui/textarea.tsx": `import React from "react";

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={\`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`}
      {...props}
    />
  );
}`,
};

// List of available components for the system prompt
export const UI_COMPONENT_LIST = `
## Pre-built UI components (USE THESE — don't write from scratch):
Import from /components/ui/:
- Button: import { Button } from "./components/ui/button"
  <Button variant="default|outline|ghost|destructive|secondary|link" size="default|sm|lg|icon">
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter: import from "./components/ui/card"
- Input: import { Input } from "./components/ui/input"
  <Input placeholder="..." value={v} onChange={e => setV(e.target.value)} />
- Badge: import { Badge } from "./components/ui/badge"
  <Badge variant="default|secondary|outline|destructive">
- Separator: import { Separator } from "./components/ui/separator"
- Avatar: import { Avatar } from "./components/ui/avatar"
  <Avatar src="..." fallback="JD" />
- Textarea: import { Textarea } from "./components/ui/textarea"

ALWAYS use these components instead of writing raw HTML buttons/inputs/cards.
They are pre-styled with the design token system and look professional.`;
