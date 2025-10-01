import type { ReactNode } from 'react';
import { MessageCircle, TrendingUp } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Icon from './ui/Icon';

export function RightColumn({
  tweets,
  markets,
  LiveChart,
}: {
  tweets: { id: string; text: string; author?: string; likes?: number }[];
  markets: { id: string; question: string; price?: number; volume?: number }[];
  LiveChart?: ReactNode;
}) {
  return (
    <aside className="space-y-4">
      {LiveChart && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">Live signal</h3>
            <Badge>Streaming</Badge>
          </div>
          {LiveChart}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white">Top Tweet</h3>
          <Badge>Live soon</Badge>
        </div>
        {tweets.length ? (
          <ul className="space-y-3">
            {tweets.map((tweet) => (
              <li
                key={tweet.id}
                className="flex items-start gap-3 rounded-xl border border-line-subtle/10 bg-white/5 p-3"
              >
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-brand-red">
                  <Icon I={MessageCircle} className="h-4 w-4" />
                </span>
                <div className="space-y-2">
                  <div className="text-sm text-white/90">{tweet.text}</div>
                  <div className="text-xs text-text-secondary">
                    {tweet.author} · ❤ {tweet.likes ?? 0}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">No tweets yet for this query.</p>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white">Polymarket</h3>
          <Badge>Syncing</Badge>
        </div>
        {markets.length ? (
          <ul className="space-y-3">
            {markets.map((market, index) => (
              <li
                key={market.id}
                className="flex items-start gap-3 rounded-xl border border-line-subtle/10 bg-white/5 p-3"
              >
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-white/80">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <Icon I={TrendingUp} className="h-4 w-4 text-brand-red/80" />
                    <span>{market.question}</span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {typeof market.price === 'number' ? `Price: ${market.price.toFixed(2)}` : '—'}
                    {typeof market.volume === 'number' ? ` · Vol: ${Intl.NumberFormat().format(market.volume)}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">No open markets match this search.</p>
        )}
      </Card>
    </aside>
  );
}
