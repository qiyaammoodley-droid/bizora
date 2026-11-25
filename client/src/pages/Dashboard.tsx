import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, FileText, RefreshCw, Users, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = { organisationId: string; userRole: string; onNavigate: (page: string) => void };
type Booking = { id: string; customer_id: string; title: string; start_at: string; end_at: string; status: string };
type Customer = { id: string; full_name: string };
type Invoice = { id: string; status: string; due_date: string };
type Item = { invoice_id: string; line_total: number | string };
type Payment = { invoice_id: string; amount: number | string };

const money = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);
const dateText = (v: string) => new Date(v).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
const timeText = (v: string) => new Date(v).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

export default function Dashboard({ organisationId, userRole, onNavigate }: Props) {
  const [customerCount, setCustomerCount] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const financialAccess = userRole === 'owner' || userRole === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [countResult, bookingResult, namesResult] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('organisation_id', organisationId).is('archived_at', null),
      supabase.from('bookings').select('id, customer_id, title, start_at, end_at, status').eq('organisation_id', organisationId).gte('start_at', now.toISOString()).lt('start_at', weekEnd.toISOString()).order('start_at'),
      supabase.from('customers').select('id, full_name').eq('organisation_id', organisationId),
    ]);
    const issue = countResult.error ?? bookingResult.error ?? namesResult.error;
    if (issue) { setError(issue.message); setLoading(false); return; }
    setCustomerCount(countResult.count ?? 0);
    setBookings((bookingResult.data ?? []) as Booking[]);
    setCustomers((namesResult.data ?? []) as Customer[]);

    if (financialAccess) {
      const invoiceResult = await supabase.from('invoices').select('id, status, due_date').eq('organisation_id', organisationId).neq('status', 'cancelled');
      if (invoiceResult.error) { setError(invoiceResult.error.message); setLoading(false); return; }
      const invoices = (invoiceResult.data ?? []) as Invoice[];
      if (!invoices.length) { setOutstanding(0); setOverdue(0); }
      else {
        const ids = invoices.map(x => x.id);
        const [itemsResult, paymentsResult] = await Promise.all([
          supabase.from('invoice_items').select('invoice_id, line_total').eq('organisation_id', organisationId).in('invoice_id', ids),
          supabase.from('payments').select('invoice_id, amount').eq('organisation_id', organisationId).in('invoice_id', ids),
        ]);
        if (itemsResult.error || paymentsResult.error) { setError(itemsResult.error?.message ?? paymentsResult.error?.message ?? 'Could not load invoice totals.'); setLoading(false); return; }
        const items = (itemsResult.data ?? []) as Item[];
        const payments = (paymentsResult.data ?? []) as Payment[];
        let balanceTotal = 0;
        let overdueCount = 0;
        invoices.forEach(invoice => {
          const total = items.filter(x => x.invoice_id === invoice.id).reduce((sum, x) => sum + Number(x.line_total), 0);
          const paid = payments.filter(x => x.invoice_id === invoice.id).reduce((sum, x) => sum + Number(x.amount), 0);
          const balance = Math.max(total - paid, 0);
          balanceTotal += balance;
          if (invoice.status === 'sent' && invoice.due_date < now.toISOString().slice(0, 10) && balance > 0) overdueCount += 1;
        });
        setOutstanding(balanceTotal);
        setOverdue(overdueCount);
      }
    }
    setLoading(false);
  }, [organisationId, financialAccess]);

  useEffect(() => { void load(); }, [load]);

  const todayBookings = useMemo(() => bookings.filter(x =>
    new Date(x.start_at).toDateString() === new Date().toDateString() && !['cancelled', 'no_show'].includes(x.status)
  ), [bookings]);
  const upcoming = useMemo(() => bookings.filter(x => !['cancelled', 'no_show'].includes(x.status)).slice(0, 6), [bookings]);
  const customerName = (id: string) => customers.find(x => x.id === id)?.full_name ?? 'Customer';

  const stats = [
    { label: 'Active customers', value: customerCount.toLocaleString('en-ZA'), note: 'Customers in your workspace', icon: Users, page: 'Customers', color: 'text-violet-300 bg-violet-500/10' },
    { label: "Today's bookings", value: String(todayBookings.length), note: 'Scheduled for today', icon: CalendarDays, page: 'Bookings & Scheduling', color: 'text-sky-300 bg-sky-500/10' },
    { label: 'Next 7 days', value: String(upcoming.length), note: 'Upcoming appointments', icon: Clock3, page: 'Bookings & Scheduling', color: 'text-emerald-300 bg-emerald-500/10' },
    ...(financialAccess ? [{ label: 'Outstanding balance', value: money(outstanding), note: `${overdue} overdue invoices`, icon: Wallet, page: 'Payments & Invoices', color: 'text-amber-300 bg-amber-500/10' }] : []),
  ];

  return <section className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-sm font-medium text-bizora-primary">OVERVIEW</p><h1 className="text-3xl font-bold text-white">Dashboard</h1><p className="mt-2 text-sm text-gray-400">Here is what is happening in your business.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-bizora-border bg-bizora-surface px-4 py-2.5 text-sm text-gray-300 hover:border-bizora-primary disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh data</button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">Dashboard data could not be fully loaded: {error}</div>}
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${financialAccess ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {stats.map(stat => { const Icon = stat.icon; return <button key={stat.label} onClick={() => onNavigate(stat.page)} className="rounded-xl border border-bizora-border bg-bizora-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-bizora-primary/60"><div className="flex items-start justify-between"><span className="text-sm text-gray-400">{stat.label}</span><span className={`rounded-lg p-2 ${stat.color}`}><Icon size={19} /></span></div><p className="mt-5 break-words text-2xl font-bold text-white">{loading ? '...' : stat.value}</p><p className="mt-1 text-xs text-gray-500">{stat.note}</p></button>; })}
    </div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="overflow-hidden rounded-xl border border-bizora-border bg-bizora-surface">
        <div className="flex items-center justify-between border-b border-bizora-border px-5 py-4"><div><h2 className="font-semibold text-white">Upcoming bookings</h2><p className="mt-1 text-xs text-gray-500">Your next appointments over the coming seven days</p></div><button onClick={() => onNavigate('Bookings & Scheduling')} className="inline-flex items-center gap-1 text-xs font-semibold text-bizora-primary">View calendar <ArrowRight size={14} /></button></div>
        {loading ? <p className="p-8 text-center text-sm text-gray-400">Loading your schedule...</p> : upcoming.length === 0 ? <div className="px-6 py-12 text-center"><CalendarDays className="mx-auto mb-3 text-gray-500" size={28} /><p className="font-medium text-white">Your calendar is clear</p><p className="mt-1 text-sm text-gray-500">New bookings for the next seven days will appear here.</p><button onClick={() => onNavigate('Bookings & Scheduling')} className="mt-4 rounded-lg bg-bizora-primary px-4 py-2 text-sm font-semibold text-white">Open bookings</button></div> : <div className="divide-y divide-bizora-border">{upcoming.map(booking => <div key={booking.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{booking.title}</p><p className="mt-1 text-xs text-gray-400">{customerName(booking.customer_id)}</p></div><div className="shrink-0 sm:text-right"><p className="text-sm text-gray-200">{dateText(booking.start_at)}</p><p className="mt-1 text-xs text-gray-500">{timeText(booking.start_at)} · {booking.status.replace('_', ' ')}</p></div></div>)}</div>}
      </div>
      <div className="space-y-5">
        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5"><div className="mb-4 flex items-center gap-3"><span className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><Users size={19} /></span><div><h2 className="font-semibold text-white">Customer management</h2><p className="text-xs text-gray-500">Keep your customer records organised</p></div></div><button onClick={() => onNavigate('Customers')} className="flex w-full items-center justify-between rounded-lg border border-bizora-border px-4 py-3 text-sm text-gray-300 hover:border-bizora-primary">Open customers <ArrowRight size={16} /></button></div>
        {financialAccess && <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5"><div className="mb-4 flex items-center gap-3"><span className="rounded-lg bg-amber-500/10 p-2 text-amber-300"><FileText size={19} /></span><div><h2 className="font-semibold text-white">Invoices & payments</h2><p className="text-xs text-gray-500">Keep an eye on money owed to your business</p></div></div><p className="mb-3 text-2xl font-bold text-white">{loading ? '...' : money(outstanding)}</p><button onClick={() => onNavigate('Payments & Invoices')} className="flex w-full items-center justify-between rounded-lg border border-bizora-border px-4 py-3 text-sm text-gray-300 hover:border-bizora-primary">Manage invoices <ArrowRight size={16} /></button></div>}
      </div>
    </div>
  </section>;
}
