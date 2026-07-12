type BadgeColor = 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'indigo';

const VEHICLE: Record<string, BadgeColor> = {
  Available: 'green',
  'On Trip': 'blue',
  'In Shop': 'amber',
  Retired: 'slate',
};

const DRIVER: Record<string, BadgeColor> = {
  Available: 'green',
  'On Trip': 'blue',
  'Off Duty': 'slate',
  Suspended: 'red',
};

const TRIP: Record<string, BadgeColor> = {
  Draft: 'slate',
  Dispatched: 'blue',
  Completed: 'green',
  Cancelled: 'red',
};

const MAINTENANCE: Record<string, BadgeColor> = {
  Open: 'amber',
  Closed: 'green',
};

export function vehicleStatusColor(s: string): BadgeColor {
  return VEHICLE[s] ?? 'slate';
}
export function driverStatusColor(s: string): BadgeColor {
  return DRIVER[s] ?? 'slate';
}
export function tripStatusColor(s: string): BadgeColor {
  return TRIP[s] ?? 'slate';
}
export function maintenanceStatusColor(s: string): BadgeColor {
  return MAINTENANCE[s] ?? 'slate';
}

export const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
export const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
export const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
