export default function SectionTitle({ title, subtitle }:{ title:string; subtitle?:string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-wide">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary/80">{subtitle}</p>}
      </div>
    </div>
  );
}
