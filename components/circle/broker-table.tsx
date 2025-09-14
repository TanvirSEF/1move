/**
 * Professional Broker Statistics Table Component
 * Displays top brokers with sorting, filtering, and pagination
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BrokerDetail } from '@/types/circle';

interface BrokerTableProps {
  brokers: BrokerDetail[];
  totalMembers: number;
  isLoading?: boolean;
  className?: string;
}

type SortField = 'brokerName' | 'referredCount' | 'percentage';
type SortDirection = 'asc' | 'desc';

export function BrokerTable({ 
  brokers, 
  totalMembers, 
  isLoading = false, 
  className 
}: BrokerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('referredCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter and sort brokers
  const processedBrokers = useMemo(() => {
    const filtered = brokers.filter(broker =>
      broker.brokerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Add percentage calculation
    const withPercentage = filtered.map(broker => ({
      ...broker,
      percentage: totalMembers > 0 ? (broker.referredCount / totalMembers) * 100 : 0,
    }));

    // Sort
    withPercentage.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'brokerName':
          aValue = a.brokerName.toLowerCase();
          bValue = b.brokerName.toLowerCase();
          break;
        case 'referredCount':
          aValue = a.referredCount;
          bValue = b.referredCount;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        default:
          aValue = a.referredCount;
          bValue = b.referredCount;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return withPercentage;
  }, [brokers, searchTerm, sortField, sortDirection, totalMembers]);

  // Pagination
  const totalPages = Math.ceil(processedBrokers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBrokers = processedBrokers.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Loading skeleton
  if (isLoading && brokers.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (brokers.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🤝</div>
          <h3 className="font-semibold text-lg mb-2">No Brokers Yet</h3>
          <p className="text-muted-foreground">
            Start referring members to see broker statistics here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Top Brokers</h3>
            <p className="text-sm text-muted-foreground">
              {processedBrokers.length} of {brokers.length} brokers
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          
          {/* Search */}
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search brokers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-3 font-medium">
                  <span className="text-sm text-muted-foreground">Rank</span>
                </th>
                <th 
                  className="text-left py-3 px-3 font-medium cursor-pointer hover:bg-muted/50 rounded"
                  onClick={() => handleSort('brokerName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Broker Name</span>
                    <span className="text-xs">{getSortIcon('brokerName')}</span>
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-3 font-medium cursor-pointer hover:bg-muted/50 rounded"
                  onClick={() => handleSort('referredCount')}
                >
                  <div className="flex items-center gap-1">
                    <span>Referrals</span>
                    <span className="text-xs">{getSortIcon('referredCount')}</span>
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-3 font-medium cursor-pointer hover:bg-muted/50 rounded"
                  onClick={() => handleSort('percentage')}
                >
                  <div className="flex items-center gap-1">
                    <span>Percentage</span>
                    <span className="text-xs">{getSortIcon('percentage')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBrokers.map((broker, index) => {
                const globalRank = startIndex + index + 1;
                const isTopBroker = globalRank === 1;
                
                return (
                  <tr 
                    key={broker.brokerId} 
                    className={`border-b hover:bg-muted/50 transition-colors ${
                      isTopBroker ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          #{globalRank}
                        </span>
                        {isTopBroker && <span className="text-amber-500">👑</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium truncate max-w-48" title={broker.brokerName}>
                        {broker.brokerName}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge 
                        variant={isTopBroker ? 'default' : 'secondary'}
                        className="font-mono"
                      >
                        {broker.referredCount.toLocaleString()} members
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {broker.percentage.toFixed(1)}%
                        </span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              isTopBroker ? 'bg-amber-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(broker.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedBrokers.length)} of {processedBrokers.length} brokers
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {brokers.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Brokers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {brokers.reduce((sum, b) => sum + b.referredCount, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Referrals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {brokers.length > 0 ? (brokers.reduce((sum, b) => sum + b.referredCount, 0) / brokers.length).toFixed(1) : '0'}
              </div>
              <div className="text-xs text-muted-foreground">Avg per Broker</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {totalMembers > 0 ? ((brokers.reduce((sum, b) => sum + b.referredCount, 0) / totalMembers) * 100).toFixed(1) : '0'}%
              </div>
              <div className="text-xs text-muted-foreground">Referral Rate</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
