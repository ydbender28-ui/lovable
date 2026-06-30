import React from 'react';

export interface Theme {
  name: string;
  bg: string;
  fg: string;
  card: string;
  primary: string;
  primaryFg: string;
  muted: string;
  border: string;
  accent: string;
}

export const QUICK_THEMES: Theme[] = [
  { name: 'Indigo', bg: '#FAFAFA', fg: '#0F172A', card: '#FFFFFF', primary: '#6366F1', primaryFg: '#FFFFFF', muted: '#F1F5F9', border: '#E2E8F0', accent: '#4F46E5' },
  { name: 'Rose', bg: '#FFF9F9', fg: '#1C0A0A', card: '#FFFFFF', primary: '#E11D48', primaryFg: '#FFFFFF', muted: '#FFF1F2', border: '#FECDD3', accent: '#BE123C' },
  { name: 'Emerald', bg: '#F0FDF4', fg: '#052E16', card: '#FFFFFF', primary: '#10B981', primaryFg: '#FFFFFF', muted: '#DCFCE7', border: '#BBF7D0', accent: '#059669' },
  { name: 'Amber', bg: '#FFFBEB', fg: '#1C1200', card: '#FFFFFF', primary: '#F59E0B', primaryFg: '#000000', muted: '#FEF3C7', border: '#FDE68A', accent: '#D97706' },
  { name: 'Violet', bg: '#F5F0FF', fg: '#1E0A40', card: '#FFFFFF', primary: '#7C3AED', primaryFg: '#FFFFFF', muted: '#EDE9FE', border: '#DDD6FE', accent: '#6D28D9' },
  { name: 'Sky', bg: '#F0F9FF', fg: '#0C1A2E', card: '#FFFFFF', primary: '#0EA5E9', primaryFg: '#FFFFFF', muted: '#E0F2FE', border: '#BAE6FD', accent: '#0284C7' },
  { name: 'Dark', bg: '#0F172A', fg: '#E8E8F0', card: '#1E293B', primary: '#6366F1', primaryFg: '#FFFFFF', muted: '#1E293B', border: '#334155', accent: '#8B5CF6' },
  { name: 'Midnight', bg: '#0A0A0F', fg: '#E0E0FF', card: '#12121A', primary: '#A855F7', primaryFg: '#FFFFFF', muted: '#1A1A28', border: '#2D2D42', accent: '#7C3AED' },
  { name: 'Forest', bg: '#F0F7F0', fg: '#0D2010', card: '#FFFFFF', primary: '#16A34A', primaryFg: '#FFFFFF', muted: '#DCFCE7', border: '#BBF7D0', accent: '#15803D' },
  { name: 'Slate', bg: '#F8FAFC', fg: '#0F172A', card: '#FFFFFF', primary: '#475569', primaryFg: '#FFFFFF', muted: '#F1F5F9', border: '#E2E8F0', accent: '#334155' },
];

export function applyThemeToCss(css: string, theme: Theme): string {
  // Replace CSS variable values in :root block
  return css
    .replace(/--bg:\s*[^;]+;/, `--bg: ${theme.bg};`)
    .replace(/--fg:\s*[^;]+;/, `--fg: ${theme.fg};`)
    .replace(/--card:\s*[^;]+;/, `--card: ${theme.card};`)
    .replace(/--primary:\s*[^;]+;/, `--primary: ${theme.primary};`)
    .replace(/--primary-fg:\s*[^;]+;/, `--primary-fg: ${theme.primaryFg};`)
    .replace(/--muted:\s*[^;]+;/, `--muted: ${theme.muted};`)
    .replace(/--border:\s*[^;]+;/, `--border: ${theme.border};`)
    .replace(/--accent:\s*[^;]+;/, `--accent: ${theme.accent};`);
}

interface ThemeSwitcherProps {
  onThemeChange: (theme: Theme) => void;
  currentTheme?: string;
}

export default function ThemeSwitcher({ onThemeChange, currentTheme }: ThemeSwitcherProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Change theme"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          border: '1px solid var(--border, #e2e8f0)',
          background: 'var(--card, white)', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: 'var(--fg, #0f172a)',
        }}
      >
        🎨 Theme
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
          zIndex: 100, minWidth: 220,
        }}>
          {QUICK_THEMES.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => { onThemeChange(theme); setOpen(false); }}
              title={theme.name}
              style={{
                width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                border: currentTheme === theme.name ? '2px solid #6366f1' : '2px solid transparent',
                background: theme.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: theme.primaryFg, fontWeight: 700,
                transition: 'transform 0.1s',
                boxShadow: `0 0 0 2px ${theme.bg}, 0 0 0 3px ${theme.border}`,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = ''}
            >
              {theme.name.slice(0, 2)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
