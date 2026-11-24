
import { useEffect, useState } from 'react';
import { LogOut, Building2, LayoutDashboard } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import AuthPage from './components/AuthPage';
import WorkspaceSetup from './components/WorkspaceSetup';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Could not retrieve session:', error.message);
      }

      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadWorkspace = async () => {
      if (!session) {
        setHasWorkspace(false);
        setWorkspaceName('');
        setWorkspaceLoading(false);
        setWorkspaceError('');
        return;
      }

      setWorkspaceLoading(true);
      setWorkspaceError('');

      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('organisation_id, role')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (membershipError) {
        console.error('Could not load membership:', membershipError.message);
        setWorkspaceError(membershipError.message);
        setHasWorkspace(false);
        setWorkspaceLoading(false);
        return;
      }

      if (!membership) {
        setHasWorkspace(false);
        setWorkspaceName('');
        setWorkspaceLoading(false);
        return;
      }

      const { data: organisation, error: organisationError } = await supabase
        .from('organisations')
        .select('name')
        .eq('id', membership.organisation_id)
        .single();

      if (!mounted) return;

      if (organisationError) {
        console.error('Could not load organisation:', organisationError.message);
        setWorkspaceError(organisationError.message);
        setHasWorkspace(false);
        setWorkspaceLoading(false);
        return;
      }

      setWorkspaceName(organisation.name);
      setHasWorkspace(true);
      setWorkspaceLoading(false);
    };

    loadWorkspace();

    return () => {
      mounted = false;
    };
  }, [session]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bizora-background flex items-center justify-center">
        <p className="text-bizora-primary font-medium">Loading Bizora...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-bizora-background flex items-center justify-center">
        <p className="text-bizora-primary font-medium">
          Loading your workspace...
        </p>
      </div>
    );
  }

  if (workspaceError) {
    return (
      <div className="min-h-screen bg-bizora-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-red-400 mb-4">
          We couldn't load your business workspace.
        </p>
        <p className="text-gray-400 text-sm mb-6">{workspaceError}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-bizora-primary text-white px-5 py-2 rounded-lg"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!hasWorkspace) {
    const initialBusinessName =
      typeof session.user.user_metadata?.business_name === 'string'
        ? session.user.user_metadata.business_name
        : '';

    return (
      <WorkspaceSetup
        initialBusinessName={initialBusinessName}
        onWorkspaceCreated={(name) => {
          setWorkspaceName(name);
          setHasWorkspace(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bizora-background text-white">
      <header className="h-20 border-b border-bizora-border bg-bizora-sidebar px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-bizora-primary p-2 rounded-lg">
            <Building2 size={22} />
          </div>

          <span className="text-xl font-bold">Bizora</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-bizora-primary text-sm font-medium mb-2">
            BUSINESS WORKSPACE
          </p>

          <h1 className="text-3xl font-bold">
            Welcome to {workspaceName}
          </h1>

          <p className="text-gray-400 mt-2">
            Your Bizora workspace is ready.
          </p>
        </div>

        <div className="bg-bizora-surface border border-bizora-border rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-bizora-elevated p-3 rounded-lg">
              <LayoutDashboard size={22} className="text-bizora-primary" />
            </div>

            <div>
              <h2 className="font-semibold">Account overview</h2>
              <p className="text-sm text-gray-400">
                Your authenticated account
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-2">Signed in as</p>
          <p className="text-white break-all">{session.user.email}</p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm text-bizora-success">
            <span className="w-2 h-2 rounded-full bg-bizora-success" />
            Authentication active
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
