
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { FormEvent } from 'react';

import {
  Archive,
  ArrowLeft,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

type Customer = {
  id: string;
  organisation_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  archived_at: string | null;
};

type CustomersProps = {
  organisationId: string;
  userId: string;
};

type CustomerForm = {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  full_name: '',
  email: '',
  phone: '',
  notes: '',
};

function Customers({ organisationId, userId }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    let query = supabase
      .from('customers')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false });

    if (showArchived) {
      query = query.not('archived_at', 'is', null);
    } else {
      query = query.is('archived_at', null);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setCustomers([]);
    } else {
      setCustomers((data ?? []) as Customer[]);
    }

    setLoading(false);
  }, [organisationId, showArchived]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.full_name,
        customer.email ?? '',
        customer.phone ?? '',
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }, [customers, search]);

  const openCreateForm = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);

    setForm({
      full_name: customer.full_name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      notes: customer.notes ?? '',
    });

    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.full_name.trim()) {
      setError('Please enter the customer name.');
      return;
    }

    setSaving(true);
    setError('');

    const customerData = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editingCustomer) {
      const { error: updateError } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', editingCustomer.id)
        .eq('organisation_id', organisationId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          ...customerData,
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

    await loadCustomers();
  };

  const handleArchive = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Archive ${customer.full_name}? Their existing bookings will be preserved.`,
    );

    if (!confirmed) {
      return;
    }

    setError('');

    const { error: archiveError } = await supabase
      .from('customers')
      .update({
        archived_at: new Date().toISOString(),
      })
      .eq('id', customer.id)
      .eq('organisation_id', organisationId);

    if (archiveError) {
      setError(archiveError.message);
      return;
    }

    await loadCustomers();
  };

  const handleRestore = async (customer: Customer) => {
    setError('');

    const { error: restoreError } = await supabase
      .from('customers')
      .update({
        archived_at: null,
      })
      .eq('id', customer.id)
      .eq('organisation_id', organisationId);

    if (restoreError) {
      setError(restoreError.message);
      return;
    }

    await loadCustomers();
  };

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-bizora-primary">
            MANAGEMENT
          </p>

          <h1 className="text-3xl font-bold text-white">
            Customers
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Manage your business customer records.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          disabled={showArchived}
          className="flex items-center justify-center gap-2 rounded-lg bg-bizora-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={18} />
          Add customer
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full rounded-lg border border-bizora-border bg-bizora-surface py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-bizora-primary"
          />
        </div>

        <button
          onClick={() => {
            setShowArchived((current) => !current);
            setSearch('');
          }}
          className="flex items-center justify-center gap-2 rounded-lg border border-bizora-border bg-bizora-surface px-4 py-3 text-sm text-gray-300 transition hover:border-bizora-primary"
        >
          {showArchived ? (
            <ArrowLeft size={17} />
          ) : (
            <Archive size={17} />
          )}

          {showArchived ? 'Active customers' : 'Archived customers'}
        </button>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl border border-bizora-border bg-bizora-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingCustomer
                    ? 'Edit customer'
                    : 'Add customer'}
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Enter the customer's details below.
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
                  Full name *
                </label>

                <input
                  required
                  value={form.full_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      full_name: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Email address
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Phone number
                </label>

                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Notes
                </label>

                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes: event.target.value,
                    })
                  }
                  className="w-full resize-y rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  placeholder="Optional customer notes"
                />
              </div>

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
                    : editingCustomer
                      ? 'Save changes'
                      : 'Create customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-12 text-center text-gray-400">
          Loading customers...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-xl border border-bizora-border bg-bizora-surface px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bizora-elevated text-gray-400">
            <Users size={26} />
          </div>

          <h2 className="text-lg font-semibold text-white">
            {search
              ? 'No matching customers'
              : showArchived
                ? 'No archived customers'
                : 'No customers yet'}
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-400">
            {search
              ? 'Try another name, email address or phone number.'
              : showArchived
                ? 'Customers you archive will appear here.'
                : 'Add your first customer to start building your business records.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-bizora-border bg-bizora-surface">
          <div className="flex items-center justify-between border-b border-bizora-border px-5 py-4">
            <h2 className="font-semibold text-white">
              {showArchived
                ? 'Archived customers'
                : 'Customer directory'}
            </h2>

            <span className="text-xs text-gray-400">
              {filteredCustomers.length}{' '}
              {filteredCustomers.length === 1
                ? 'record'
                : 'records'}
            </span>
          </div>

          <div className="divide-y divide-bizora-border">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-col gap-4 px-5 py-5 transition hover:bg-bizora-elevated/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bizora-primary/15 text-sm font-bold text-bizora-primary">
                    {customer.full_name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">
                      {customer.full_name}
                    </h3>

                    <p className="mt-1 truncate text-sm text-gray-400">
                      {customer.email || 'No email provided'}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {customer.phone || 'No phone number provided'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {showArchived ? (
                    <button
                      onClick={() => void handleRestore(customer)}
                      className="flex items-center gap-2 rounded-lg border border-bizora-border px-3 py-2 text-xs text-gray-300 hover:border-bizora-primary hover:text-white"
                    >
                      <RotateCcw size={15} />
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditForm(customer)}
                        aria-label={`Edit ${customer.full_name}`}
                        className="rounded-lg border border-bizora-border p-2 text-gray-400 hover:border-bizora-primary hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => void handleArchive(customer)}
                        aria-label={`Archive ${customer.full_name}`}
                        className="rounded-lg border border-bizora-border p-2 text-gray-400 hover:border-red-400 hover:text-red-300"
                      >
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Customers;
