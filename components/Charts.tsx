"use client";
import { Transaction, Category } from '../drizzle/schema';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function Charts({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const [months] = useState(6);
  const monthly = useMemo(()=>buildMonthly(transactions, months), [transactions, months]);
  const categoryData = useMemo(()=>buildCategoryBreakdown(transactions, categories), [transactions, categories]);
  return (
    <div className="space-y-6">
      <motion.div initial={{opacity:0, y:12}} animate={{opacity:1,y:0}} transition={{duration:.5}} className="glass rounded-xl p-4 h-64">
        <h3 className="font-semibold mb-2 text-sm">Monthly Net (last {months})</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthly} margin={{ top:10, right:10, left:0, bottom:0 }}>
            <XAxis dataKey="label" fontSize={10} />
            <YAxis fontSize={10} width={40} />
            <Tooltip contentStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
      <motion.div initial={{opacity:0, y:12}} animate={{opacity:1,y:0}} transition={{duration:.6, delay:.05}} className="glass rounded-xl p-4 h-64">
        <h3 className="font-semibold mb-2 text-sm">Category Expense Breakdown</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} fill="#8884d8">
              {categoryData.map(c => <Cell key={c.name} fill={c.color} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

function buildMonthly(transactions: Transaction[], months: number) {
  const now = new Date();
  const map: Record<string, { income: number; expense: number; net: number; label: string }> = {};
  for (let i=months-1;i>=0;i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    map[key] = { income:0, expense:0, net:0, label: d.toLocaleString('default',{ month:'short'}) };
  }
  transactions.forEach(t => {
    const d = new Date(t.occurredAt as any);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) return;
    const amt = Number(t.amount);
    if (t.type === 'income') map[key].income += amt; else map[key].expense += amt;
  });
  Object.values(map).forEach(v => v.net = v.income - v.expense);
  return Object.values(map);
}

function buildCategoryBreakdown(transactions: Transaction[], categories: Category[]) {
  const expenses: Record<string, number> = {};
  transactions.filter(t=>t.type==='expense').forEach(t=>{
    if (!t.categoryId) return;
    expenses[t.categoryId] = (expenses[t.categoryId]||0) + Number(t.amount);
  });
  return categories.filter(c=>expenses[c.id]).map(c=>({ name: c.name, value: expenses[c.id], color: c.color }));
}
