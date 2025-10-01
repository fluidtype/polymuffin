type Row = {
  date: string;
  title: string;
  tone?: number;
  impact?: number;
  source?: string;
};

export default function EventsList({ rows }: { rows: Row[] }) {
  return (
    <div className="bg-brand-panel border border-glass rounded-2xl">
      <div className="grid grid-cols-12 px-4 py-2 text-xs text-white/60 border-b border-glass">
        <div className="col-span-2">Date</div>
        <div className="col-span-7">Title</div>
        <div className="col-span-1 text-right">Tone</div>
        <div className="col-span-1 text-right">Impact</div>
        <div className="col-span-1 text-right">Src</div>
      </div>
      <div className="divide-y divide-glass">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-white/5">
            <div className="col-span-2 text-sm text-white/80">{row.date}</div>
            <div className="col-span-7 text-sm">{row.title}</div>
            <div className="col-span-1 text-right text-sm">{row.tone ?? '—'}</div>
            <div className="col-span-1 text-right text-sm">{row.impact ?? '—'}</div>
            <div className="col-span-1 text-right text-xs">
              {row.source ? (
                <a className="text-brand-red underline" href={row.source} target="_blank" rel="noreferrer">
                  link
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
