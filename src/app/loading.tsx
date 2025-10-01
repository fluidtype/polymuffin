import CardSkeleton from '@/components/skeleton/CardSkeleton';
import ChartSkeleton from '@/components/skeleton/ChartSkeleton';

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <CardSkeleton />
      </div>
    </div>
  );
}
