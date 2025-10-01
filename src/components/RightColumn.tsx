export function RightColumn({
  tweets,
  markets,
}: {
  tweets: { id: string; text: string; author?: string; likes?: number }[];
  markets: { id: string; question: string; price?: number; volume?: number }[];
}) {
  return (
    <aside className="space-y-4">
      <div className="bg-brand-panel border border-glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Top Tweet</h3>
          <span className="text-xs text-white/60">soon</span>
        </div>
        <ul className="space-y-3">
          {tweets.map((tweet) => (
            <li key={tweet.id} className="bg-white/5 rounded-xl p-3">
              <div className="text-sm">{tweet.text}</div>
              <div className="text-xs text-white/60 mt-1">
                {tweet.author} · ❤ {tweet.likes ?? 0}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-brand-panel border border-glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Polymarket</h3>
          <span className="text-xs text-white/60">soon</span>
        </div>
        <ul className="space-y-3">
          {markets.map((market) => (
            <li key={market.id} className="bg-white/5 rounded-xl p-3">
              <div className="text-sm">{market.question}</div>
              <div className="text-xs text-white/60 mt-1">
                {typeof market.price === 'number' ? `Price: ${market.price.toFixed(2)}` : '—'}
                {typeof market.volume === 'number' ? ` · Vol: ${market.volume}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
