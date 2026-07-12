import api from '../lib/api';
import type { Maintenance, MaintenanceInput } from '../types';

export async function getMaintenance(): Promise<Maintenance[]> {
  const { data } = await api.get<Maintenance[]>('/maintenance');
  return data;
}

export async function createMaintenance(
  input: MaintenanceInput
): Promise<Maintenance> {
  const { data } = await api.post<Maintenance>('/maintenance', input);
  return data;
}

export async function updateMaintenance(
  id: number,
  input: Partial<MaintenanceInput> & { end_date?: string }
): Promise<Maintenance> {
  const { data } = await api.patch<Maintenance>(`/maintenance/${id}`, input);
  return data;
}

export async function deleteMaintenance(id: number): Promise<void> {
  await api.delete(`/maintenance/${id}`);
}
