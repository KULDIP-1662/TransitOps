import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import {
  getTrips,
  getDispatchOptions,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from '../api/trips';
import type { Trip, TripCreateInput } from '../types';
import { tripCode } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select, NumberInput, PageHeader, Card, Badge } from '../components/ui';
import KanbanBoard, { type KanbanColumn } from '../components/KanbanBoard';
import Modal from '../components/Modal';
import { formatKg, formatNumber } from '../lib/format';
import { tripStatusColor } from '../lib/status';

const EMPTY: TripCreateInput = {
  source: '',
  destination: '',
  vehicle_id: 0,
  driver_id: 0,
  cargo_weight: 0,
  planned_distance: 0,
  revenue: 0,
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  ['trips', 'dispatch-options', 'vehicles', 'drivers'].forEach((k) =>
    qc.invalidateQueries({ queryKey: [k] })
  );
}

export default function Trips() {
  const { user } = useAuth();
  const canManage = user?.role === 'DRIVER';
  const qc = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({ queryKey: ['trips'], queryFn: getTrips });
  const { data: options } = useQuery({
    queryKey: ['dispatch-options'],
    queryFn: getDispatchOptions,
    enabled: canManage,
  });

  const [completeFor, setCompleteFor] = useState<Trip | null>(null);

  const dispatchMut = useMutation({
    mutationFn: (id: number) => dispatchTrip(id),
    onSuccess: () => invalidateAll(qc),
    onError: (e) => alert(errMsg(e)),
  });
  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelTrip(id),
    onSuccess: () => invalidateAll(qc),
    onError: (e) => alert(errMsg(e)),
  });

  const columns: KanbanColumn<Trip>[] = useMemo(() => {
    const by = (s: string) => trips.filter((t) => t.status === s);
    return [
      { key: 'Draft', title: 'Draft', accent: 'slate', items: by('Draft') },
      { key: 'Dispatched', title: 'Dispatched', accent: 'blue', items: by('Dispatched') },
      { key: 'Completed', title: 'Completed', accent: 'green', items: by('Completed') },
      { key: 'Cancelled', title: 'Cancelled', accent: 'red', items: by('Cancelled') },
    ];
  }, [trips]);

  const renderCard = (t: Trip) => (
    <Card className="p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="tabular text-sm font-semibold text-slate-900 dark:text-white">
          {tripCode(t.id)}
        </span>
        <Badge color={tripStatusColor(t.status)}>{t.status}</Badge>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {t.source} → {t.destination}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
        <span className="tabular">{t.vehicle_name ?? '—'}</span>
        <span>·</span>
        <span>{t.driver_name ?? 'Unassigned'}</span>
        <span>·</span>
        <span className="tabular">{formatKg(t.cargo_weight)}</span>
      </div>
      {canManage && (t.status === 'Draft' || t.status === 'Dispatched') && (
        <div className="mt-3 flex gap-2">
          {t.status === 'Draft' && (
            <Button
              variant="primary"
              className="px-2.5 py-1.5 text-xs"
              onClick={() => dispatchMut.mutate(t.id)}
              disabled={dispatchMut.isPending}
            >
              <Send size={13} /> Dispatch
            </Button>
          )}
          {t.status === 'Dispatched' && (
            <Button
              variant="primary"
              className="px-2.5 py-1.5 text-xs"
              onClick={() => setCompleteFor(t)}
            >
              <CheckCircle2 size={13} /> Complete
            </Button>
          )}
          <Button
            variant="secondary"
            className="px-2.5 py-1.5 text-xs"
            onClick={() => cancelMut.mutate(t.id)}
            disabled={cancelMut.isPending}
          >
            <XCircle size={13} /> Cancel
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Trip Dispatcher"
        subtitle="Create trips, dispatch, and track the live board"
      />

      {canManage && options && (
        <CreateTripForm
          options={options}
          onCreated={() => invalidateAll(qc)}
        />
      )}

      <KanbanBoard columns={columns} renderCard={renderCard} />
      {isLoading && <p className="mt-3 text-sm text-slate-400">Loading trips…</p>}

      <p className="mt-3 text-xs text-slate-400">
        On complete: final odometer & fuel are recorded, then the vehicle and driver return to Available.
      </p>

      {completeFor && (
        <CompleteTripModal
          trip={completeFor}
          onClose={() => setCompleteFor(null)}
          onDone={() => {
            invalidateAll(qc);
            setCompleteFor(null);
          }}
        />
      )}
    </div>
  );
}

function errMsg(e: unknown): string {
  return axios.isAxiosError(e)
    ? (e.response?.data?.detail ?? 'Action failed')
    : 'Action failed';
}

function CreateTripForm({
  options,
  onCreated,
}: {
  options: { vehicles: { id: number; name_model: string; registration_number: string; max_load_capacity: number }[]; drivers: { id: number; name: string }[] };
  onCreated: () => void;
}) {
  const [form, setForm] = useState<TripCreateInput>({ ...EMPTY });
  const [error, setError] = useState('');

  const selectedVehicle = options.vehicles.find((v) => v.id === form.vehicle_id);
  const capacity = selectedVehicle?.max_load_capacity ?? 0;
  const over = selectedVehicle ? form.cargo_weight - capacity : 0;
  const capacityExceeded = over > 0;

  const set = (k: keyof TripCreateInput, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: TripCreateInput) => createTrip(data),
    onSuccess: () => {
      setForm({ ...EMPTY });
      onCreated();
    },
    onError: (e) => setError(errMsg(e)),
  });

  const canSubmit =
    form.source &&
    form.destination &&
    form.vehicle_id > 0 &&
    form.driver_id > 0 &&
    form.cargo_weight > 0 &&
    !capacityExceeded;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  return (
    <Card className="mb-5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Plus size={16} className="text-indigo-600" />
        <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
          Create Trip
        </h2>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Source" value={form.source} onChange={(e) => set('source', e.target.value)} required />
        <Input label="Destination" value={form.destination} onChange={(e) => set('destination', e.target.value)} required />
        <div className="hidden lg:block" />
        <Select
          label="Vehicle (available only)"
          value={form.vehicle_id || ''}
          onChange={(e) => set('vehicle_id', Number(e.target.value))}
          required
        >
          <option value="">Select vehicle…</option>
          {options.vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name_model} · {formatKg(v.max_load_capacity)}
            </option>
          ))}
        </Select>
        <Select
          label="Driver (available only)"
          value={form.driver_id || ''}
          onChange={(e) => set('driver_id', Number(e.target.value))}
          required
        >
          <option value="">Select driver…</option>
          {options.drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <div className="hidden lg:block" />
        <NumberInput
          label="Cargo Weight (kg)"
          min={0}
          value={form.cargo_weight}
          onChange={(n) => set('cargo_weight', n)}
        />
        <NumberInput
          label="Planned Distance (km)"
          min={0}
          value={form.planned_distance}
          onChange={(n) => set('planned_distance', n)}
        />
        <NumberInput
          label="Revenue (₹)"
          min={0}
          value={form.revenue ?? 0}
          onChange={(n) => set('revenue', n)}
        />

        <div className="sm:col-span-2 lg:col-span-3">
          {selectedVehicle && (
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Vehicle capacity: <span className="tabular">{formatKg(capacity)}</span>
              {form.cargo_weight > 0 && (
                <>
                  {' '}· Cargo: <span className="tabular">{formatKg(form.cargo_weight)}</span>
                </>
              )}
            </p>
          )}
          {capacityExceeded && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
              <AlertTriangle size={15} />
              Capacity exceeded by {formatNumber(over)} kg — dispatch blocked
            </div>
          )}
          {error && (
            <div className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CompleteTripModal({
  trip,
  onClose,
  onDone,
}: {
  trip: Trip;
  onClose: () => void;
  onDone: () => void;
}) {
  const [finalOdometer, setFinalOdometer] = useState(0);
  const [fuelConsumed, setFuelConsumed] = useState(0);
  const [revenue, setRevenue] = useState(trip.revenue);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      completeTrip(trip.id, {
        final_odometer: finalOdometer,
        fuel_consumed: fuelConsumed,
        revenue,
      }),
    onSuccess: onDone,
    onError: (e) => setError(errMsg(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Complete ${tripCode(trip.id)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              setError('');
              mutation.mutate();
            }}
            disabled={mutation.isPending || fuelConsumed <= 0}
          >
            {mutation.isPending ? 'Completing…' : 'Complete Trip'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberInput label="Final Odometer (km)" min={0} value={finalOdometer} onChange={setFinalOdometer} />
        <NumberInput label="Fuel Consumed (L)" min={0} value={fuelConsumed} onChange={setFuelConsumed} />
        <NumberInput label="Revenue (₹)" min={0} value={revenue} onChange={setRevenue} />
      </div>
      {error && (
        <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}
    </Modal>
  );
}
