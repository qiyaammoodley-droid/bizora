
import { useState, type FormEvent } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type WorkspaceSetupProps = {
  initialBusinessName: string;
  onWorkspaceCreated: (name: string) => void;
};

function WorkspaceSetup({
  initialBusinessName,
  onWorkspaceCreated,
}: WorkspaceSetupProps) {
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Please enter your business name.');
      return;
    }

    setLoading(true);

    try {
      const { error: organisationError } = await supabase.rpc(
        'create_organisation',
        {
          organisation_name: businessName.trim(),
        }
      );

      if (organisationError) throw organisationError;

      onWorkspaceCreated(businessName.trim());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not create your workspace. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bizora-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-bizora-surface border border-bizora-border rounded-2xl p-8 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-bizora-primary flex items-center justify-center mb-6">
          <Building2 size={28} className="text-white" />
        </div>

        <p className="text-bizora-primary text-sm font-semibold mb-2">
          FIRST-TIME SETUP
        </p>

        <h1 className="text-3xl font-bold text-white">
          Set up your workspace
        </h1>

        <p className="text-gray-400 mt-3 mb-8">
          Let's get your business set up on Bizora. You can invite your team
          and configure your business later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Business name
            </label>

            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              required
              className="w-full bg-bizora-background border border-bizora-border rounded-lg py-3 px-4 text-white outline-none focus:border-bizora-primary"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-bizora-primary hover:bg-[#7666ed] disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Creating workspace...' : 'Create workspace'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default WorkspaceSetup;
