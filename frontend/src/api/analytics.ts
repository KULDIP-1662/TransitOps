import api from '../lib/api';
import type { DashboardData, ReportData } from '../types';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/dashboard');
  return data;
}

export async function getReport(): Promise<ReportData> {
  const { data } = await api.get<ReportData>('/reports');
  return data;
}

export async function downloadReportCsv(): Promise<void> {
  const res = await api.get('/reports/export.csv', { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transitops_report.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
