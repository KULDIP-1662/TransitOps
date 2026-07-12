import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../api/drivers';
import type { Driver, DriverInput } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Badge,
  Input,
  Select,
  NumberInput,
  Meter,
  PageHeader,
  Card,
} from '../components/ui';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { formatDate } from '../lib/format';
import { driverStatusColor, DRIVER_STATUSES } from '../lib/status';

const EMPTY: Partial<DriverInput> = {
  name: '',
  license_number: '',
  license_category: 'LMV',
  license_expiry_date: '',
  contact_number: '',
  safety_score: 100,
  status: 'Available',
};

function ExpiryCell({ driver }: { driver: Driver }) {
  if (driver.license_expired) {
    return (
      <div className="flex items-center gap-2">
        <span className="tabular text-slate-500 line-through">
          {formatDate(driver.license_expiry_date)}
        </span>
        <Badge color="red">Expired</Badge>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="tabular">{formatDate(driver.license_expiry_date)}</span>
      {driver.expiring_soon && (
        <Badge color="amber">
          <AlertTriangle size={11} className="mr-1" />
          {driver.days_to_expiry}d
        </Badge>
      )}
    </div>
  );
}

export default function Drivers() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'FLEET_MANAGER' || user?.role === 'SAFETY_OFFICER';
  const qc = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: getDrivers,
  });

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; driver?: Driver } | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<Driver | null>(null);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return drivers.filter(
      (d) =>
        (!status || d.status === status) &&
        (!s ||
          d.name.toLowerCase().includes(s) ||
          d.license_number.toLowerCase().includes(s))
    );
  }, [drivers, status, search]);

  const delMutation = useMutation({
    mutationFn: (id: number) => deleteDriver(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      setConfirmDelete(null);
    },
  });

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      render: (d) => (
        <span className="font-medium text-slate-900 dark:text-white">{d.name}</span>
      ),
    },
    {
      key: 'license_number',
      header: 'License No.',
      render: (d) => <span className="tabular">{d.license_number}</span>,
    },
    { key: 'license_category', header: 'Category', render: (d) => d.license_category || '—' },
    { key: 'license_expiry_date', header: 'Expiry', render: (d) => <ExpiryCell driver={d} /> },
    {
      key: 'contact_number',
      header: 'Contact',
      render: (d) => <span className="tabular">{d.contact_number || '—'}</span>,
    },
    {
      key: 'trip_completions',
      header: 'Trip Compl.',
      align: 'right',
      render: (d) => <span className="tabular">{d.trip_completions}</span>,
    },
    { key: 'safety_score', header: 'Safety', render: (d) => <Meter value={d.safety_score} /> },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <Badge color={driverStatusColor(d.status)}>{d.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setModal({ mode: 'edit', driver: d })}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setConfirmDelete(d)}
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
        title="Drivers & Safety Profiles"
        subtitle="Driver roster, license validity and safety scores"
        actions={
          canManage && (
            <Button onClick={() => setModal({ mode: 'create' })}>
              <Plus size={16} /> Add Driver
            </Button>
          )
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {DRIVER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Input
              label="Search name / license"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
            />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyTitle="No drivers found"
        emptyHint="Adjust filters or add a new driver."
      />

      <p className="mt-3 text-xs text-slate-400">
        Rule: Drivers with an expired license or Suspended status are blocked from trip assignment.
      </p>

      {modal && (
        <DriverFormModal
          mode={modal.mode}
          driver={modal.driver}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['drivers'] });
            setModal(null);
          }}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete driver?"
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
          <span className="font-semibold">{confirmDelete?.name}</span> (
          {confirmDelete?.license_number}).
        </p>
      </Modal>
    </div>
  );
}

function DriverFormModal({
  mode,
  driver,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  driver?: Driver;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<DriverInput>>(
    driver
      ? {
          name: driver.name,
          license_number: driver.license_number,
          license_category: driver.license_category ?? '',
          license_expiry_date: driver.license_expiry_date,
          contact_number: driver.contact_number ?? '',
          safety_score: driver.safety_score,
          status: driver.status,
        }
      : { ...EMPTY }
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Partial<DriverInput>) =>
      mode === 'edit' && driver
        ? updateDriver(driver.id, data)
        : createDriver(data),
    onSuccess: onSaved,
    onError: (err) => {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.detail ?? 'Save failed')
          : 'Save failed'
      );
    },
  });

  const set = (k: keyof DriverInput, v: string | number) =>
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
      title={mode === 'edit' ? 'Edit Driver' : 'Add Driver'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="driver-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="driver-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          value={form.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          required
        />
        <Input
          label="License Number (unique)"
          value={form.license_number ?? ''}
          onChange={(e) => set('license_number', e.target.value)}
          required
        />
        <Select
          label="License Category"
          value={form.license_category ?? ''}
          onChange={(e) => set('license_category', e.target.value)}
        >
          <option value="LMV">LMV</option>
          <option value="HMV">HMV</option>
          <option value="MCWG">MCWG</option>
        </Select>
        <Input
          label="License Expiry Date"
          type="date"
          value={form.license_expiry_date ?? ''}
          onChange={(e) => set('license_expiry_date', e.target.value)}
          required
        />
        <Input
          label="Contact Number"
          value={form.contact_number ?? ''}
          onChange={(e) => set('contact_number', e.target.value)}
        />
        <NumberInput
          label="Safety Score (0–100)"
          min={0}
          value={form.safety_score ?? 0}
          onChange={(n) => set('safety_score', n)}
        />
        <Select
          label="Status"
          value={form.status ?? 'Available'}
          onChange={(e) => set('status', e.target.value)}
        >
          {DRIVER_STATUSES.map((s) => (
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
