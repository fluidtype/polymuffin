import Card from './ui/Card';
import EmptyState from './EmptyState';

type Row = {
  date: string;
  title: string;
  tone?: number;
  impact?: number;
  source?: string;
};

export default function EventsList({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return <EmptyState title="No events tracked" hint="Adjust the range or sources to surface GDELT events." />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-12 px-4 py-2 text-xs text-text-muted border-b border-line-subtle/10">
        <div className="col-span-2">Date</div>
        <div className="col-span-7">Title</div>
        <div className="col-span-1 text-right">Tone</div>
        <div className="col-span-1 text-right">Impact</div>
        <div className="col-span-1 text-right">Src</div>
      </div>
      <div className="divide-y divide-line-subtle/10">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-12 px-4 py-3 items-center text-sm text-white/90 hover:bg-white/5 transition-colors"
          >
            <div className="col-span-2 text-text-secondary">{row.date}</div>
            <div className="col-span-7">{row.title}</div>
            <div className="col-span-1 text-right">{row.tone ?? '—'}</div>
            <div className="col-span-1 text-right">{row.impact ?? '—'}</div>
            <div className="col-span-1 text-right text-xs">
              {row.source ? (
                <a
                  className="text-brand-red underline underline-offset-2"
                  href={row.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  link
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
