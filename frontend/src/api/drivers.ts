import api from '../lib/api';
import type { Driver, DriverInput } from '../types';

export async function getDrivers(): Promise<Driver[]> {
  const { data } = await api.get<Driver[]>('/drivers');
  return data;
}

export async function createDriver(input: Partial<DriverInput>): Promise<Driver> {
  const { data } = await api.post<Driver>('/drivers', input);
  return data;
}

export async function updateDriver(
  id: number,
  input: Partial<DriverInput>
): Promise<Driver> {
  const { data } = await api.patch<Driver>(`/drivers/${id}`, input);
  return data;
}

export async function deleteDriver(id: number): Promise<void> {
  await api.delete(`/drivers/${id}`);
}
