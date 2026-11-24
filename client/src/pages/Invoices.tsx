
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Search,
  FileText,
  X,
  Trash2,
  RefreshCw,
  Eye,
  Send,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Customer = {
  id: string;
  full_name: string;
  archived_at: string | null;
};

type Invoice = {
  id: string;
  organisation_id: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'cancelled';
  currency: string;
  notes: string | null;
  created_at: string;
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
};

type InvoiceDisplay = Invoice & {
  customerName: string;
  total: number;
  paid: number;
  balance: number;
  paymentStatus: string;
};

type InvoiceLine = {
  description: string;
  quantity: string;
  unit_price: string;
};

type InvoicesProps = {
  organisationId: string;
  userId: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyLine: InvoiceLine = {
  description: '',
  quantity: '1',
  unit_price: '',
};

function formatCurrency(amount: number, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Invoices({ organisationId, userId }: InvoicesProps) {
  const [invoices, setInvoices] = useState<InvoiceDisplay[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceDisplay | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([
    { ...emptyLine },
  ]);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');

    const [
      { data: invoiceData, error: invoiceError },
      { data: customerData, error: customerError },
    ] = await Promise.all([
      supabase
        .from('invoices')
        .select('*')
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false }),

      supabase
        .from('customers')
        .select('id, full_name, archived_at')
        .eq('organisation_id', organisationId),
    ]);

    if (invoiceError || customerError) {
      setError(
        invoiceError?.message ??
          customerError?.message ??
          'Could not load invoice information.',
      );
      setInvoices([]);
      setCustomers([]);
      setLoading(false);
      return;
    }

    const loadedInvoices = (invoiceData ?? []) as Invoice[];
    const loadedCustomers = (customerData ?? []) as Customer[];

    setCustomers(loadedCustomers);

    if (loadedInvoices.length === 0) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    const invoiceIds = loadedInvoices.map((invoice) => invoice.id);

    const [
      { data: itemData, error: itemError },
      { data: paymentData, error: paymentError },
    ] = await Promise.all([
      supabase
        .from('invoice_items')
        .select('id, invoice_id, description, quantity, unit_price, line_total')
        .eq('organisation_id', organisationId)
        .in('invoice_id', invoiceIds),

      supabase
        .from('payments')
        .select('id, invoice_id, amount')
        .eq('organisation_id', organisationId)
        .in('invoice_id', invoiceIds),
    ]);

    if (itemError || paymentError) {
      setError(
        itemError?.message ??
          paymentError?.message ??
          'Could not calculate invoice balances.',
      );
      setInvoices([]);
      setLoading(false);
      return;
    }

    const items = (itemData ?? []) as InvoiceItem[];
    const payments = (paymentData ?? []) as Payment[];

    const result: InvoiceDisplay[] = loadedInvoices.map((invoice) => {
      const customer = loadedCustomers.find(
        (entry) => entry.id === invoice.customer_id,
      );

      const total = items
        .filter((item) => item.invoice_id === invoice.id)
        .reduce((sum, item) => sum + Number(item.line_total), 0);

      const paid = payments
        .filter((payment) => payment.invoice_id === invoice.id)
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

      const balance = Math.max(total - paid, 0);

      // Payment status is calculated from real invoice and payment data.
      let paymentStatus: string = invoice.status;

      if (invoice.status === 'sent') {
        if (total > 0 && balance <= 0) {
          paymentStatus = 'paid';
        } else if (paid > 0) {
          paymentStatus = 'partially paid';
        } else if (invoice.due_date < today) {
          paymentStatus = 'overdue';
        } else {
          paymentStatus = 'awaiting payment';
        }
      }

      return {
        ...invoice,
        customerName: customer?.full_name ?? 'Customer unavailable',
        total,
        paid,
        balance,
        paymentStatus,
      };
    });

    setInvoices(result);
    setLoading(false);
  }, [organisationId]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !term ||
        invoice.invoice_number.toLowerCase().includes(term) ||
        invoice.customerName.toLowerCase().includes(term);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'draft' && invoice.status === 'draft') ||
        (filter === 'sent' && invoice.paymentStatus === 'awaiting payment') ||
        (filter === 'paid' && invoice.paymentStatus === 'paid') ||
        (filter === 'partial' && invoice.paymentStatus === 'partially paid') ||
        (filter === 'overdue' && invoice.paymentStatus === 'overdue');

      return matchesSearch && matchesFilter;
    });
  }, [invoices, search, filter]);

  const totals = useMemo(() => {
    const active = invoices.filter(
      (invoice) => invoice.status !== 'cancelled',
    );

    return {
      invoiced: active.reduce((sum, invoice) => sum + invoice.total, 0),
      paid: active.reduce((sum, invoice) => sum + invoice.paid, 0),
      outstanding: active.reduce(
        (sum, invoice) => sum + invoice.balance,
        0,
      ),
      overdue: active
        .filter((invoice) => invoice.paymentStatus === 'overdue')
        .reduce((sum, invoice) => sum + invoice.balance, 0),
    };
  }, [invoices]);

  const createInvoiceNumber = () => {
    const datePart = today.replaceAll('-', '');
    const uniquePart = crypto.randomUUID().slice(0, 6).toUpperCase();

    return `INV-${datePart}-${uniquePart}`;
  };

  const openCreateForm = () => {
    setCustomerId('');
    setIssueDate(today);
    setDueDate(today);
    setNotes('');
    setLines([{ ...emptyLine }]);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const updateLine = (
    index: number,
    field: keyof InvoiceLine,
    value: string,
  ) => {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  };

  const formTotal = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity);
    const price = Number(line.unit_price);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(price) ||
      quantity <= 0 ||
      price < 0
    ) {
      return sum;
    }

    return sum + quantity * price;
  }, 0);

  const handleCreateInvoice = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (dueDate < issueDate) {
      setError('The due date cannot be before the issue date.');
      return;
    }

    const validLines = lines.map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
    }));

    const invalidLine = validLines.some(
      (line) =>
        !line.description ||
        !Number.isFinite(line.quantity) ||
        !Number.isFinite(line.unit_price) ||
        line.quantity <= 0 ||
        line.unit_price < 0,
    );

    if (invalidLine) {
      setError('Please complete every invoice item correctly.');
      return;
    }

    setSaving(true);

    const invoiceNumber = createInvoiceNumber();

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organisation_id: organisationId,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        status: 'draft',
        currency: 'ZAR',
        notes: notes.trim() || null,
        created_by: userId,
      })
      .select('id')
      .single();

    if (invoiceError || !invoice) {
      setError(invoiceError?.message ?? 'Could not create invoice.');
      setSaving(false);
      return;
    }

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(
        validLines.map((line) => ({
          organisation_id: organisationId,
          invoice_id: invoice.id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
        })),
      );

    if (itemsError) {
      setError(
        `Invoice header saved, but its items could not be saved. Please contact support with invoice ID ${invoice.id}. ${itemsError.message}`,
      );
      setSaving(false);
      await loadInvoices();
      return;
    }

    setShowForm(false);
    setSaving(false);
    setSuccess(`Invoice ${invoiceNumber} created successfully.`);
    await loadInvoices();
  };

  const handleMarkAsSent = async (invoice: InvoiceDisplay) => {
    if (invoice.status !== 'draft') return;

    if (invoice.total <= 0) {
      setError('Add at least one billable item before sending.');
      return;
    }

    const confirmed = window.confirm(
      `Mark ${invoice.invoice_number} as sent?`,
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoice.id)
      .eq('organisation_id', organisationId)
      .eq('status', 'draft');

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(`${invoice.invoice_number} marked as sent.`);
    await loadInvoices();
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'overdue':
        return 'bg-red-500/10 text-red-400';
      case 'partially paid':
        return 'bg-amber-500/10 text-amber-400';
      case 'awaiting payment':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const activeCustomers = customers.filter(
    (customer) => !customer.archived_at,
  );

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-bizora-primary">
            FINANCIAL MANAGEMENT
          </p>
          <h1 className="text-3xl font-bold text-white">
            Payments & Invoices
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage invoices and monitor customer payments.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void loadInvoices()}
            className="flex items-center gap-2 rounded-lg border border-bizora-border bg-bizora-surface px-4 py-3 text-sm text-gray-300 hover:border-bizora-primary"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-lg bg-bizora-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={18} />
            Create invoice
          </button>
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

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total invoiced', value: totals.invoiced, color: 'text-white' },
          { label: 'Payments received', value: totals.paid, color: 'text-emerald-400' },
          { label: 'Outstanding balance', value: totals.outstanding, color: 'text-white' },
          { label: 'Overdue balance', value: totals.overdue, color: 'text-red-400' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-bizora-border bg-bizora-surface p-5"
          >
            <p className="text-sm text-gray-400">{card.label}</p>
            <p className={`mt-3 text-2xl font-bold ${card.color}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
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
            placeholder="Search invoice or customer..."
            className="w-full rounded-lg border border-bizora-border bg-bizora-surface py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-bizora-primary"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-lg border border-bizora-border bg-bizora-surface px-4 py-3 text-sm text-gray-300 outline-none"
        >
          <option value="all">All invoices</option>
          <option value="draft">Draft</option>
          <option value="sent">Awaiting payment</option>
          <option value="partial">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-bizora-border bg-bizora-surface">
        <div className="flex items-center justify-between border-b border-bizora-border px-5 py-4">
          <h2 className="font-semibold text-white">Invoice register</h2>
          <span className="text-xs text-gray-400">
            {filteredInvoices.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bizora-elevated text-gray-400">
              <FileText size={26} />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {search || filter !== 'all' ? 'No matching invoices' : 'No invoices yet'}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-400">
              {search || filter !== 'all'
                ? 'Try another search or filter.'
                : 'Create your first invoice to start tracking customer billing.'}
            </p>
            {!search && filter === 'all' && (
              <button
                onClick={openCreateForm}
                className="mt-5 rounded-lg bg-bizora-primary px-5 py-3 text-sm font-semibold text-white"
              >
                Create your first invoice
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-bizora-border">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-4 px-5 py-5 hover:bg-bizora-elevated/30 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-white">
                      {invoice.invoice_number}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusStyle(invoice.paymentStatus)}`}
                    >
                      {invoice.paymentStatus}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    {invoice.customerName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Issued {formatDate(invoice.issue_date)} · Due{' '}
                    {formatDate(invoice.due_date)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 lg:w-[390px]">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-400">
                      {formatCurrency(invoice.paid, invoice.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCurrency(invoice.balance, invoice.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="flex items-center gap-2 rounded-lg border border-bizora-border px-3 py-2 text-xs text-gray-300 hover:border-bizora-primary"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  {invoice.status === 'draft' && (
                    <button
                      onClick={() => void handleMarkAsSent(invoice)}
                      className="flex items-center gap-2 rounded-lg border border-bizora-primary/40 px-3 py-2 text-xs text-bizora-primary hover:bg-bizora-primary/10"
                    >
                      <Send size={15} />
                      Mark as sent
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
          <div className="my-auto max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-bizora-border bg-bizora-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Create invoice
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Select a customer and add invoice items.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="text-gray-400 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Customer *
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select a customer</option>
                  {activeCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </option>
                  ))}
                </select>

                {activeCustomers.length === 0 && (
                  <p className="mt-2 text-xs text-amber-400">
                    Add an active customer before creating an invoice.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Issue date *
                  </label>
                  <input
                    required
                    type="date"
                    value={issueDate}
                    onChange={(event) => setIssueDate(event.target.value)}
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Due date *
                  </label>
                  <input
                    required
                    type="date"
                    min={issueDate}
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Invoice items</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((current) => [...current, { ...emptyLine }])
                    }
                    className="flex items-center gap-2 text-xs font-semibold text-bizora-primary"
                  >
                    <Plus size={15} />
                    Add item
                  </button>
                </div>

                <div className="space-y-3">
                  {lines.map((line, index) => {
                    const lineTotal =
                      Number(line.quantity) * Number(line.unit_price);

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-bizora-border bg-bizora-background p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-400">
                            ITEM {index + 1}
                          </span>
                          <button
                            type="button"
                            disabled={lines.length === 1}
                            onClick={() =>
                              setLines((current) =>
                                current.filter((_, i) => i !== index),
                              )
                            }
                            aria-label={`Remove item ${index + 1}`}
                            className="text-gray-500 hover:text-red-400 disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <label className="mb-2 block text-xs text-gray-400">
                          Description *
                        </label>
                        <input
                          required
                          value={line.description}
                          onChange={(event) =>
                            updateLine(index, 'description', event.target.value)
                          }
                          placeholder="Describe the service or product"
                          className="w-full rounded-lg border border-bizora-border bg-bizora-surface px-3 py-3 text-sm text-white outline-none"
                        />

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-2 block text-xs text-gray-400">
                              Quantity *
                            </label>
                            <input
                              required
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(index, 'quantity', event.target.value)
                              }
                              className="w-full rounded-lg border border-bizora-border bg-bizora-surface px-3 py-3 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs text-gray-400">
                              Unit price (R) *
                            </label>
                            <input
                              required
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unit_price}
                              onChange={(event) =>
                                updateLine(index, 'unit_price', event.target.value)
                              }
                              className="w-full rounded-lg border border-bizora-border bg-bizora-surface px-3 py-3 text-sm text-white"
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex justify-between border-t border-bizora-border pt-3">
                          <span className="text-xs text-gray-400">
                            Line total
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(
                              Number.isFinite(lineTotal) ? lineTotal : 0,
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional invoice notes or payment instructions"
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white"
                />
              </div>

              <div className="rounded-xl border border-bizora-primary/30 bg-bizora-primary/10 p-5">
                <p className="text-sm text-gray-300">Invoice total</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {formatCurrency(formTotal)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  The invoice will initially be saved as a draft.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-bizora-border px-5 py-3 text-sm text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || activeCustomers.length === 0}
                  className="rounded-lg bg-bizora-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Creating invoice...' : 'Save draft invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl border border-bizora-border bg-bizora-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-bizora-primary">
                  INVOICE DETAILS
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  {selectedInvoice.invoice_number}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {selectedInvoice.customerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close invoice details"
                className="text-gray-400 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-bizora-border bg-bizora-background p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Issue date</span>
                <span className="text-white">
                  {formatDate(selectedInvoice.issue_date)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Due date</span>
                <span className="text-white">
                  {formatDate(selectedInvoice.due_date)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="capitalize text-white">
                  {selectedInvoice.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between border-t border-bizora-border pt-3 text-sm">
                <span className="text-gray-400">Invoice total</span>
                <span className="font-semibold text-white">
                  {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Paid</span>
                <span className="font-semibold text-emerald-400">
                  {formatCurrency(selectedInvoice.paid, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Outstanding</span>
                <span className="font-semibold text-white">
                  {formatCurrency(selectedInvoice.balance, selectedInvoice.currency)}
                </span>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="mt-4">
                <p className="text-xs text-gray-400">Notes</p>
                <p className="mt-1 text-sm text-gray-300">
                  {selectedInvoice.notes}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedInvoice(null)}
              className="mt-5 w-full rounded-lg border border-bizora-border px-5 py-3 text-sm text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Invoices;