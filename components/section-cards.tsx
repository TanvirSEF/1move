// components/section-cards.tsx

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BrokerDetail {
  brokerId: string;
  brokerName: string;
  brokerEmail: string;
  referredCount: number;
  referredMembers: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
  }>;
}

interface Stats {
  totalMembers: number;
  totalBrokers: number;
  brokerDetails: BrokerDetail[];
}

interface SectionCardsProps {
  stats: Stats;
  isLoading: boolean;
  error: string | null;
}

export function SectionCards({ stats, isLoading, error }: SectionCardsProps) {
  // 1. Handle Loading State
  if (isLoading) {
    return (
      <div className="grid gap-4 px-4 @md:grid-cols-2 @xl:grid-cols-4 lg:px-6">
        <Card>
          <div className="flex flex-col gap-1.5 p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-1.5 p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-12" />
          </div>
        </Card>
      </div>
    );
  }

  // 2. Handle Error State
  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="bg-destructive/10 border-destructive">
          <div className="p-4">
            <p className="text-destructive font-semibold">Could not load stats</p>
            <p className="text-destructive/80 text-sm">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Handle Success State
  const topBroker = stats.brokerDetails.length > 0 ? stats.brokerDetails[0] : null;
  const totalReferrals = stats.brokerDetails.reduce((sum, broker) => sum + broker.referredCount, 0);

  return (
    <div className="grid gap-4 px-4 @md:grid-cols-2 @xl:grid-cols-4 lg:px-6">
      <Card>
        <div className="flex flex-col gap-0.5 p-4">
          <div className="text-sm text-muted-foreground">Total Members</div>
          <div className="text-2xl font-semibold">{stats.totalMembers.toLocaleString()}</div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-0.5 p-4">
          <div className="text-sm text-muted-foreground">Total Brokers</div>
          <div className="text-2xl font-semibold">{stats.totalBrokers.toLocaleString()}</div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-0.5 p-4">
          <div className="text-sm text-muted-foreground">Total Referrals</div>
          <div className="text-2xl font-semibold">{totalReferrals.toLocaleString()}</div>
        </div>
      </Card>
      {topBroker && (
        <Card>
          <div className="flex flex-col gap-0.5 p-4">
            <div className="text-sm text-muted-foreground">Top Broker</div>
            <div className="text-lg font-semibold truncate" title={topBroker.brokerName}>
              {topBroker.brokerName}
            </div>
            <div className="text-sm text-muted-foreground">
              {topBroker.referredCount} referrals
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
