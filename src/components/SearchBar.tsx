'use client';
export default function SearchBar() {
  return (
    <form className="w-full flex gap-2">
      <input className="flex-1 border rounded-xl p-3 bg-white/10" placeholder="Search…" />
      <button className="px-4 py-2 rounded-xl border bg-white/10" type="submit">Go</button>
    </form>
  );
}
