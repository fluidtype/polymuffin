import Card from '@/components/ui/Card';
import Skeleton from './Skeleton';

export default function ChartSkeleton() {
  return (
    <Card className="p-4">
      <div className="h-6 mb-3">
        <Skeleton className="h-5 w-56" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </Card>
  );
}
