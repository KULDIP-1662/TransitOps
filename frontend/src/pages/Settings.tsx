import { useState } from 'react';
import { Save, Check, Eye, Minus } from 'lucide-react';
import { PageHeader, Card, Input, Select, Button } from '../components/ui';
import { ROLE_LABELS, type Role } from '../types';

type Access = 'manage' | 'view' | 'none';

const MODULES = ['Fleet', 'Drivers', 'Trips', 'Maintenance', 'Fuel & Exp.', 'Analytics'];

// Mirrors the RBAC actually enforced by the API.
const MATRIX: Record<Role, Access[]> = {
  FLEET_MANAGER: ['manage', 'manage', 'view', 'manage', 'manage', 'view'],
  DRIVER: ['view', 'view', 'manage', 'none', 'view', 'none'],
  SAFETY_OFFICER: ['view', 'manage', 'view', 'none', 'view', 'none'],
  FINANCIAL_ANALYST: ['view', 'view', 'view', 'none', 'manage', 'manage'],
};

const ROLES = Object.keys(MATRIX) as Role[];

function AccessCell({ access }: { access: Access }) {
  if (access === 'manage')
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <Check size={15} /> <span className="text-xs">Manage</span>
      </span>
    );
  if (access === 'view')
    return (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <Eye size={15} /> <span className="text-xs">View</span>
      </span>
    );
  return <Minus size={15} className="text-slate-300 dark:text-slate-600" />;
}

export default function Settings() {
  const [depot, setDepot] = useState(
    () => localStorage.getItem('depot') || 'Gandhinagar Depot GJ4'
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('currency') || 'INR'
  );
  const [distance, setDistance] = useState(
    () => localStorage.getItem('distance') || 'Kilometers'
  );
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem('depot', depot);
    localStorage.setItem('currency', currency);
    localStorage.setItem('distance', distance);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <PageHeader title="Settings & RBAC" subtitle="Organization settings and role-based access" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-heading text-sm font-semibold text-slate-900 dark:text-white">
            General
          </h3>
          <div className="space-y-4">
            <Input label="Depot Name" value={depot} onChange={(e) => setDepot(e.target.value)} />
            <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </Select>
            <Select label="Distance Unit" value={distance} onChange={(e) => setDistance(e.target.value)}>
              <option>Kilometers</option>
              <option>Miles</option>
            </Select>
            <div className="flex items-center gap-3">
              <Button onClick={save}>
                <Save size={16} /> Save Changes
              </Button>
              {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved ✓</span>}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 font-heading text-sm font-semibold text-slate-900 dark:text-white">
            Role-Based Access (RBAC)
          </h3>
          <p className="mb-4 text-xs text-slate-400">
            Permissions enforced by the API for each role.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4">Role</th>
                  {MODULES.map((m) => (
                    <th key={m} className="pb-2 pr-3">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-white">
                      {ROLE_LABELS[role]}
                    </td>
                    {MATRIX[role].map((access, i) => (
                      <td key={i} className="py-2.5 pr-3">
                        <AccessCell access={access} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
