import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Users,
  CalendarDays,
  TrendingUp,
  Receipt,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  organisationId: string;
  userRole: string;
};

type Booking = {
  id: string;
  status: string;
  start_at: string;
};

type Customer = {
  id: string;
  created_at: string;
};

type Payment = {
  id: string;
  amount: number;
  payment_date: string;
};

type Invoice = {
  id: string;
  status: string;
  issue_date: string;
};

type Range = '30' | '90' | 'all';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
  }).format(amount);

export default function Reports({
  organisationId,
  userRole,
}: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [range, setRange] = useState<Range>('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const canViewFinancials =
    userRole === 'owner' || userRole === 'admin';

  async function loadReports() {
    setLoading(true);
    setError('');

    const requests = await Promise.all([
      supabase
        .from('bookings')
        .select('id,status,start_at')
        .eq('organisation_id', organisationId),

      supabase
        .from('customers')
        .select('id,created_at')
        .eq('organisation_id', organisationId),

      canViewFinancials
        ? supabase
            .from('payments')
            .select('id,amount,payment_date')
            .eq('organisation_id', organisationId)
        : Promise.resolve({ data: [], error: null }),

      canViewFinancials
        ? supabase
            .from('invoices')
            .select('id,status,issue_date')
            .eq('organisation_id', organisationId)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const failedRequest = requests.find((request) => request.error);

    if (failedRequest?.error) {
      setError(failedRequest.error.message);
    } else {
      setBookings((requests[0].data ?? []) as Booking[]);
      setCustomers((requests[1].data ?? []) as Customer[]);
      setPayments((requests[2].data ?? []) as Payment[]);
      setInvoices((requests[3].data ?? []) as Invoice[]);
      setLastUpdated(new Date());
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, [organisationId, canViewFinancials]);

  const startDate = useMemo(() => {
    if (range === 'all') return null;

    const date = new Date();
    date.setDate(date.getDate() - Number(range));
    return date;
  }, [range]);

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !startDate || new Date(booking.start_at) >= startDate
      ),
    [bookings, startDate]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          !startDate || new Date(customer.created_at) >= startDate
      ),
    [customers, startDate]
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          !startDate || new Date(payment.payment_date) >= startDate
      ),
    [payments, startDate]
  );

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          !startDate || new Date(invoice.issue_date) >= startDate
      ),
    [invoices, startDate]
  );

  const revenue = filteredPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const bookingStatuses = [
    {
      label: 'Scheduled',
      value: filteredBookings.filter((b) => b.status === 'scheduled').length,
      icon: Clock,
    },
    {
      label: 'Confirmed',
      value: filteredBookings.filter((b) => b.status === 'confirmed').length,
      icon: CheckCircle2,
    },
    {
      label: 'Completed',
      value: filteredBookings.filter((b) => b.status === 'completed').length,
      icon: CheckCircle2,
    },
    {
      label: 'Cancelled',
      value: filteredBookings.filter((b) => b.status === 'cancelled').length,
      icon: XCircle,
    },
    {
      label: 'No-show',
      value: filteredBookings.filter((b) => b.status === 'no_show').length,
      icon: AlertCircle,
    },
  ];
