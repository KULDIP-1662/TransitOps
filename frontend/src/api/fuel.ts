import api from '../lib/api';
import type { FuelLog, FuelInput, Expense, ExpenseInput, CostSummary } from '../types';

export async function getFuel(): Promise<FuelLog[]> {
  const { data } = await api.get<FuelLog[]>('/fuel');
  return data;
}
export async function createFuel(input: FuelInput): Promise<FuelLog> {
  const { data } = await api.post<FuelLog>('/fuel', input);
  return data;
}
export async function deleteFuel(id: number): Promise<void> {
  await api.delete(`/fuel/${id}`);
}

export async function getExpenses(): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>('/expenses');
  return data;
}
export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data } = await api.post<Expense>('/expenses', input);
  return data;
}
export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

export async function getCostSummary(): Promise<CostSummary> {
  const { data } = await api.get<CostSummary>('/costs/summary');
  return data;
}
