import Card from './ui/Card';

export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="p-8 text-center text-text-secondary">
      <div className="text-white font-medium mb-1">{title}</div>
      {hint && <div className="text-sm">{hint}</div>}
    </Card>
  );
}
