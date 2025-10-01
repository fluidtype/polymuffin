'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function LineBasic({
  data,
  dataKey = 'value',
  color = '#ff2d2d',
}: {
  data: { date: string; value: number }[];
  dataKey?: string;
  color?: string;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
          <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(15,17,22,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              color: '#fff',
            }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
