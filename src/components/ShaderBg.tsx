'use client';
import dynamic from 'next/dynamic';
const Canvas = dynamic(() => import('@shadergradient/react').then(m => m.ShaderGradientCanvas), { ssr: false });
const Gradient = dynamic(() => import('@shadergradient/react').then(m => m.ShaderGradient), { ssr: false });

export default function ShaderBg() {
  return (
    <div aria-hidden style={{ position:'fixed', inset:0, zIndex:-1, pointerEvents:'none' }}>
      <Canvas style={{ width:'100%', height:'100%' }}>
        <Gradient
          control="query"
          urlString="https://www.shadergradient.co/customize?animate=on&bgColor1=%23070b11&bgColor2=%23070b11&brightness=1.1&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&color1=%2352ff89&color2=%23dbba95&color3=%23d0bce1&lightType=3d&shader=defaults&type=plane&uDensity=1.15&uFrequency=5&uSpeed=0.35&uStrength=3.8&wireframe=false"
        />
      </Canvas>
    </div>
  );
}
