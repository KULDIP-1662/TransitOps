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

export interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category?: string | null;
  license_expiry_date: string;
  contact_number?: string | null;
  safety_score: number;
  status: string;
  created_at?: string;
  license_expired: boolean;
  expiring_soon: boolean;
  days_to_expiry: number;
  trip_completions: number;
}

export type DriverInput = {
  name: string;
  license_number: string;
  license_category?: string;
  license_expiry_date: string;
  contact_number?: string;
  safety_score?: number;
  status?: string;
};

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight: number;
  planned_distance: number;
  final_odometer?: number | null;
  fuel_consumed?: number | null;
  revenue: number;
  status: string;
  created_at?: string;
  dispatched_at?: string | null;
  completed_at?: string | null;
  vehicle_registration?: string | null;
  vehicle_name?: string | null;
  vehicle_capacity?: number | null;
  driver_name?: string | null;
}

export interface DispatchOptionVehicle {
  id: number;
  registration_number: string;
  name_model: string;
  max_load_capacity: number;
}

export interface DispatchOptionDriver {
  id: number;
  name: string;
  license_number: string;
}

export interface DispatchOptions {
  vehicles: DispatchOptionVehicle[];
  drivers: DispatchOptionDriver[];
}

export type TripCreateInput = {
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight: number;
  planned_distance: number;
  revenue?: number;
};

export function tripCode(id: number): string {
  return `TR${String(id).padStart(3, '0')}`;
}

export interface Maintenance {
  id: number;
  vehicle_id: number;
  description: string;
  cost: number;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  vehicle_registration?: string | null;
  vehicle_name?: string | null;
}

export type MaintenanceInput = {
  vehicle_id: number;
  description: string;
  cost: number;
  start_date?: string;
  status?: string;
};

export interface FuelLog {
  id: number;
  vehicle_id: number;
  trip_id?: number | null;
  liters: number;
  cost: number;
  odometer?: number | null;
  date?: string | null;
  created_at?: string;
  vehicle_registration?: string | null;
  vehicle_name?: string | null;
}

export type FuelInput = {
  vehicle_id: number;
  liters: number;
  cost: number;
  odometer?: number;
  date?: string;
};

export interface Expense {
  id: number;
  vehicle_id?: number | null;
  trip_id?: number | null;
  category: string;
  amount: number;
  description?: string | null;
  date?: string | null;
  created_at?: string;
  vehicle_registration?: string | null;
  vehicle_name?: string | null;
}

export type ExpenseInput = {
  vehicle_id?: number;
  category: string;
  amount: number;
  description?: string;
  date?: string;
};

export interface VehicleCost {
  vehicle_id: number;
  name_model: string;
  registration_number: string;
  fuel_cost: number;
  maintenance_cost: number;
  other_expenses: number;
  operational_cost: number;
}

export interface CostSummary {
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_other_expenses: number;
  total_operational_cost: number;
  per_vehicle: VehicleCost[];
}

export const EXPENSE_CATEGORIES = ['Toll', 'Maintenance', 'Parking', 'Other'];

export interface DashboardData {
  active_vehicles: number;
  available_vehicles: number;
  in_maintenance: number;
  on_trip_vehicles: number;
  retired_vehicles: number;
  active_trips: number;
  pending_trips: number;
  completed_trips: number;
  total_trips: number;
  drivers_on_duty: number;
  total_drivers: number;
  fleet_utilization: number;
  vehicle_status: { label: string; count: number }[];
  recent_trips: {
    id: number;
    vehicle_name?: string | null;
    driver_name?: string | null;
    status: string;
    source: string;
    destination: string;
  }[];
}

export interface VehicleReport {
  vehicle_id: number;
  name_model: string;
  registration_number: string;
  distance: number;
  fuel_liters: number;
  fuel_efficiency: number;
  fuel_cost: number;
  maintenance_cost: number;
  operational_cost: number;
  revenue: number;
  roi: number;
}

export interface ReportData {
  fuel_efficiency: number;
  fleet_utilization: number;
  total_operational_cost: number;
  monthly_revenue: number;
  total_distance: number;
  total_fuel_liters: number;
  per_vehicle: VehicleReport[];
}
