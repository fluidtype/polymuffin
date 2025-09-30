'use client';

import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

/**
 * Full-page animated background (updated preset).
 * - pointer-events: none to keep UI clickable
 * - zIndex: -1 to stay behind content
 */
export default function ShaderBg() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <ShaderGradientCanvas style={{ width: '100%', height: '100%' }}>
        <ShaderGradient
          control="query"
          urlString="https://www.shadergradient.co/customize?animate=on&axesHelper=on&bgColor1=%23000000&bgColor2=%23000000&brightness=0.75&cAzimuthAngle=180&cDistance=3.9&cPolarAngle=115&cameraZoom=1&color1=%23ff3500&color2=%230a0000&color3=%23000000&destination=onCanvas&embedMode=off&envPreset=studio&format=gif&fov=45&frameRate=10&grain=off&lightType=basic&pixelDensity=1&positionX=-0.5&positionY=0.1&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0&rotationX=0&rotationY=0&rotationZ=235&shader=defaults&type=waterPlane&uAmplitude=0&uDensity=1.1&uFrequency=5.5&uSpeed=0.1&uStrength=2.4&uTime=0.2&wireframe=false"
        />
      </ShaderGradientCanvas>
    </div>
  );
}
