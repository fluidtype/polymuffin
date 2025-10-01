import Card from './ui/Card';

export default function TrendingTile({
  keyword,
  total,
  tone,
  trend,
}: {
  keyword: string;
  total: number;
  tone: number;
  trend: number;
}) {
  const badgeClass = trend > 0 ? 'text-emerald-300' : trend < 0 ? 'text-rose-300' : 'text-white/70';
  const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium capitalize">{keyword}</div>
        <div className={`text-xs ${badgeClass}`}>
          {arrow} {Math.abs(trend).toFixed(1)}%
        </div>
      </div>
      <div className="mt-2 text-sm text-white/70">Events (30d)</div>
      <div className="text-2xl font-semibold">{Intl.NumberFormat().format(total)}</div>
      <div className="mt-1 text-sm text-white/70">Sentiment</div>
      <div className="text-lg">{`${tone >= 0 ? '+' : ''}${tone.toFixed(2)}`}</div>
    </Card>
  );
}
