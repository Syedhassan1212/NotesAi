import { useState, useEffect, useMemo } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function FinancePage() {
  const { openQuickAction, refreshKey } = useOutletContext<OutletContextType>();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // New Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('2028');

  // New Budget modal
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, incRes, budRes, goalRes] = await Promise.all([
        meApi.getExpenses(),
        meApi.getIncome(),
        meApi.getBudgets(),
        meApi.getGoals()
      ]);
      setExpenses(expRes || []);
      setIncome(incRes || []);
      setBudgets(budRes || []);
      setGoals(goalRes || []);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Calculations
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const balance = totalIncome - totalExpense;
  const netSaved = balance;
  const savingsRate = totalIncome > 0 ? Math.round((netSaved / totalIncome) * 100) : 0;

  const incomeSources = useMemo(() => {
    const map: Record<string, number> = {};
    income.forEach(i => {
      const src = i.source || 'Other';
      map[src] = (map[src] || 0) + (Number(i.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [income]);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate());

  const calculatedBudgets = useMemo(() => {
    return budgets.map(b => {
      const spent = expenses
        .filter(e => (e.category || '').toLowerCase() === (b.category || '').toLowerCase())
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const limit = Number(b.monthlyLimit) || 1;
      const pct = Math.min(100, Math.round((spent / limit) * 100));
      return {
        _id: b._id,
        category: b.category,
        spent,
        limit,
        pct,
        left: Math.max(0, limit - spent),
        isNearLimit: pct >= 90
      };
    });
  }, [budgets, expenses]);

  const transactions = useMemo(() => {
    const expTx = expenses.map(e => ({
      id: `exp-${e._id}`,
      type: 'expense',
      date: e.date || (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      description: e.description || `${e.category} purchase`,
      category: e.category || 'Other',
      method: e.paymentMethod || 'Debit Card',
      account: e.account || 'Wallet',
      amount: -Math.abs(Number(e.amount)),
      rawId: e._id
    }));

    const incTx = income.map(i => ({
      id: `inc-${i._id}`,
      type: 'income',
      date: i.date || (i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      description: i.notes || `${i.source || 'Income'} received`,
      category: 'Income',
      method: i.recurring ? 'Recurring' : 'One-time',
      account: i.account || 'Checking',
      amount: Math.abs(Number(i.amount)),
      rawId: i._id
    }));

    return [...incTx, ...expTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, income]);

  const filteredTransactions = transactions.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchAcc = (t.account || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchAcc) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.info('No transactions to export');
      return;
    }
    const headers = ['Date', 'Description', 'Category', 'Method', 'Account', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.method,
      t.account,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ledger exported to CSV');
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) {
      toast.error('Title and target amount are required');
      return;
    }
    try {
      await meApi.createGoal({
        title: goalTitle,
        targetAmount: Number(goalTarget),
        currentAmount: Number(goalCurrent) || 0,
        deadline: goalDeadline,
      });
      toast.success('Goal created');
      setGoalModalOpen(false);
      setGoalTitle('');
      setGoalTarget('');
      setGoalCurrent('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create goal');
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimit) {
      toast.error('Limit is required');
      return;
    }
    try {
      await meApi.saveBudget({
        category: budgetCategory,
        monthlyLimit: Number(budgetLimit)
      });
      toast.success('Budget saved');
      setBudgetModalOpen(false);
      setBudgetLimit('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save budget');
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest text-on-surface min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
        
        {/* Top Header / Command Greeting */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <h1 className="font-display text-display text-text-primary tracking-tight">
              Finance & Wealth Engine
            </h1>
            <p className="font-body-md text-text-secondary max-w-xl">
              Cashflow, categorical budgets, transactions, and long-term targets.
            </p>
          </div>

          {/* Quick Action Pill Dock */}
          <div className="flex items-center flex-wrap gap-2 p-1.5 rounded-full bg-surface-card shadow-sm self-start lg:self-auto border border-hairline-border">
            <button
              onClick={() => setGoalModalOpen(true)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">flag</span>
              <span>New Goal</span>
            </button>
            <button
              onClick={() => openQuickAction('income')}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">arrow_downward</span>
              <span>Add Income</span>
            </button>
            <button
              onClick={() => openQuickAction('expense')}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-label-md text-label-md shadow-sm font-semibold cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Log Expense</span>
            </button>
          </div>
        </header>

        {/* 4 Metric Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Cashflow Overview</span>
            <span className="font-code text-body-sm text-text-muted">{daysLeft} days remaining in cycle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Balance */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Current Balance</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">account_balance</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {balance.toLocaleString()}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                  <span>{savingsRate}% saved of inflow</span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}></div>
              </div>
            </div>

            {/* Monthly Inflow */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Monthly Inflow</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">trending_up</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {totalIncome.toLocaleString()}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary truncate mt-0.5">
                  {incomeSources.length > 0 ? `${incomeSources[0][0]} (${incomeSources[0][1].toLocaleString()})` : 'No income logged'}
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}></div>
              </div>
            </div>

            {/* Monthly Outflow */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Monthly Outflow</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">trending_down</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {totalExpense.toLocaleString()}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary truncate mt-0.5">
                  Across {expenses.length} transaction entries
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-error h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((totalExpense / (totalIncome || 1)) * 100))}%` }}></div>
              </div>
            </div>

            {/* Net Savings */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Net Saved</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">savings</span>
              </div>
              <div>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight tabular-nums">
                  {netSaved.toLocaleString()}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary truncate mt-0.5">
                  {savingsRate}% net savings rate
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Budgets & Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Category Budgets */}
          <div className="lg:col-span-7 bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">donut_large</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Monthly Category Budgets</h2>
              </div>
              <button
                onClick={() => setBudgetModalOpen(true)}
                className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Set Budget</span>
              </button>
            </div>

            {calculatedBudgets.length === 0 ? (
              <div className="py-8 text-center text-text-muted font-body-sm text-body-sm">
                No categorical budgets set. Click "+ Set Budget" to allocate caps.
              </div>
            ) : (
              <div className="space-y-4">
                {calculatedBudgets.map(b => (
                  <div key={b._id} className="space-y-1.5">
                    <div className="flex items-center justify-between font-label-md text-label-md">
                      <span className="text-text-primary font-medium">{b.category}</span>
                      <div className="text-text-muted tabular-nums">
                        <span className="text-text-primary font-semibold">{b.spent.toLocaleString()}</span>
                        <span> / {b.limit.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.isNearLimit ? 'bg-error' : 'bg-primary'
                        }`}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center font-label-sm text-label-sm text-text-muted">
                      <span>{b.pct}% utilized</span>
                      <span className={b.isNearLimit ? 'text-error font-medium' : ''}>
                        {b.left.toLocaleString()} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Goals */}
          <div className="lg:col-span-5 bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">flag</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Financial Goals</h2>
              </div>
              <button
                onClick={() => setGoalModalOpen(true)}
                className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>New Goal</span>
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-8 text-center text-text-muted font-body-sm text-body-sm">
                No financial goals set. Click "+ New Goal" to track savings targets.
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((g: any) => {
                  const target = Number(g.targetAmount) || 1;
                  const current = Number(g.currentAmount) || 0;
                  const pct = Math.min(100, Math.round((current / target) * 100));

                  return (
                    <div key={g._id} className="p-3.5 rounded-lg bg-surface-container-low border border-hairline-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md font-semibold text-text-primary">{g.title}</span>
                        <span className="font-code text-label-sm text-text-muted">{g.deadline || 'Target'}</span>
                      </div>
                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center font-label-sm text-label-sm text-text-muted tabular-nums">
                        <span>{current.toLocaleString()} of {target.toLocaleString()}</span>
                        <span className="font-semibold text-text-primary">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Transaction Ledger Section */}
        <section className="bg-surface-card border border-hairline-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-hairline-border">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Transaction Ledger</h2>
              <p className="font-body-sm text-body-sm text-text-muted mt-0.5">
                Audit trail of all recorded income and expenditure events.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[16px] text-text-muted absolute left-3 pointer-events-none">search</span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-9 pr-3 py-1.5 rounded-lg outline-none focus:border-primary border border-hairline-border placeholder:text-text-muted transition-colors w-44 sm:w-56"
                  placeholder="Search ledger..."
                  type="text"
                />
              </div>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-text-primary font-label-md text-label-md transition-colors border border-hairline-border cursor-pointer shadow-xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead>
                <tr className="text-text-muted font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low">
                  <th className="py-2.5 px-4 rounded-l-lg">Date</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Account</th>
                  <th className="py-2.5 px-4 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-border">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-text-muted">
                      No transactions recorded. Click "Log Expense" or "Add Income" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx: any) => {
                    const isIncome = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-surface-card-hover transition-colors group">
                        <td className="py-3 px-4 font-code text-label-sm text-text-muted whitespace-nowrap tabular-nums">
                          {tx.date}
                        </td>
                        <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-text-secondary">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary whitespace-nowrap font-label-sm">
                          {tx.method}
                        </td>
                        <td className="py-3 px-4 font-code text-label-sm text-text-muted whitespace-nowrap">
                          {tx.account}
                        </td>
                        <td className={`py-3 px-4 text-right font-code font-semibold whitespace-nowrap tabular-nums ${
                          isIncome ? 'text-secondary' : 'text-text-primary'
                        }`}>
                          {isIncome ? `+${tx.amount.toLocaleString()}` : `-${Math.abs(tx.amount).toLocaleString()}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Goal Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Create Financial Goal</h3>
              <button onClick={() => setGoalModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="space-y-4 font-body-sm text-body-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Goal Name</label>
                <input
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="e.g. Master's Degree Fund"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Target Amount</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={e => setGoalTarget(e.target.value)}
                    placeholder="1500000"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Current Amount</label>
                  <input
                    type="number"
                    value={goalCurrent}
                    onChange={e => setGoalCurrent(e.target.value)}
                    placeholder="420000"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Target Year / Deadline</label>
                <input
                  value={goalDeadline}
                  onChange={e => setGoalDeadline(e.target.value)}
                  placeholder="2028"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-border">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Set Monthly Budget</h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4 font-body-sm text-body-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Category</label>
                <select
                  value={budgetCategory}
                  onChange={e => setBudgetCategory(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                >
                  {['Food', 'Transport', 'Education', 'Gym', 'Shopping', 'Entertainment', 'Bills', 'Subscriptions', 'Software', 'Other'].map(c => (
                    <option key={c} value={c} className="bg-surface-card">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Monthly Spending Limit</label>
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={e => setBudgetLimit(e.target.value)}
                  placeholder="15000"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-text-secondary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
