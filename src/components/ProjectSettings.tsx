'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onRename: (name: string) => void;
}

export default function ProjectSettings({ projectId, projectName, onClose, onRename }: Props) {
  const [name, setName] = useState(projectName);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim() || name === projectName) { onClose(); return; }
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      onRename(name.trim());
      onClose();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    router.push('/dashboard');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--card, #fff)', borderRadius: 16, padding: 32,
        maxWidth: 440, width: '100%', border: '1px solid var(--border, #ececf1)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg, #17171c)', margin: 0 }}>Project Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted, #71717f)', fontSize: 20 }}>×</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg, #17171c)', marginBottom: 6 }}>Site Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="My Awesome Site"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border, #ececf1)', background: 'var(--bg, #f9f9fb)',
              color: 'var(--fg, #17171c)', fontSize: 14, boxSizing: 'border-box',
            }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, background: '#6a1ff7',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: 8, background: 'var(--bg, #f9f9fb)',
              color: 'var(--muted, #71717f)', border: '1px solid var(--border, #ececf1)', cursor: 'pointer', fontSize: 14,
            }}
          >
            Cancel
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border, #ececf1)', paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Danger Zone</div>
          {confirmDelete ? (
            <div>
              <p style={{ fontSize: 13, color: 'var(--muted, #71717f)', marginBottom: 10 }}>Are you sure? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--bg, #f9f9fb)', color: 'var(--muted, #71717f)', border: '1px solid var(--border, #ececf1)', cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 16px', borderRadius: 8, background: 'transparent',
                color: '#ef4444', border: '1px solid #ef444440', cursor: 'pointer', fontSize: 13,
              }}
            >
              🗑 Delete this project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
