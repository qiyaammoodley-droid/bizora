
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type BookingStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

type Booking = {
  id: string;
  organisation_id: string;
  customer_id: string;
  assigned_user_id: string | null;
  title: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  notes: string | null;
  created_by: string;
  customer?: { full_name: string } | null;
};

type CustomerOption = {
  id: string;
  full_name: string;
  archived_at: string | null;
};

type TeamMember = {
  user_id: string;
  full_name: string;
  role: string;
};

type BookingsProps = {
  organisationId: string;
  userId: string;
};

type BookingForm = {
  title: string;
  customer_id: string;
  assigned_user_id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  notes: string;
};

type CalendarView = 'day' | 'week' | 'month';

const emptyForm: BookingForm = {
  title: '',
  customer_id: '',
  assigned_user_id: '',
  start_at: '',
  end_at: '',
  status: 'scheduled',
  notes: '',
};

const statusLabels: Record<BookingStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

const statusStyles: Record<BookingStatus, string> = {
  scheduled: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  completed: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/20',
  no_show: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

function toLocalInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Bookings({ organisationId, userId }: BookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<CalendarView>('week');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyForm);

  const range = useMemo(() => {
    let start: Date;
    let end: Date;

    if (view === 'day') {
      start = startOfDay(selectedDate);
      end = addDays(start, 1);
    } else if (view === 'week') {
      start = startOfWeek(selectedDate);
      end = addDays(start, 7);
    } else {
      start = startOfMonth(selectedDate);
      end = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        1,
      );
    }

    return { start, end };
  }, [selectedDate, view]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        organisation_id,
        customer_id,
        assigned_user_id,
        title,
        start_at,
        end_at,
        status,
        notes,
        created_by,
        customer:customers!bookings_customer_same_organisation(full_name)
      `)
      .eq('organisation_id', organisationId)
      .gte('start_at', range.start.toISOString())
      .lt('start_at', range.end.toISOString())
      .order('start_at', { ascending: true });

    if (bookingError) {
      setError(bookingError.message);
      setBookings([]);
    } else {
      setBookings((data ?? []) as unknown as Booking[]);
    }

    setLoading(false);
  }, [organisationId, range]);

  const loadFormOptions = useCallback(async () => {
    const [customerResult, teamResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id, full_name, archived_at')
        .eq('organisation_id', organisationId)
        .is('archived_at', null)
        .order('full_name', { ascending: true }),
      supabase.rpc('get_org_team_members', {
        target_org_id: organisationId,
      }),
    ]);

    if (customerResult.error) {
      setError(customerResult.error.message);
    } else {
      setCustomers((customerResult.data ?? []) as CustomerOption[]);
    }

    if (teamResult.error) {
      setError(teamResult.error.message);
    } else {
      setTeamMembers((teamResult.data ?? []) as TeamMember[]);
    }
  }, [organisationId]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    void loadFormOptions();
  }, [loadFormOptions]);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        !term ||
        booking.title.toLowerCase().includes(term) ||
        (booking.customer?.full_name ?? '').toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const openCreateForm = () => {
    const start = new Date(selectedDate);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    setEditingBooking(null);
    setForm({
      ...emptyForm,
      start_at: toLocalInputValue(start),
      end_at: toLocalInputValue(end),
    });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (booking: Booking) => {
    setEditingBooking(booking);
    setForm({
      title: booking.title,
      customer_id: booking.customer_id,
      assigned_user_id: booking.assigned_user_id ?? '',
      start_at: toLocalInputValue(new Date(booking.start_at)),
      end_at: toLocalInputValue(new Date(booking.end_at)),
      status: booking.status,
      notes: booking.notes ?? '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBooking(null);
    setForm(emptyForm);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.customer_id || !form.start_at || !form.end_at) {
      setError('Complete the title, customer and booking times.');
      return;
    }

    const start = new Date(form.start_at);
    const end = new Date(form.end_at);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('The end time must be later than the start time.');
      return;
    }

    setSaving(true);
    setError('');

    const bookingData = {
      title: form.title.trim(),
      customer_id: form.customer_id,
      assigned_user_id: form.assigned_user_id || null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: form.status,
      notes: form.notes.trim() || null,
    };

    if (editingBooking) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', editingBooking.id)
        .eq('organisation_id', organisationId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          organisation_id: organisationId,
          created_by: userId,
        });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    closeForm();
    setSaving(false);
    await loadBookings();
  };

  const updateStatus = async (booking: Booking, status: BookingStatus) => {
    setError('');

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', booking.id)
      .eq('organisation_id', organisationId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadBookings();
  };

  const changeDate = (direction: number) => {
    if (view === 'day') {
      setSelectedDate((current) => addDays(current, direction));
    } else if (view === 'week') {
      setSelectedDate((current) => addDays(current, direction * 7));
    } else {
      setSelectedDate((current) => {
        const next = new Date(current);
        next.setMonth(next.getMonth() + direction);
        return next;
      });
    }
  };

  const rangeLabel =
    view === 'day'
      ? formatDate(selectedDate)
      : view === 'week'
        ? `${formatDate(range.start)} – ${formatDate(addDays(range.end, -1))}`
        : selectedDate.toLocaleDateString('en-ZA', {
            month: 'long',
            year: 'numeric',
          });

  const groupedBookings = useMemo(() => {
    const groups = new Map<string, Booking[]>();

    filteredBookings.forEach((booking) => {
      const date = new Date(booking.start_at);
      const key = date.toDateString();
      const current = groups.get(key) ?? [];
      current.push(booking);
      groups.set(key, current);
    });

    return Array.from(groups.entries()).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
    );
  }, [filteredBookings]);

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-bizora-primary">
            MANAGEMENT
          </p>
          <h1 className="text-3xl font-bold text-white">
            Bookings & Scheduling
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage appointments, customers and team schedules.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          disabled={customers.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-bizora-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={18} />
          New booking
        </button>
      </div>

      {customers.length === 0 && !loading && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Add an active customer in Customers before creating a booking.
        </div>
      )}

      <div className="rounded-xl border border-bizora-border bg-bizora-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              aria-label="Previous period"
              className="rounded-lg border border-bizora-border p-2 text-gray-300 hover:border-bizora-primary hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="rounded-lg border border-bizora-border px-3 py-2 text-sm text-gray-300 hover:border-bizora-primary hover:text-white"
            >
              Today
            </button>

            <button
              onClick={() => changeDate(1)}
              aria-label="Next period"
              className="rounded-lg border border-bizora-border p-2 text-gray-300 hover:border-bizora-primary hover:text-white"
            >
              <ChevronRight size={18} />
            </button>

            <h2 className="ml-2 font-semibold text-white">
              {rangeLabel}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month'] as CalendarView[]).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`rounded-lg px-4 py-2 text-sm capitalize transition ${
                  view === item
                    ? 'bg-bizora-primary text-white'
                    : 'border border-bizora-border text-gray-400 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_190px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bookings or customers..."
              className="w-full rounded-lg border border-bizora-border bg-bizora-background py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-bizora-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-bizora-border bg-bizora-background px-3 py-3 text-sm text-white outline-none focus:border-bizora-primary"
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl border border-bizora-border bg-bizora-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingBooking ? 'Edit booking' : 'Create booking'}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Add the appointment details below.
                </p>
              </div>
              <button
                onClick={closeForm}
                aria-label="Close form"
                className="text-gray-400 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Booking title *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Consultation"
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Customer *
                  </label>
                  <select
                    required
                    value={form.customer_id}
                    onChange={(event) =>
                      setForm({ ...form, customer_id: event.target.value })
                    }
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-3 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Assign team member
                  </label>
                  <select
                    value={form.assigned_user_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        assigned_user_id: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-3 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Start date and time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(event) =>
                      setForm({ ...form, start_at: event.target.value })
                    }
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-3 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    End date and time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(event) =>
                      setForm({ ...form, end_at: event.target.value })
                    }
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-3 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Booking status
                </label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as BookingStatus,
                    })
                  }
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-3 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Optional booking notes"
                  className="w-full resize-y rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-bizora-border px-5 py-3 text-sm text-gray-300 hover:bg-bizora-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-bizora-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingBooking
                      ? 'Save changes'
                      : 'Create booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-12 text-center text-gray-400">
          Loading bookings...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-xl border border-bizora-border bg-bizora-surface px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bizora-elevated text-gray-400">
            <CalendarDays size={26} />
          </div>
          <h2 className="text-lg font-semibold text-white">
            {search || statusFilter !== 'all'
              ? 'No matching bookings'
              : 'No bookings in this period'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-400">
            {search || statusFilter !== 'all'
              ? 'Try changing your search or status filter.'
              : 'Bookings created for this period will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedBookings.map(([dateKey, dayBookings]) => (
            <div
              key={dateKey}
              className="overflow-hidden rounded-xl border border-bizora-border bg-bizora-surface"
            >
              <div className="flex items-center justify-between border-b border-bizora-border px-5 py-4">
                <h2 className="font-semibold text-white">
                  {new Date(dateKey).toLocaleDateString('en-ZA', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h2>
                <span className="text-xs text-gray-400">
                  {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>

              <div className="divide-y divide-bizora-border">
                {dayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-bizora-elevated/30 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-bizora-primary/10 text-bizora-primary">
                        <Clock size={17} />
                        <span className="mt-1 text-[10px] font-semibold">
                          {formatTime(booking.start_at)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">
                          {booking.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                          <UserRound size={14} />
                          {booking.customer?.full_name ?? 'Customer record unavailable'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatTime(booking.start_at)} – {formatTime(booking.end_at)}
                        </p>
                        {booking.notes && (
                          <p className="mt-2 text-xs text-gray-500">
                            {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyles[booking.status]}`}
                      >
                        {statusLabels[booking.status]}
                      </span>

                      <select
                        aria-label={`Update status for ${booking.title}`}
                        value={booking.status}
                        onChange={(event) =>
                          void updateStatus(
                            booking,
                            event.target.value as BookingStatus,
                          )
                        }
                        className="rounded-lg border border-bizora-border bg-bizora-background px-2 py-2 text-xs text-gray-300 outline-none focus:border-bizora-primary"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => openEditForm(booking)}
                        aria-label={`Edit ${booking.title}`}
                        className="rounded-lg border border-bizora-border p-2 text-gray-400 hover:border-bizora-primary hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Users size={14} />
        Showing bookings belonging to this organisation.
      </div>
    </section>
  );
}

export default Bookings;
