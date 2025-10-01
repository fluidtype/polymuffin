'use client';
import { useEffect, useState } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

function canUseShader() {
  if (typeof window === 'undefined') return false;
  const small = window.matchMedia('(max-width: 640px)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !small && !reduce;
}

export default function ShaderBg() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(canUseShader());
  }, []);

  if (!enabled) {
    return (
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b from-black via-black to-red-950"
      />
    );
  }

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <ShaderGradientCanvas style={{ width: '100%', height: '100%' }}>
        <ShaderGradient
          control="query"
          urlString="YOUR_UPDATED_SHADER_URL"
        />
      </ShaderGradientCanvas>
    </div>
  );
}
