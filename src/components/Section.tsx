export default function Section({ title, children }:{ title:string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
