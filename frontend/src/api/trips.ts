import api from '../lib/api';
import type { Trip, DispatchOptions, TripCreateInput } from '../types';

export async function getTrips(): Promise<Trip[]> {
  const { data } = await api.get<Trip[]>('/trips');
  return data;
}

export async function getDispatchOptions(): Promise<DispatchOptions> {
  const { data } = await api.get<DispatchOptions>('/trips/dispatch-options');
  return data;
}

export async function createTrip(input: TripCreateInput): Promise<Trip> {
  const { data } = await api.post<Trip>('/trips', input);
  return data;
}

export async function dispatchTrip(id: number): Promise<Trip> {
  const { data } = await api.post<Trip>(`/trips/${id}/dispatch`);
  return data;
}

export async function completeTrip(
  id: number,
  body: { final_odometer: number; fuel_consumed: number; revenue?: number }
): Promise<Trip> {
  const { data } = await api.post<Trip>(`/trips/${id}/complete`, body);
  return data;
}

export async function cancelTrip(id: number): Promise<Trip> {
  const { data } = await api.post<Trip>(`/trips/${id}/cancel`);
  return data;
}
