'use client';
import { useEffect, useState } from 'react';
import {
  ShaderGradientCanvas,
  ShaderGradient,
  type GradientT,
} from '@shadergradient/react';

const SHADER_PROPS: GradientT = {
  control: 'props',
  type: 'plane',
  animate: 'on',
  range: 'enabled',
  rangeStart: 0,
  rangeEnd: 40,
  uAmplitude: 1,
  uDensity: 1.25,
  uSpeed: 0.32,
  uStrength: 4.2,
  uFrequency: 5.4,
  color1: '#070417',
  color2: '#421c7a',
  color3: '#f97316',
  reflection: 0.12,
  rotationX: 0,
  rotationY: 12,
  rotationZ: 48,
  positionX: -1.5,
  positionY: 0,
  positionZ: 0,
  lightType: '3d',
  brightness: 1.18,
  envPreset: 'city',
  grain: 'on',
  grainBlending: 0.35,
  cAzimuthAngle: 210,
  cPolarAngle: 92,
  cDistance: 3.6,
  cameraZoom: 1,
};

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
        className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b from-[#070417] via-[#1b1034] to-black"
      />
    );
  }

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <ShaderGradientCanvas style={{ width: '100%', height: '100%' }}>
        <ShaderGradient {...SHADER_PROPS} />
      </ShaderGradientCanvas>
    </div>
  );
}
