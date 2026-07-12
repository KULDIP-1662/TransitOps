export type Role =
  | 'FLEET_MANAGER'
  | 'DRIVER'
  | 'SAFETY_OFFICER'
  | 'FINANCIAL_ANALYST';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

export interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  region?: string | null;
  status: string;
  created_at?: string;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'created_at'>;
