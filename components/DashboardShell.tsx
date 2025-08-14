"use client";
import React, { useEffect, useState } from 'react';
import { useToast } from './Toaster';
import { Trash2, Edit2, MoonStar, Sun, RefreshCw, Download, Repeat, Palette } from 'lucide-react';
import Charts from './Charts';
import { convert } from '../lib/currency';
import { motion } from 'framer-motion';
import { Transaction, Category } from '../drizzle/schema';

export default function DashboardShell({ initialTransactions = [], initialCategories = [] }: { initialTransactions?: Transaction[]; initialCategories?: Category[] }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  useEffect(() => {
    if (initialTransactions.length === 0 || initialCategories.length === 0) {
      Promise.all([
        fetch('/api/transactions').then(r => r.json()),
        fetch('/api/categories').then(r => r.json())
      ]).then(([tx, cats]) => {
        setTransactions(tx);
        setCategories(cats);
      });
    }
  }, [initialTransactions.length, initialCategories.length]);

  const [rates, setRates] = useState<any|null>(null);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [role, setRole] = useState<string>('user');
  const { push } = useToast();

  useEffect(()=>{fetch('/api/role').then(r=>r.ok?r.json():null).then(d=>d&&setRole(d.role)).catch(()=>{});},[]);

  // load persisted currency preference
  useEffect(()=>{
    const stored = typeof window !== 'undefined' ? localStorage.getItem('displayCurrency') : null;
    if (stored) setDisplayCurrency(stored);
  },[]);
  useEffect(()=>{
    if (typeof window !== 'undefined') localStorage.setItem('displayCurrency', displayCurrency);
  },[displayCurrency]);

  useEffect(()=>{
    fetch('/api/rates').then(r=>r.ok?r.json():null).then(setRates).catch(()=>{});
  }, []);

  const totalIncomeRaw = transactions.filter((t) => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
  const totalExpenseRaw = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
  const totalIncome = convert(totalIncomeRaw, 'USD', displayCurrency, rates && { base: rates.base, rates: rates.rates, fetchedAt: '' });
  const totalExpense = convert(totalExpenseRaw, 'USD', displayCurrency, rates && { base: rates.base, rates: rates.rates, fetchedAt: '' });
  const net = totalIncome - totalExpense;

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
  <h1 className="text-2xl font-bold">Dashboard <span className="text-xs font-normal text-muted-foreground">({role})</span></h1>
        <div className="flex gap-2 flex-wrap items-center">
          <ExportButtons />
          <RefreshRecurring setTransactions={setTransactions} />
          <ThemeToggle />
          <ThemePaletteSwitcher />
        </div>
      </header>
    <div className="grid gap-6 md:grid-cols-3">
  <StatCard variant="income" title={`Income (${displayCurrency})`} value={totalIncome.toFixed(2)} />
  <StatCard variant="expense" title={`Expenses (${displayCurrency})`} value={totalExpense.toFixed(2)} />
  <StatCard variant="net" title={`Net (${displayCurrency})`} value={net.toFixed(2)} />
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <TransactionForm categories={categories} onCreate={(t)=>{setTransactions([t,...transactions]); push({ title:'Transaction added', variant:'success'});}} />
          <CategoryForm onCreate={(c)=>{setCategories([c,...categories]); push({ title:'Category added', variant:'success'});}} />
          <RecentTransactions transactions={transactions} onDelete={(id)=>{
            fetch('/api/transactions',{method:'DELETE',body:JSON.stringify({id}),headers:{'Content-Type':'application/json'}}).then(r=>{ if(r.ok){ setTransactions(tr=>tr.filter(t=>t.id!==id)); push({title:'Transaction deleted', variant:'success'});} else push({title:'Delete failed', variant:'error'}); });
          }} onEdit={(t)=>{
            const amount = prompt('New amount', String(t.amount));
            if(amount===null) return; const num = Number(amount); if(isNaN(num)) return push({title:'Invalid number', variant:'error'});
            fetch('/api/transactions',{method:'PUT',body:JSON.stringify({id:t.id, amount:num}),headers:{'Content-Type':'application/json'}}).then(r=>{ if(r.ok){ setTransactions(ts=>ts.map(x=>x.id===t.id?{...x, amount:String(num)}:x)); push({title:'Transaction updated', variant:'success'});} else push({title:'Update failed', variant:'error'}); });
          }} />
        </div>
        <div className="space-y-6">
          <CurrencySelector rates={rates} value={displayCurrency} onChange={setDisplayCurrency} />
          {role==='admin' && <RoleManager currentRole={role} onChange={r=>setRole(r)} />}
          <Budgets categories={categories} transactions={transactions} />
          <Charts transactions={transactions} categories={categories} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, variant }: { title: string; value: string; variant?: 'income'|'expense'|'net' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-xl p-5 text-white shadow-lg backdrop-blur-sm ${variant==='income'?'stat-gradient-income':variant==='expense'?'stat-gradient-expense':'stat-gradient-net'}`}>
      <div className="text-xs uppercase tracking-wide opacity-90">{title}</div>
      <div className="text-3xl font-bold mt-1 drop-shadow-sm">{value}</div>
    </motion.div>
  );
}

function RecentTransactions({ transactions, onDelete, onEdit }: { transactions: Transaction[]; onDelete:(id:string)=>void; onEdit:(t:Transaction)=>void }) {
  return (
    <section>
      <h2 className="font-semibold mb-2">Recent Transactions</h2>
      <ul className="space-y-1 text-sm max-h-80 overflow-auto pr-2">
        {transactions.slice(0, 15).map(t => (
          <li key={t.id} className="flex justify-between items-center border-b py-1 gap-2">
            <div className="flex flex-col leading-tight">
              <span>{t.description || t.type}</span>
              <span className="text-[10px] uppercase opacity-60">{t.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={t.type === 'expense' ? 'text-red-500' : 'text-green-600 font-medium'}>
                {t.type === 'expense' ? '-' : '+'}{Number(t.amount).toFixed(2)} {t.currency}
              </span>
              <button onClick={()=>onEdit(t)} className="btn-ghost p-1" aria-label="Edit"><Edit2 size={14} /></button>
              <button onClick={()=>onDelete(t.id)} className="btn-ghost p-1" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TransactionForm({ categories, onCreate }: { categories: Category[]; onCreate: (t: Transaction)=>void }) {
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const { push } = useToast();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());
    setLoading(true);
    const res = await fetch('/api/transactions', { method: 'POST', body: JSON.stringify({
      categoryId: data.categoryId || undefined,
      type: data.type,
      amount: Number(data.amount),
      description: data.description,
      recurrence: data.recurrence,
      currency
    }), headers: { 'Content-Type': 'application/json' }});
    setLoading(false);
    if (res.ok) {
      const json = await res.json();
      onCreate(json);
      form.reset();
    } else {
      push({ title:'Failed to add transaction', variant:'error'});
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 glass rounded-xl p-5">
      <h2 className="font-semibold">Add Transaction</h2>
      <div className="grid gap-2 md:grid-cols-4">
        <select name="type" required className="border px-2 py-2 rounded bg-background/60">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Amount" required className="border px-2 py-2 rounded bg-background/60" />
        <select name="categoryId" className="border px-2 py-2 rounded bg-background/60">
          <option value="">No Category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="recurrence" className="border px-2 py-2 rounded bg-background/60">
          <option value="none">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-xs text-muted-foreground">Currency:</label>
        <select value={currency} onChange={e=>setCurrency(e.target.value)} className="border px-2 py-1 rounded text-sm bg-background/60">
          {['USD','EUR','GBP','JPY','CAD'].map(c=> <option key={c}>{c}</option>)}
        </select>
      </div>
      <input name="description" placeholder="Description" className="border px-2 py-2 rounded w-full bg-background/60" />
  <button disabled={loading} className="btn-primary w-full flex items-center justify-center gap-1">{loading?<RefreshCw size={14} className="animate-spin"/>:<Download size={14} />} {loading?'Saving...':'Save Transaction'}</button>
    </form>
  );
}

function CategoryForm({ onCreate }: { onCreate: (c: Category)=>void }) {
  const { push } = useToast();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await fetch('/api/categories', { method: 'POST', body: JSON.stringify({
      name: data.name,
      color: data.color,
      budget: Number(data.budget||0)
    }), headers: { 'Content-Type': 'application/json' }});
    if (res.ok) {
      const json = await res.json();
      onCreate(json);
      form.reset();
    } else {
      push({ title:'Failed to add category', variant:'error'});
    }
  };
  return (
  <form onSubmit={submit} className="space-y-3 glass rounded-xl p-5">
      <h2 className="font-semibold">Add Category</h2>
      <div className="grid gap-2 md:grid-cols-4">
    <input name="name" placeholder="Name" required className="border px-2 py-2 rounded bg-background/60" />
    <input name="color" type="color" defaultValue="#3b82f6" className="border px-2 py-2 rounded bg-background/60" />
    <input name="budget" type="number" step="0.01" placeholder="Budget" className="border px-2 py-2 rounded bg-background/60" />
  <button className="btn-primary flex items-center justify-center gap-1"><Download size={14}/>Add</button>
      </div>
    </form>
  );
}

function Budgets({ categories, transactions }: { categories: Category[]; transactions: Transaction[] }) {
  return (
  <div className="glass rounded-xl p-5 space-y-4">
      <h2 className="font-semibold">Budgets</h2>
      <ul className="space-y-2 text-sm">
        {categories.map(c => {
          const spent = transactions.filter(t => t.categoryId === c.id && t.type==='expense').reduce((a,b)=>a+Number(b.amount),0);
          const budget = Number(c.budget||0);
            const pct = budget? Math.min(100,(spent/budget)*100):0;
          return (
            <li key={c.id}>
              <div className="flex justify-between"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{background:c.color}}></span>{c.name}</span><span>{spent.toFixed(2)}/{budget.toFixed(2)}</span></div>
  <div className="h-2 bg-muted/40 rounded overflow-hidden mt-1"><div className={`h-full transition-all ${spent>budget?'bg-destructive budget-over':'bg-primary'}`} style={{width:`${pct}%`}}></div></div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


function ExportButtons() {
  const exportFmt = async (format: string) => {
    const res = await fetch('/api/export', { method: 'POST', body: JSON.stringify({ format }), headers: { 'Content-Type': 'application/json' }});
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions.${format==='csv'?'csv':'pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex gap-2">
  <button onClick={()=>exportFmt('csv')} className="btn-outline text-xs flex items-center gap-1"><Download size={14}/>CSV</button>
  <button onClick={()=>exportFmt('pdf')} className="btn-outline text-xs flex items-center gap-1"><Download size={14}/>PDF</button>
    </div>
  );
}

function RefreshRecurring({ setTransactions }: { setTransactions: (tx: Transaction[])=>void }) {
  const run = async () => {
    await fetch('/api/recurring', { method: 'POST' });
    const data = await fetch('/api/transactions').then(r=>r.json());
    setTransactions(data);
  };
  return <button onClick={run} className="btn-outline text-xs flex items-center gap-1"><Repeat size={14}/>Run Recurring</button>;
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(()=>{document.documentElement.classList.toggle('dark', dark);},[dark]);
  return <button onClick={()=>setDark(!dark)} className="btn-outline text-xs flex items-center gap-1">{dark?<Sun size={14}/>:<MoonStar size={14}/>}{dark?'Light':'Dark'}</button>;
}

function CurrencySelector({ rates, value, onChange }: { rates: any; value: string; onChange: (v:string)=>void }) {
  const options = rates ? [rates.base, ...Object.keys(rates.rates)] : ['USD'];
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-2">
      <span className="text-sm font-semibold">Currency</span>
      <select value={value} onChange={e=>onChange(e.target.value)} className="border px-2 py-1 rounded text-sm">
        {options.filter((v,i,a)=>a.indexOf(v)===i).map(c=> <option key={c}>{c}</option>)}
      </select>
      {rates && <button onClick={()=>fetch('/api/rates',{method:'POST'}).then(r=>r.ok&&location.reload())} className="btn-ghost text-xs">Refresh Rates</button>}
    </div>
  );
}

function ThemePaletteSwitcher() {
  const palettes = ['default','sunset','forest','ocean'];
  const [p, setP] = useState<string>('default');
  useEffect(()=>{ const stored = localStorage.getItem('palette'); if(stored){ setP(stored); if(stored!=='default') document.body.dataset.theme = stored; } },[]);
  useEffect(()=>{ localStorage.setItem('palette', p); if(p==='default') delete document.body.dataset.theme; else document.body.dataset.theme = p; },[p]);
  return (
    <div className="flex items-center gap-1 text-xs">
      <Palette size={14} />
      <select value={p} onChange={e=>setP(e.target.value)} className="border rounded px-1 py-0.5 bg-background/60">
        {palettes.map(x=> <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  );
}

function RoleManager({ currentRole, onChange }: { currentRole: string; onChange: (r:string)=>void }) {
  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await fetch('/api/role', { method: 'POST', body: JSON.stringify({ role: data.role }), headers: { 'Content-Type': 'application/json' }});
    if (res.ok) {
      const js = await res.json();
      onChange(js.role);
    }
  };
  return (
    <form onSubmit={update} className="glass rounded-xl p-4 flex items-center gap-2 text-sm">
      <span className="font-semibold">Role</span>
      <select name="role" defaultValue={currentRole} className="border px-2 py-1 rounded">
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <button className="btn-outline">Set</button>
    </form>
  );
}
