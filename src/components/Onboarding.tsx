'use client';
import { useState } from 'react';

const BUSINESS_TYPES = [
  { emoji: '🍕', label: 'Restaurant', prompt: 'a modern restaurant with online ordering and a beautiful menu' },
  { emoji: '💆', label: 'Spa & Salon', prompt: 'a luxury spa and beauty salon with booking, services, and team' },
  { emoji: '💪', label: 'Gym & Fitness', prompt: 'a high-energy gym and fitness studio with classes, trainers, and memberships' },
  { emoji: '🛍️', label: 'Online Store', prompt: 'a premium ecommerce store with product grid, cart, and checkout' },
  { emoji: '⚖️', label: 'Law Firm', prompt: 'a professional law firm website with practice areas, team, and contact' },
  { emoji: '🏠', label: 'Real Estate', prompt: 'a real estate agent website with property listings and contact form' },
  { emoji: '💻', label: 'SaaS / App', prompt: 'a modern SaaS landing page with features, pricing, and signup' },
  { emoji: '📸', label: 'Photography', prompt: 'a photography portfolio with gallery, services, and booking' },
  { emoji: '🦷', label: 'Dental', prompt: 'a modern dental practice with services, team, and appointment booking' },
  { emoji: '🏨', label: 'Hotel', prompt: 'a luxury hotel website with rooms, amenities, gallery, and booking' },
  { emoji: '🐕', label: 'Pet Business', prompt: 'a pet grooming and boarding business with services and booking' },
  { emoji: '✨', label: 'Something else', prompt: '' },
];

interface Props {
  onComplete: (prompt: string) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<typeof BUSINESS_TYPES[0] | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSelect = (type: typeof BUSINESS_TYPES[0]) => {
    setSelected(type);
    if (type.label !== 'Something else') {
      setStep(3);
    } else {
      setStep(3);
    }
  };

  const handleBuild = async () => {
    const prompt = selected?.label === 'Something else' ? customPrompt : (selected?.prompt ?? '');
    if (!prompt.trim()) return;

    // Mark onboarding complete in the background
    await fetch('/api/user/onboarding', { method: 'POST' }).catch(() => {});
    onComplete(prompt);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 20, padding: '48px 40px',
        maxWidth: 600, width: '100%', border: '1px solid #ececf1',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#17171c', marginBottom: 12 }}>
              Build your first site in 30 seconds
            </h1>
            <p style={{ color: '#71717f', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
              Just describe what you want — AI builds a complete, professional website instantly.
              No code, no templates, no limits.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
              {['Beautiful design', 'Mobile ready', 'Publish instantly'].map(f => (
                <span key={f} style={{
                  padding: '6px 14px',
                  background: 'rgba(106,31,247,0.08)',
                  color: '#6a1ff7',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  border: '1px solid rgba(106,31,247,0.15)',
                }}>✓ {f}</span>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: '14px 40px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6a1ff7, #0a8ff0)',
                color: '#ffffff', border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 600,
                boxShadow: '0 4px 18px rgba(106,31,247,0.30)',
              }}
            >
              Get started →
            </button>
          </div>
        )}

        {/* Step 2 — Pick business type */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#17171c', marginBottom: 8 }}>What kind of site?</h2>
            <p style={{ color: '#71717f', fontSize: 14, marginBottom: 24 }}>Pick a type and we'll build it instantly</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {BUSINESS_TYPES.map(type => (
                <button
                  key={type.label}
                  onClick={() => handleSelect(type)}
                  style={{
                    padding: '16px 12px', borderRadius: 10,
                    border: `2px solid ${selected?.label === type.label ? '#6a1ff7' : '#ececf1'}`,
                    background: selected?.label === type.label ? 'rgba(106,31,247,0.07)' : '#fbfbfc',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#6a1ff7';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(106,31,247,0.05)';
                  }}
                  onMouseLeave={e => {
                    if (selected?.label !== type.label) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#ececf1';
                      (e.currentTarget as HTMLButtonElement).style.background = '#fbfbfc';
                    }
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{type.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#17171c' }}>{type.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Confirm & build */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{selected?.emoji || '✨'}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#17171c', marginBottom: 12 }}>
              Ready to build your {selected?.label} site!
            </h2>
            {selected?.label === 'Something else' ? (
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Describe your site in a few words..."
                style={{
                  width: '100%', padding: 12, borderRadius: 8,
                  border: '1px solid #ececf1', background: '#fbfbfc',
                  color: '#17171c', fontSize: 14, marginBottom: 16,
                  resize: 'vertical', minHeight: 80,
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <p style={{ color: '#71717f', marginBottom: 24, fontSize: 15 }}>
                "{selected?.prompt}"
              </p>
            )}
            <button
              onClick={handleBuild}
              style={{
                padding: '14px 48px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6a1ff7, #0a8ff0)',
                color: '#ffffff', border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 600,
                boxShadow: '0 4px 18px rgba(106,31,247,0.30)',
              }}
            >
              ⚡ Build it now
            </button>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', color: '#71717f', cursor: 'pointer', fontSize: 13 }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
