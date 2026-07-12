import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Download, Gauge, Wallet, TrendingUp, IndianRupee } from 'lucide-react';
import { getReport, downloadReportCsv } from '../api/analytics';
import { Button, PageHeader, Card, Spinner } from '../components/ui';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { formatINR, formatNumber } from '../lib/format';
import { useChartColors } from '../lib/chartTheme';

export default function Reports() {
  const colors = useChartColors();
  const { data, isLoading } = useQuery({ queryKey: ['report'], queryFn: getReport });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const active = data.per_vehicle.filter(
    (v) => v.operational_cost > 0 || v.revenue > 0
  );
  const avgRoi =
    active.length > 0
      ? Math.round((active.reduce((s, v) => s + v.roi, 0) / active.length) * 10) / 10
      : 0;

  const axisProps = {
    stroke: colors.axis,
    tick: { fill: colors.axis, fontSize: 11 },
  };
  const tooltipStyle = {
    background: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: 8,
    color: colors.text,
    fontSize: 13,
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Fleet performance, efficiency and profitability"
        actions={
          <Button variant="secondary" onClick={() => downloadReportCsv()}>
            <Download size={16} /> Export CSV
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Fuel Efficiency" accent="blue" icon={<Gauge size={16} />} value={`${data.fuel_efficiency} km/L`} />
        <StatCard label="Fleet Utilization" accent="indigo" icon={<TrendingUp size={16} />} value={`${data.fleet_utilization}%`} />
        <StatCard label="Operational Cost" accent="amber" icon={<Wallet size={16} />} value={formatINR(data.total_operational_cost)} sub="Fuel + Maintenance" />
        <StatCard label="Avg Vehicle ROI" accent={avgRoi >= 0 ? 'green' : 'red'} icon={<IndianRupee size={16} />} value={`${avgRoi}%`} sub={`Revenue ${formatINR(data.monthly_revenue)}`} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Operational Cost per Vehicle" subtitle="Fuel + maintenance (₹)">
          <ResponsiveContainer>
            <BarChart data={active} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="name_model" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(Number(v))} cursor={{ fill: colors.grid, opacity: 0.3 }} />
              <Bar dataKey="operational_cost" fill={colors.series} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vehicle ROI" subtitle="(Revenue − (Maintenance + Fuel)) / Acquisition Cost">
          <ResponsiveContainer>
            <BarChart data={active} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="name_model" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v)}%`} cursor={{ fill: colors.grid, opacity: 0.3 }} />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {active.map((v) => (
                  <Cell key={v.vehicle_id} fill={v.roi >= 0 ? colors.good : colors.bad} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-heading text-sm font-semibold text-slate-900 dark:text-white">
          Per-Vehicle Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Vehicle</th>
                <th className="pb-2 text-right">Distance</th>
                <th className="pb-2 text-right">Fuel</th>
                <th className="pb-2 text-right">Efficiency</th>
                <th className="pb-2 text-right">Operational</th>
                <th className="pb-2 text-right">Revenue</th>
                <th className="pb-2 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.per_vehicle.map((v) => (
                <tr key={v.vehicle_id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 font-medium">{v.name_model}</td>
                  <td className="tabular py-2 text-right">{formatNumber(v.distance)} km</td>
                  <td className="tabular py-2 text-right">{formatNumber(v.fuel_liters)} L</td>
                  <td className="tabular py-2 text-right">{v.fuel_efficiency} km/L</td>
                  <td className="tabular py-2 text-right">{formatINR(v.operational_cost)}</td>
                  <td className="tabular py-2 text-right">{formatINR(v.revenue)}</td>
                  <td className={`tabular py-2 text-right font-semibold ${v.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {v.roi}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
