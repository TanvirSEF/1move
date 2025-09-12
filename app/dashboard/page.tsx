/**
 * Professional Dashboard Page
 * Server-side rendered page with client-side interactivity
 */

import React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DashboardClient } from './dashboard-client';
import { getCachedCircleMembers } from '@/app/actions/circle-actions';

// This page uses both server and client components for optimal performance
export default async function DashboardPage() {
  // Try to get initial data on the server (optional)
  let initialData = null;
  
  try {
    // Attempt to fetch data on the server for faster initial load
    const result = await getCachedCircleMembers();
    if (result.success) {
      initialData = {
        data: result.data,
        endpoint: result.endpoint,
        timestamp: result.timestamp,
      };
    }
  } catch (error) {
    // If server-side fetch fails, client will handle it
    console.log('Server-side data fetch failed, will load on client:', error);
  }

  return (
    <SidebarProvider
      style={{ '--sidebar-width': 'calc(var(--spacing) * 72)' } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <DashboardClient initialData={initialData} />
      </SidebarInset>
    </SidebarProvider>
  );
}
