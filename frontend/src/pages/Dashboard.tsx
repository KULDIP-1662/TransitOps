import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  CircleCheck,
  Wrench,
  Route,
  Clock,
  Users,
  Gauge,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { getDashboard } from '../api/analytics';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Badge, Card, Spinner } from '../components/ui';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { ROLE_LABELS, tripCode } from '../types';
import { tripStatusColor } from '../lib/status';
import { useChartColors } from '../lib/chartTheme';

export default function Dashboard() {
  const { user } = useAuth();
  const colors = useChartColors();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const statusData = data.vehicle_status.filter((s) => s.count > 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitle={`Signed in as ${user ? ROLE_LABELS[user.role] : ''} · fleet overview`}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Active Vehicles" accent="indigo" icon={<Truck size={16} />} value={data.active_vehicles} />
        <StatCard label="Available" accent="green" icon={<CircleCheck size={16} />} value={data.available_vehicles} />
        <StatCard label="In Maintenance" accent="amber" icon={<Wrench size={16} />} value={data.in_maintenance} />
        <StatCard label="Fleet Utilization" accent="blue" icon={<Gauge size={16} />} value={`${data.fleet_utilization}%`} />
        <StatCard label="Active Trips" accent="blue" icon={<Route size={16} />} value={data.active_trips} />
        <StatCard label="Pending Trips" accent="slate" icon={<Clock size={16} />} value={data.pending_trips} />
        <StatCard label="Drivers On Duty" accent="green" icon={<Users size={16} />} value={data.drivers_on_duty} sub={`of ${data.total_drivers}`} />
        <StatCard label="Completed Trips" accent="indigo" icon={<Route size={16} />} value={data.completed_trips} />
      </div>

      <div className="mb-4">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            {data.license_alerts.length > 0 ? (
              <ShieldAlert size={16} className="text-amber-500" />
            ) : (
              <ShieldCheck size={16} className="text-emerald-500" />
            )}
            <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
              Compliance Alerts
            </h3>
          </div>
          {data.license_alerts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              All driver licenses are valid. No compliance issues.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.license_alerts.map((a) => (
                <div
                  key={a.driver_id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
                >
                  <span className="font-medium">{a.name}</span>
                  <span className="tabular text-xs text-slate-400">{a.license_number}</span>
                  {a.expired ? (
                    <Badge color="red">License expired</Badge>
                  ) : (
                    <Badge color="amber">Expires in {a.days_to_expiry}d</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChartCard title="Vehicle Status" subtitle="Fleet composition">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {statusData.map((s) => (
                    <Cell key={s.label} fill={colors.status[s.label] ?? colors.axis} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: 8,
                    color: colors.text,
                    fontSize: 13,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13, color: colors.text }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-4">
            <h3 className="mb-3 font-heading text-sm font-semibold text-slate-900 dark:text-white">
              Recent Trips
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2">Trip</th>
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2">Driver</th>
                    <th className="pb-2">Route</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_trips.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="tabular py-2 font-medium">{tripCode(t.id)}</td>
                      <td className="tabular py-2">{t.vehicle_name ?? '—'}</td>
                      <td className="py-2">{t.driver_name ?? '—'}</td>
                      <td className="py-2 text-xs text-slate-500 dark:text-slate-400">
                        {t.source} → {t.destination}
                      </td>
                      <td className="py-2">
                        <Badge color={tripStatusColor(t.status)}>{t.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
