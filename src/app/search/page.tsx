export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? '';
  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Search</h1>
      <p className="opacity-80">Results for: “{q}” (placeholder)</p>
    </main>
  );
}
