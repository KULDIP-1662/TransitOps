import { useAuth } from '../context/AuthContext';
import { Card, PageHeader } from '../components/ui';
import { ROLE_LABELS } from '../types';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitle={`Signed in as ${user ? ROLE_LABELS[user.role] : ''}`}
      />
      <Card className="p-8">
        <p className="text-slate-600 dark:text-slate-300">
          Live KPIs, fleet utilisation, and analytics charts arrive in a later
          build phase. Use the sidebar to manage vehicles, drivers, trips,
          maintenance, fuel, and expenses.
        </p>
      </Card>
    </div>
  );
}
