/**
 * Home Page - Redirects to Dashboard
 * Maintains clean URL structure while using the professional dashboard
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the professional dashboard
  redirect('/dashboard');
}