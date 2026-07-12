import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import axios from 'axios';
import {
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from '../api/maintenance';
import { getVehicles } from '../api/vehicles';
import type { Maintenance, MaintenanceInput } from '../types';
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
import ConfirmDialog from '../components/ConfirmDialog';
import { formatINR, formatDate } from '../lib/format';
import { maintenanceStatusColor } from '../lib/status';

const EMPTY: MaintenanceInput = {
  vehicle_id: 0,
  description: '',
  cost: 0,
  start_date: '',
  status: 'Open',
};

function errMsg(e: unknown): string {
  return axios.isAxiosError(e)
    ? (e.response?.data?.detail ?? 'Action failed')
    : 'Action failed';
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  ['maintenance', 'vehicles', 'dispatch-options'].forEach((k) =>
    qc.invalidateQueries({ queryKey: [k] })
  );
}

export default function Maintenance() {
  const qc = useQueryClient();
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: getMaintenance,
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Maintenance | null>(null);

  const rows = useMemo(
    () => records.filter((r) => !statusFilter || r.status === statusFilter),
    [records, statusFilter]
  );

  const toggleMut = useMutation({
    mutationFn: (rec: Maintenance) =>
      updateMaintenance(rec.id, {
        status: rec.status === 'Open' ? 'Closed' : 'Open',
      }),
    onSuccess: () => invalidate(qc),
    onError: (e) => alert(errMsg(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => deleteMaintenance(id),
    onSuccess: () => {
      invalidate(qc);
      setConfirmDelete(null);
    },
    onError: (e) => alert(errMsg(e)),
  });

  const columns: Column<Maintenance>[] = [
    {
      key: 'vehicle_name',
      header: 'Vehicle',
      render: (m) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white">
            {m.vehicle_name}
          </div>
          <div className="tabular text-xs text-slate-400">
            {m.vehicle_registration}
          </div>
        </div>
      ),
    },
    { key: 'description', header: 'Service' },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      render: (m) => <span className="tabular">{formatINR(m.cost)}</span>,
    },
    {
      key: 'start_date',
      header: 'Date',
      render: (m) => <span className="tabular">{formatDate(m.start_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <Badge color={maintenanceStatusColor(m.status)}>
          {m.status === 'Open' ? 'Open (In Shop)' : 'Closed'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => toggleMut.mutate(m)}
            disabled={toggleMut.isPending}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
            title={m.status === 'Open' ? 'Close (restore vehicle)' : 'Reopen'}
          >
            {m.status === 'Open' ? <CheckCircle2 size={16} /> : <RotateCcw size={16} />}
          </button>
          <button
            onClick={() => setConfirmDelete(m)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Service records and vehicle shop status"
      />

      <LogServiceForm vehicles={vehicles} onLogged={() => invalidate(qc)} />

      <Card className="mb-4 p-4">
        <div className="max-w-xs">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </Select>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyTitle="No maintenance records"
        emptyHint="Log a service record above."
      />

      <p className="mt-3 text-xs text-slate-400">
        Opening an active record sets the vehicle to In Shop (removed from the dispatch pool); closing it restores the vehicle to Available.
      </p>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete maintenance record?"
        confirmLabel="Delete"
        loading={delMut.isPending}
        onConfirm={() => confirmDelete && delMut.mutate(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      >
        Remove the <span className="font-semibold">{confirmDelete?.description}</span>{' '}
        record for {confirmDelete?.vehicle_name}?
      </ConfirmDialog>
    </div>
  );
}

function LogServiceForm({
  vehicles,
  onLogged,
}: {
  vehicles: { id: number; name_model: string; status: string }[];
  onLogged: () => void;
}) {
  const [form, setForm] = useState<MaintenanceInput>({ ...EMPTY });
  const [error, setError] = useState('');

  const set = (k: keyof MaintenanceInput, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: MaintenanceInput) => createMaintenance(data),
    onSuccess: () => {
      setForm({ ...EMPTY });
      onLogged();
    },
    onError: (e) => setError(errMsg(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  const canSubmit = form.vehicle_id > 0 && form.description.trim();

  return (
    <Card className="mb-5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Wrench size={16} className="text-indigo-600" />
        <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
          Log Service Record
        </h2>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Vehicle"
          value={form.vehicle_id || ''}
          onChange={(e) => set('vehicle_id', Number(e.target.value))}
          required
        >
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name_model} ({v.status})
            </option>
          ))}
        </Select>
        <Input
          label="Service Type"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Oil Change, Tyre Replace…"
          required
        />
        <NumberInput
          label="Cost (₹)"
          min={0}
          value={form.cost}
          onChange={(n) => set('cost', n)}
        />
        <Input
          label="Date"
          type="date"
          value={form.start_date ?? ''}
          onChange={(e) => set('start_date', e.target.value)}
        />
        <Select
          label="Status"
          value={form.status ?? 'Open'}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="Open">Open (sets vehicle In Shop)</option>
          <option value="Closed">Closed (history only)</option>
        </Select>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <div className="w-full">
            {error && (
              <div className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                {error}
              </div>
            )}
            <Button type="submit" disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending ? 'Logging…' : 'Log Record'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
