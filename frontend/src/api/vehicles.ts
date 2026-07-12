import api from '../lib/api';
import type { Vehicle, VehicleInput } from '../types';

export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await api.get<Vehicle[]>('/vehicles');
  return data;
}

export async function createVehicle(
  input: Partial<VehicleInput>
): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>('/vehicles', input);
  return data;
}

export async function updateVehicle(
  id: number,
  input: Partial<VehicleInput>
): Promise<Vehicle> {
  const { data } = await api.patch<Vehicle>(`/vehicles/${id}`, input);
  return data;
}

export async function deleteVehicle(id: number): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}
