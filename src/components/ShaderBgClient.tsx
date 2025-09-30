'use client';

import dynamic from 'next/dynamic';

const ClientShaderBg = dynamic(() => import('@/components/ShaderBg'), { ssr: false });

export default function ShaderBgClient() {
  return <ClientShaderBg />;
}
