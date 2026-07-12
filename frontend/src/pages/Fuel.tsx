import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fuel as FuelIcon, Receipt, Plus, Trash2, Wallet, Wrench } from 'lucide-react';
import axios from 'axios';
import {
  getFuel,
  createFuel,
  deleteFuel,
  getExpenses,
  createExpense,
  deleteExpense,
  getCostSummary,
} from '../api/fuel';
import { getVehicles } from '../api/vehicles';
import type { FuelInput, ExpenseInput } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Badge, Input, Select, NumberInput, PageHeader, Card } from '../components/ui';
import DataTable, { type Column } from '../components/DataTable';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { formatINR, formatNumber, formatDate } from '../lib/format';

function errMsg(e: unknown): string {
  return axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Action failed') : 'Action failed';
}

function useInvalidate() {
  const qc = useQueryClient();
  return () =>
    ['fuel', 'expenses', 'cost-summary'].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] })
    );
}

export default function Fuel() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'FINANCIAL_ANALYST' || user?.role === 'FLEET_MANAGER';
  const invalidate = useInvalidate();

  const { data: fuel = [] } = useQuery({ queryKey: ['fuel'], queryFn: getFuel });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: getExpenses });
  const { data: summary } = useQuery({ queryKey: ['cost-summary'], queryFn: getCostSummary });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });

  const [modal, setModal] = useState<'fuel' | 'expense' | null>(null);

  const delFuel = useMutation({ mutationFn: deleteFuel, onSuccess: invalidate });
  const delExpense = useMutation({ mutationFn: deleteExpense, onSuccess: invalidate });

  const fuelCols: Column<(typeof fuel)[number]>[] = [
    {
      key: 'vehicle_name',
      header: 'Vehicle',
      render: (f) => <span className="font-medium">{f.vehicle_name}</span>,
    },
    { key: 'date', header: 'Date', render: (f) => <span className="tabular">{formatDate(f.date)}</span> },
    { key: 'liters', header: 'Liters', align: 'right', render: (f) => <span className="tabular">{formatNumber(f.liters)} L</span> },
    { key: 'cost', header: 'Fuel Cost', align: 'right', render: (f) => <span className="tabular">{formatINR(f.cost)}</span> },
    ...(canManage
      ? [{
          key: 'actions', header: '', align: 'right' as const,
          render: (f: (typeof fuel)[number]) => (
            <button onClick={() => delFuel.mutate(f.id)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800" title="Delete">
              <Trash2 size={15} />
            </button>
          ),
        }]
      : []),
  ];

  const expCols: Column<(typeof expenses)[number]>[] = [
    { key: 'vehicle_name', header: 'Vehicle', render: (e) => e.vehicle_name ?? '—' },
    { key: 'category', header: 'Category', render: (e) => <Badge color="slate">{e.category}</Badge> },
    { key: 'description', header: 'Description', render: (e) => e.description ?? '—' },
    { key: 'amount', header: 'Amount', align: 'right', render: (e) => <span className="tabular">{formatINR(e.amount)}</span> },
    { key: 'date', header: 'Date', render: (e) => <span className="tabular">{formatDate(e.date)}</span> },
    ...(canManage
      ? [{
          key: 'actions', header: '', align: 'right' as const,
          render: (e: (typeof expenses)[number]) => (
            <button onClick={() => delExpense.mutate(e.id)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800" title="Delete">
              <Trash2 size={15} />
            </button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Fuel & Expenses"
        subtitle="Fuel logs, other expenses and operational cost"
        actions={
          canManage && (
            <>
              <Button variant="secondary" onClick={() => setModal('expense')}>
                <Receipt size={16} /> Add Expense
              </Button>
              <Button onClick={() => setModal('fuel')}>
                <Plus size={16} /> Log Fuel
              </Button>
            </>
          )
        }
      />

      {summary && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Fuel Cost" accent="blue" icon={<FuelIcon size={16} />} value={formatINR(summary.total_fuel_cost)} />
          <StatCard label="Maintenance Cost" accent="amber" icon={<Wrench size={16} />} value={formatINR(summary.total_maintenance_cost)} />
          <StatCard label="Operational Cost" accent="indigo" icon={<Wallet size={16} />} value={formatINR(summary.total_operational_cost)} sub="Fuel + Maintenance (auto)" />
          <StatCard label="Other Expenses" accent="slate" icon={<Receipt size={16} />} value={formatINR(summary.total_other_expenses)} sub="Tolls / misc" />
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <FuelIcon size={16} className="text-indigo-600" />
        <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">Fuel Logs</h2>
      </div>
      <DataTable columns={fuelCols} rows={fuel} emptyTitle="No fuel logs" />

      <div className="mb-3 mt-6 flex items-center gap-2">
        <Receipt size={16} className="text-indigo-600" />
        <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">Other Expenses (Toll / Misc)</h2>
      </div>
      <DataTable columns={expCols} rows={expenses} emptyTitle="No expenses" />

      {summary && (
        <>
          <div className="mb-3 mt-6 flex items-center gap-2">
            <Wallet size={16} className="text-indigo-600" />
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">Operational Cost per Vehicle</h2>
          </div>
          <Card className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2 text-right">Fuel</th>
                    <th className="pb-2 text-right">Maintenance</th>
                    <th className="pb-2 text-right">Operational</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.per_vehicle
                    .filter((v) => v.operational_cost > 0)
                    .map((v) => (
                      <tr key={v.vehicle_id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2 font-medium">{v.name_model}</td>
                        <td className="tabular py-2 text-right">{formatINR(v.fuel_cost)}</td>
                        <td className="tabular py-2 text-right">{formatINR(v.maintenance_cost)}</td>
                        <td className="tabular py-2 text-right font-semibold">{formatINR(v.operational_cost)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {modal === 'fuel' && (
        <FuelModal vehicles={vehicles} onClose={() => setModal(null)} onSaved={() => { invalidate(); setModal(null); }} />
      )}
      {modal === 'expense' && (
        <ExpenseModal vehicles={vehicles} onClose={() => setModal(null)} onSaved={() => { invalidate(); setModal(null); }} />
      )}
    </div>
  );
}

function FuelModal({ vehicles, onClose, onSaved }: { vehicles: { id: number; name_model: string }[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FuelInput>({ vehicle_id: 0, liters: 0, cost: 0, odometer: 0, date: '' });
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (d: FuelInput) => createFuel(d),
    onSuccess: onSaved,
    onError: (e) => setError(errMsg(e)),
  });
  const set = (k: keyof FuelInput, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e: FormEvent) => { e.preventDefault(); setError(''); mutation.mutate(form); };

  return (
    <Modal open onClose={onClose} title="Log Fuel" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="fuel-form" disabled={mutation.isPending || form.vehicle_id === 0 || form.liters <= 0}>{mutation.isPending ? 'Saving…' : 'Save'}</Button></>}>
      <form id="fuel-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Vehicle" value={form.vehicle_id || ''} onChange={(e) => set('vehicle_id', Number(e.target.value))} required>
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name_model}</option>)}
        </Select>
        <Input label="Date" type="date" value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} />
        <NumberInput label="Liters" min={0} value={form.liters} onChange={(n) => set('liters', n)} />
        <NumberInput label="Fuel Cost (₹)" min={0} value={form.cost} onChange={(n) => set('cost', n)} />
        <NumberInput label="Odometer (km)" min={0} value={form.odometer ?? 0} onChange={(n) => set('odometer', n)} />
        {error && <div className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>}
      </form>
    </Modal>
  );
}

function ExpenseModal({ vehicles, onClose, onSaved }: { vehicles: { id: number; name_model: string }[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ExpenseInput>({ vehicle_id: undefined, category: 'Toll', amount: 0, description: '', date: '' });
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (d: ExpenseInput) => createExpense(d),
    onSuccess: onSaved,
    onError: (e) => setError(errMsg(e)),
  });
  const set = (k: keyof ExpenseInput, v: string | number | undefined) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e: FormEvent) => { e.preventDefault(); setError(''); mutation.mutate(form); };

  return (
    <Modal open onClose={onClose} title="Add Expense" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="exp-form" disabled={mutation.isPending || form.amount <= 0}>{mutation.isPending ? 'Saving…' : 'Save'}</Button></>}>
      <form id="exp-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Vehicle (optional)" value={form.vehicle_id ?? ''} onChange={(e) => set('vehicle_id', e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">— none —</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name_model}</option>)}
        </Select>
        <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <NumberInput label="Amount (₹)" min={0} value={form.amount} onChange={(n) => set('amount', n)} />
        <Input label="Date" type="date" value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Description" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Highway toll, parking…" />
        </div>
        {error && <div className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>}
      </form>
    </Modal>
  );
}
