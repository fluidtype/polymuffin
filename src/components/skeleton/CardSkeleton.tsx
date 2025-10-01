import Card from '@/components/ui/Card';
import Skeleton from './Skeleton';

export default function CardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-6 w-44" />
    </Card>
  );
}
