export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red shadow-glow">
      {message}
    </div>
  );
}
