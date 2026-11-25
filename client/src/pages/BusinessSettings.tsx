
import { useEffect, useState } from 'react';
import {
  Building2,
  Save,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Coins,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

type BusinessSettingsProps = {
  organisationId: string;
  userRole: string;
};

type SettingsForm = {
  name: string;
  description: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  currency: string;
  timezone: string;
  date_format: string;
  logo_url: string;
};

const initialForm: SettingsForm = {
  name: '',
  description: '',
  industry: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  currency: 'ZAR',
  timezone: 'Africa/Johannesburg',
  date_format: 'DD/MM/YYYY',
  logo_url: '',
};

const timezones = [
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Africa/Nairobi',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function BusinessSettings({
  organisationId,
  userRole,
}: BusinessSettingsProps) {
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canEdit = userRole === 'owner' || userRole === 'admin';

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const { data, error: loadError } = await supabase
      .from('organisations')
      .select(
        'name, description, industry, email, phone, address, website, currency, timezone, date_format, logo_url'
      )
      .eq('id', organisationId)
      .single();

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    setForm({
      name: data.name ?? '',
      description: data.description ?? '',
      industry: data.industry ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      website: data.website ?? '',
      currency: data.currency ?? 'ZAR',
      timezone: data.timezone ?? 'Africa/Johannesburg',
      date_format: data.date_format ?? 'DD/MM/YYYY',
      logo_url: data.logo_url ?? '',
    });

    setLoading(false);
  };

  useEffect(() => {
    void loadSettings();
  }, [organisationId]);

  const handleChange = (
    field: keyof SettingsForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSuccess('');
    setError('');
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!canEdit) return;

    const businessName = form.name.trim();

    if (!businessName) {
      setError('Business name is required.');
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError('Please enter a valid business email address.');
      return;
    }

    if (form.website.trim()) {
      try {
        new URL(
          form.website.startsWith('http')
            ? form.website
            : `https://${form.website}`
        );
      } catch {
        setError('Please enter a valid website address.');
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const { error: saveError } = await supabase
      .from('organisations')
      .update({
        name: businessName,
        description: form.description.trim() || null,
        industry: form.industry.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        website: form.website.trim() || null,
        currency: form.currency,
        timezone: form.timezone,
        date_format: form.date_format,
        logo_url: form.logo_url.trim() || null,
      })
      .eq('id', organisationId);

    if (saveError) {
      setError(saveError.message);
    } else {
      setSuccess('Business settings saved successfully!');
      await loadSettings();
    }

    setSaving(false);
  };

  const inputClass =
    'w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-bizora-primary';

  const labelClass =
    'mb-2 block text-sm font-medium text-gray-300';

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <p className="text-sm text-gray-400">
          Loading business settings...
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-bizora-primary">
            BUSINESS MANAGEMENT
          </p>
          <h1 className="text-3xl font-bold text-white">
            Business Settings
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage your business profile and workspace preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSettings()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-bizora-border bg-bizora-surface px-4 py-2.5 text-sm text-gray-300 hover:border-bizora-primary"
        >
          <RefreshCw size={16} />
          Refresh
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

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300"
        >
          {success}
        </div>
      )}

      {!canEdit && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          You can view these settings, but only owners and admins
          can make changes.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5 md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="text-bizora-primary" size={21} />
            <div>
              <h2 className="font-semibold text-white">
                Business profile
              </h2>
              <p className="text-xs text-gray-500">
                Basic information about your business.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Business name *</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!canEdit}
                required
                maxLength={100}
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className={labelClass}>Industry</label>
              <select
                className={inputClass}
                value={form.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                disabled={!canEdit}
              >
                <option value="">Select an industry</option>
                <option value="Retail">Retail</option>
                <option value="Beauty & Wellness">Beauty & Wellness</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Education">Education</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Construction">Construction</option>
                <option value="Technology">Technology</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Business description</label>
              <textarea
                className={inputClass}
                rows={4}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!canEdit}
                maxLength={1000}
                placeholder="Tell us about your business..."
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Logo URL</label>
              <input
                className={inputClass}
                type="url"
                value={form.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                disabled={!canEdit}
                placeholder="https://example.com/logo.png"
              />
              <p className="mt-2 text-xs text-gray-500">
                This stores a logo URL. Image uploads will be added
                through secure storage later.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5 md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <Mail className="text-bizora-primary" size={21} />
            <div>
              <h2 className="font-semibold text-white">
                Contact information
              </h2>
              <p className="text-xs text-gray-500">
                How customers can reach your business.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Business email</label>
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!canEdit}
                placeholder="hello@business.co.za"
              />
            </div>

            <div>
              <label className={labelClass}>Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input
                  className={`${inputClass} pl-10`}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!canEdit}
                  placeholder="+27 00 000 0000"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Physical address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input
                  className={`${inputClass} pl-10`}
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Street, suburb, city and postal code"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input
                  className={`${inputClass} pl-10`}
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  disabled={!canEdit}
                  placeholder="www.yourbusiness.co.za"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5 md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <Coins className="text-bizora-primary" size={21} />
            <div>
              <h2 className="font-semibold text-white">
                Regional preferences
              </h2>
              <p className="text-xs text-gray-500">
                Set the currency and regional display preferences.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Business currency</label>
              <select
                className={inputClass}
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                disabled={!canEdit}
              >
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="EUR">EUR - Euro</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="NGN">NGN - Nigerian Naira</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Timezone</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <select
                  className={`${inputClass} pl-10`}
                  value={form.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  disabled={!canEdit}
                >
                  {timezones.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Date format</label>
              <select
                className={inputClass}
                value={form.date_format}
                onChange={(e) => handleChange('date_format', e.target.value)}
                disabled={!canEdit}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canEdit || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-bizora-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? 'Saving changes...' : 'Save business settings'}
          </button>
        </div>
      </form>
    </section>
  );
}
