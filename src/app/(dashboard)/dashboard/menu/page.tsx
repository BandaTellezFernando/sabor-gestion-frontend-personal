import { redirect } from 'next/navigation';

export default function DashboardMenuRedirectPage() {
  redirect('/dashboard/platos');
}
