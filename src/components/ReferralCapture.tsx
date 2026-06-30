'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReferralCaptureInner() {
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get('ref');
    if (ref) localStorage.setItem('referral_code', ref);
  }, [params]);
  return null;
}

export default function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureInner />
    </Suspense>
  );
}
