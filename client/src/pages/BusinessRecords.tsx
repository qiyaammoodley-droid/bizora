import { useEffect, useMemo, useState } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  FileText,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type BusinessRecord = {
  id: string;
  organisation_id: string;
  title: string;
  category: string;
  description: string | null;
  record_date: string;
  reference_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type Props = {
  organisationId: string;
  userId: string;
  userRole: string;
};

type RecordForm = {
  title: string;
  category: string;
  description: string;
  record_date: string;
  reference_url: string;
};

const emptyForm: RecordForm = {
  title: '',
  category: 'General',
  description: '',
  record_date: new Date().toISOString().slice(0, 10),
  reference_url: '',
};

const categories = [
  'General',
  'Contracts',
  'Legal',
  'Financial',
  'Operations',
  'Suppliers',
  'Employees',
  'Documents',
];

export default function BusinessRecords({
  organisationId,
  userId,
  userRole,
}: Props) {
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecordForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = userRole === 'owner' || userRole === 'admin';

  async function loadRecords() {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('business_records')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('record_date', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setRecords([]);
    } else {
      setRecords((data ?? []) as BusinessRecord[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRecords();
  }, [organisationId]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        record.title.toLowerCase().includes(search.toLowerCase()) ||
        (record.description ?? '').toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'All' || record.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [records, search, categoryFilter]);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function openEditForm(record: BusinessRecord) {
    setForm({
      title: record.title,
      category: record.category,
      description: record.description ?? '',
      record_date: record.record_date,
      reference_url: record.reference_url ?? '',
    });

    setEditingId(record.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter a record title.');
      return;
    }

    if (form.reference_url.trim()) {
      try {
        const url = new URL(form.reference_url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        setError('Please enter a valid link beginning with https:// or http://');
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim() || null,
      record_date: form.record_date,
      reference_url: form.reference_url.trim() || null,
    };

    const result = editingId
      ? await supabase
          .from('business_records')
          .update(payload)
          .eq('id', editingId)
          .eq('organisation_id', organisationId)
      : await supabase.from('business_records').insert({
          ...payload,
          organisation_id: organisationId,
          created_by: userId,
        });

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    closeForm();
    setSuccess(editingId ? 'Record updated successfully.' : 'Record created successfully.');
    setSaving(false);
    await loadRecords();
  }

  async function deleteRecord(record: BusinessRecord) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${record.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    const { error: deleteError } = await supabase
      .from('business_records')
      .delete()
      .eq('id', record.id)
      .eq('organisation_id', organisationId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setSuccess('Record deleted successfully.');
  }

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-bizora-primary">
            <FolderOpen size={23} />
            <h1 className="text-2xl font-semibold text-white">
              Business Records
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Keep important business documents, records and references organised.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-lg bg-bizora-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={18} />
          Add record
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <FolderOpen className="mb-3 text-bizora-primary" size={22} />
          <p className="text-sm text-gray-400">Total records</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {records.length}
          </p>
        </div>

        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <FileText className="mb-3 text-bizora-primary" size={22} />
          <p className="text-sm text-gray-400">Categories used</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {new Set(records.map((record) => record.category)).size}
          </p>
        </div>

        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <CalendarDays className="mb-3 text-bizora-primary" size={22} />
          <p className="text-sm text-gray-400">Records this month</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {records.filter((record) => {
              const date = new Date(`${record.record_date}T00:00:00`);
              const now = new Date();
              return (
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
              );
            }).length}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records..."
              className="w-full rounded-lg border border-bizora-border bg-bizora-background py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-bizora-primary"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-bizora-border bg-bizora-background px-4 py-2.5 text-sm text-white outline-none focus:border-bizora-primary"
          >
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            onClick={loadRecords}
            className="flex items-center justify-center gap-2 rounded-lg border border-bizora-border px-4 py-2.5 text-sm text-gray-300 hover:bg-bizora-background"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <RefreshCw size={18} className="animate-spin" />
            Loading business records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center">
            <FolderOpen size={38} className="mx-auto mb-4 text-gray-500" />
            <h3 className="font-medium text-white">
              {records.length === 0 ? 'No records yet' : 'No matching records'}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {records.length === 0
                ? 'Start organising your business information by adding your first record.'
                : 'Try changing your search or category filter.'}
            </p>
            {records.length === 0 && (
              <button
                onClick={openCreateForm}
                className="mt-5 rounded-lg bg-bizora-primary px-4 py-2 text-sm font-medium text-white"
              >
                Create your first record
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <article
                key={record.id}
                className="flex flex-col gap-4 rounded-xl border border-bizora-border p-4 transition hover:border-bizora-primary/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="h-fit rounded-lg bg-bizora-background p-3">
                    <FileText size={21} className="text-bizora-primary" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words font-medium text-white">
                      {record.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {record.description || 'No description provided.'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="rounded-md bg-bizora-background px-2 py-1">
                        {record.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />
                        {formatDate(record.record_date)}
                      </span>

                      {record.reference_url && (
                        <a
                          href={record.reference_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-bizora-primary hover:underline"
                        >
                          Open reference
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openEditForm(record)}
                      title="Edit record"
                      className="rounded-lg border border-bizora-border p-2 text-gray-400 hover:bg-bizora-background hover:text-white"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => deleteRecord(record)}
                      title="Delete record"
                      className="rounded-lg border border-bizora-border p-2 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl border border-bizora-border bg-bizora-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingId ? 'Edit business record' : 'Add business record'}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Enter the details of your business record.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-400 hover:bg-bizora-background hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Record title *
                </label>
                <input
                  required
                  maxLength={150}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Supplier agreement"
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Record date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.record_date}
                    onChange={(event) =>
                      setForm({ ...form, record_date: event.target.value })
                    }
                    className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Description
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Add useful information about this record..."
                  className="w-full resize-y rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Reference link (optional)
                </label>
                <input
                  type="url"
                  value={form.reference_url}
                  onChange={(event) =>
                    setForm({ ...form, reference_url: event.target.value })
                  }
                  placeholder="https://example.com/document"
                  className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-bizora-border px-5 py-2.5 text-sm text-gray-300 hover:bg-bizora-background"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-lg bg-bizora-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving && <RefreshCw size={15} className="animate-spin" />}
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save changes'
                      : 'Create record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
