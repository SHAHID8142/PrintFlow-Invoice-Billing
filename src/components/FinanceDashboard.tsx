import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import clsx from 'clsx';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';

export default function FinanceDashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summary, setSummary] = useState({ income: 0, expenses: 0 });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const monthStr = format(currentMonth, 'yyyy-MM');

  useEffect(() => {
    fetchData();
  }, [monthStr]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        fetch(`/api/finance/summary?month=${monthStr}`),
        fetch(`/api/expenses?month=${monthStr}`)
      ]);
      
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const openNewExpenseModal = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const openEditExpenseModal = (expense: any) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  const netProfit = summary.income - summary.expenses;
  const isPositive = netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Summary</h1>
          <p className="text-sm text-slate-500 mt-1">Track your income, expenses, and net profit.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
              &larr;
            </button>
            <div className="px-4 py-1 text-sm font-medium text-slate-700 flex items-center min-w-[120px] justify-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button onClick={handleNextMonth} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
              &rarr;
            </button>
          </div>
          
          <button
            onClick={openNewExpenseModal}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Income</h3>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">${summary.income.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-500">From paid invoices</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Expenses</h3>
            <div className="p-2 bg-rose-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-rose-600" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">${summary.expenses.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-500">Logged expenses</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Net Profit</h3>
            <div className={clsx("p-2 rounded-lg", isPositive ? "bg-emerald-50" : "bg-rose-50")}>
              <DollarSign className={clsx("h-5 w-5", isPositive ? "text-emerald-600" : "text-rose-600")} />
            </div>
          </div>
          <p className={clsx("mt-4 text-3xl font-bold", isPositive ? "text-emerald-600" : "text-rose-600")}>
            ${Math.abs(netProfit).toFixed(2)}
            {netProfit < 0 && <span className="text-sm font-medium ml-1 text-rose-500">(Loss)</span>}
          </p>
          <p className="mt-1 text-sm text-slate-500">Income minus expenses</p>
        </div>
      </div>

      {/* Expense List */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Expense Ledger</h2>
        <ExpenseList 
          expenses={expenses} 
          loading={loading} 
          onEdit={openEditExpenseModal}
          onDelete={handleDeleteExpense}
        />
      </div>

      {/* Expense Modal */}
      <ExpenseForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}
