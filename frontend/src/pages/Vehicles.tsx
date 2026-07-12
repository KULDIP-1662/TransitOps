import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../api/vehicles';
import type { Vehicle, VehicleInput } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Badge,
  Input,
  Select,
  NumberInput,
  PageHeader,
  Card,
} from '../components/ui';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { formatINR, formatKg, formatNumber } from '../lib/format';
import { vehicleStatusColor, VEHICLE_STATUSES } from '../lib/status';

const EMPTY: Partial<VehicleInput> = {
  registration_number: '',
  name_model: '',
  type: 'Van',
  max_load_capacity: 500,
  odometer: 0,
  acquisition_cost: 0,
  region: '',
  status: 'Available',
};

export default function Vehicles() {
  const { user } = useAuth();
  const canManage = user?.role === 'FLEET_MANAGER';
  const qc = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; vehicle?: Vehicle } | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null);

  const types = useMemo(
    () => [...new Set(vehicles.map((v) => v.type))].sort(),
    [vehicles]
  );
  const regions = useMemo(
    () => [...new Set(vehicles.map((v) => v.region).filter(Boolean))].sort() as string[],
    [vehicles]
  );

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return vehicles.filter(
      (v) =>
        (!type || v.type === type) &&
        (!status || v.status === status) &&
        (!region || v.region === region) &&
        (!s ||
          v.registration_number.toLowerCase().includes(s) ||
          v.name_model.toLowerCase().includes(s))
    );
  }, [vehicles, type, status, region, search]);

  const delMutation = useMutation({
    mutationFn: (id: number) => deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setConfirmDelete(null);
    },
  });

  const columns: Column<Vehicle>[] = [
    {
      key: 'registration_number',
      header: 'Reg. No. (Unique)',
      render: (v) => <span className="tabular font-medium">{v.registration_number}</span>,
    },
    {
      key: 'name_model',
      header: 'Name / Model',
      render: (v) => <span className="font-medium text-slate-900 dark:text-white">{v.name_model}</span>,
    },
    { key: 'type', header: 'Type' },
    {
      key: 'max_load_capacity',
      header: 'Capacity',
      align: 'right',
      render: (v) => <span className="tabular">{formatKg(v.max_load_capacity)}</span>,
    },
    {
      key: 'odometer',
      header: 'Odometer',
      align: 'right',
      render: (v) => <span className="tabular">{formatNumber(v.odometer)}</span>,
    },
    {
      key: 'acquisition_cost',
      header: 'Acq. Cost',
      align: 'right',
      render: (v) => <span className="tabular">{formatINR(v.acquisition_cost)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <Badge color={vehicleStatusColor(v.status)}>{v.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setModal({ mode: 'edit', vehicle: v })}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setConfirmDelete(v)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Registry"
        subtitle="Master list of fleet assets"
        actions={
          canManage && (
            <Button onClick={() => setModal({ mode: 'create' })}>
              <Plus size={16} /> Add Vehicle
            </Button>
          )
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Vehicle Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select label="Region" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Input
            label="Search reg. no / model"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyTitle="No vehicles found"
        emptyHint="Adjust filters or add a new vehicle."
      />

      <p className="mt-3 text-xs text-slate-400">
        Rule: Registration No. must be unique · Retired / In Shop vehicles are hidden from the Trip Dispatcher.
      </p>

      {modal && (
        <VehicleFormModal
          mode={modal.mode}
          vehicle={modal.vehicle}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['vehicles'] });
            setModal(null);
          }}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete vehicle?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={delMutation.isPending}
              onClick={() => confirmDelete && delMutation.mutate(confirmDelete.id)}
            >
              {delMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will permanently remove{' '}
          <span className="font-semibold">{confirmDelete?.name_model}</span> (
          {confirmDelete?.registration_number}).
        </p>
      </Modal>
    </div>
  );
}

function VehicleFormModal({
  mode,
  vehicle,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  vehicle?: Vehicle;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<VehicleInput>>(
    vehicle
      ? {
          registration_number: vehicle.registration_number,
          name_model: vehicle.name_model,
          type: vehicle.type,
          max_load_capacity: vehicle.max_load_capacity,
          odometer: vehicle.odometer,
          acquisition_cost: vehicle.acquisition_cost,
          region: vehicle.region ?? '',
          status: vehicle.status,
        }
      : { ...EMPTY }
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Partial<VehicleInput>) =>
      mode === 'edit' && vehicle
        ? updateVehicle(vehicle.id, data)
        : createVehicle(data),
    onSuccess: onSaved,
    onError: (err) => {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.detail ?? 'Save failed')
          : 'Save failed'
      );
    },
  });

  const set = (k: keyof VehicleInput, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Vehicle' : 'Add Vehicle'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Registration No. (unique)"
          value={form.registration_number ?? ''}
          onChange={(e) => set('registration_number', e.target.value)}
          required
        />
        <Input
          label="Name / Model"
          value={form.name_model ?? ''}
          onChange={(e) => set('name_model', e.target.value)}
          required
        />
        <Input
          label="Type"
          value={form.type ?? ''}
          onChange={(e) => set('type', e.target.value)}
          placeholder="Van, Truck, Mini…"
          required
        />
        <NumberInput
          label="Max Load Capacity (kg)"
          min={1}
          value={form.max_load_capacity ?? 0}
          onChange={(n) => set('max_load_capacity', n)}
          required
        />
        <NumberInput
          label="Odometer (km)"
          min={0}
          value={form.odometer ?? 0}
          onChange={(n) => set('odometer', n)}
        />
        <NumberInput
          label="Acquisition Cost (₹)"
          min={0}
          value={form.acquisition_cost ?? 0}
          onChange={(n) => set('acquisition_cost', n)}
        />
        <Input
          label="Region"
          value={form.region ?? ''}
          onChange={(e) => set('region', e.target.value)}
        />
        <Select
          label="Status"
          value={form.status ?? 'Available'}
          onChange={(e) => set('status', e.target.value)}
        >
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        {error && (
          <div className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
