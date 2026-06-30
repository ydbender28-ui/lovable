import React from 'react';

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#E11D48', // Rose
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#7C3AED', // Violet
  '#0EA5E9', // Sky
  '#F97316', // Orange
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#F43F5E', // Rose 500
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

export default function ColorPicker({ currentColor, onColorChange }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [customColor, setCustomColor] = React.useState(currentColor);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Change accent color"
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: currentColor,
          border: '2px solid rgba(0,0,0,0.15)',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = ''}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 200,
          width: 200,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Accent Color</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginBottom: 10 }}>
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => { onColorChange(color); setCustomColor(color); setOpen(false); }}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: color, border: 'none', cursor: 'pointer',
                  outline: currentColor === color ? '2px solid #6366f1' : 'none',
                  outlineOffset: 1,
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = ''}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={customColor}
              onChange={e => setCustomColor(e.target.value)}
              onBlur={e => { onColorChange(e.target.value); setOpen(false); }}
              style={{ width: 32, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              value={customColor}
              onChange={e => setCustomColor(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onColorChange(customColor); setOpen(false); } }}
              style={{ flex: 1, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}
              placeholder="#6366f1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