const maxPayments = Math.max(
    1,
    ...filteredPayments.map((payment) => Number(payment.amount))
  );

  const recentPayments = [...filteredPayments]
    .sort(
      (a, b) =>
        new Date(b.payment_date).getTime() -
        new Date(a.payment_date).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-bizora-primary">
            <BarChart3 size={23} />
            <h1 className="text-2xl font-semibold text-white">
              Reports & Analytics
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Understand your business performance through your actual workspace data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as Range)}
            className="rounded-lg border border-bizora-border bg-bizora-surface px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-bizora-border bg-bizora-surface px-4 py-2.5 text-sm text-gray-300 hover:bg-bizora-background"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {lastUpdated && (
        <p className="text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleString('en-ZA')}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Total bookings"
          value={filteredBookings.length.toString()}
          icon={CalendarDays}
          loading={loading}
        />

        <Metric
          title="Customers added"
          value={filteredCustomers.length.toString()}
          icon={Users}
          loading={loading}
        />

        <Metric
          title="Completed bookings"
          value={filteredBookings
            .filter((b) => b.status === 'completed')
            .length.toString()}
          icon={CheckCircle2}
          loading={loading}
        />

        {canViewFinancials && (
          <Metric
            title="Payments received"
            value={formatCurrency(revenue)}
            icon={TrendingUp}
            loading={loading}
          />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Booking performance</h2>
            <p className="mt-1 text-sm text-gray-400">
              Breakdown of bookings by their current status.
            </p>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="space-y-5">
              {bookingStatuses.map((status) => {
                const Icon = status.icon;
                const percentage =
                  filteredBookings.length > 0
                    ? (status.value / filteredBookings.length) * 100
                    : 0;

                return (
                  <div key={status.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-300">
                        <Icon size={16} className="text-bizora-primary" />
                        {status.label}
                      </span>
                      <span className="font-medium text-white">
                        {status.value}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bizora-background">
                      <div
                        className="h-full rounded-full bg-bizora-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Business activity</h2>
            <p className="mt-1 text-sm text-gray-400">
              A snapshot of your workspace activity.
            </p>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              <ActivityRow
                label="Total customers"
                value={customers.length}
              />
              <ActivityRow
                label="Total bookings"
                value={bookings.length}
              />
              <ActivityRow
                label="Bookings in selected period"
                value={filteredBookings.length}
              />
              <ActivityRow
                label="New customers in selected period"
                value={filteredCustomers.length}
              />
              {canViewFinancials && (
                <>
                  <ActivityRow
                    label="Invoices issued"
                    value={filteredInvoices.length}
                  />
                  <ActivityRow
                    label="Payments recorded"
                    value={filteredPayments.length}
                  />
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {canViewFinancials && (
        <>
          <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
            <div className="mb-5">
              <h2 className="font-semibold text-white">Payment activity</h2>
              <p className="mt-1 text-sm text-gray-400">
                Your five most recent payments, with individual amounts.
              </p>
            </div>

            {loading ? (
              <Loading />
            ) : recentPayments.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No payments recorded in this period.
              </p>
            ) : (
              <div className="space-y-5">
                {recentPayments.map((payment) => (
                  <div key={payment.id}>
                    <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                      <span className="text-gray-400">
                        {new Date(payment.payment_date).toLocaleDateString('en-ZA')}
                      </span>
                      <span className="font-medium text-white">
                        {formatCurrency(Number(payment.amount))}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bizora-background">
                      <div
                        className="h-full rounded-full bg-bizora-primary"
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(payment.amount) / maxPayments) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
            <div className="mb-5 flex items-center gap-2">
              <Receipt size={20} className="text-bizora-primary" />
              <div>
                <h2 className="font-semibold text-white">Financial overview</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Invoice and payment activity for the selected period.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <ActivityCard
                label="Invoices issued"
                value={filteredInvoices.length}
              />
              <ActivityCard
                label="Draft invoices"
                value={filteredInvoices.filter((i) => i.status === 'draft').length}
              />
              <ActivityCard
                label="Payments received"
                value={filteredPayments.length}
              />
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Payments received represents recorded payments, not necessarily
              all invoices issued or the total value of outstanding invoices.
            </p>
          </section>
        </>
      )}

      {!canViewFinancials && (
        <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <div className="flex items-center gap-3">
            <Receipt size={21} className="text-gray-400" />
            <div>
              <h2 className="font-semibold text-white">Financial reports restricted</h2>
              <p className="mt-1 text-sm text-gray-400">
                Financial analytics are available to owners and administrators only.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
        <h2 className="mb-2 font-semibold text-white">Performance summary</h2>
        <p className="text-sm leading-6 text-gray-400">
          {filteredBookings.length === 0
            ? 'There are no bookings in the selected period yet. Once your team starts recording bookings, this report will show their progress.'
            : `${filteredBookings.filter((b) => b.status === 'completed').length} of ${filteredBookings.length} bookings in the selected period have been completed.`}
        </p>
      </section>
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
      <Icon size={22} className="mb-3 text-bizora-primary" />
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-white">
        {loading ? '...' : value}
      </p>
    </div>
  );
}

function ActivityRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-bizora-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function ActivityCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-bizora-border bg-bizora-background p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
      <RefreshCw size={17} className="animate-spin" />
      Loading report data...
    </div>
  );
}

