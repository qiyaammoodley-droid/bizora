
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import AuthPage from './components/AuthPage';
import WorkspaceSetup from './components/WorkspaceSetup';
import AppLayout from './components/layout/AppLayout';

import Customers from './pages/Customers';
import Bookings from './pages/Bookings';

import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [activePage, setActivePage] = useState('Dashboard');

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

    void loadSession();

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
        setWorkspaceId('');
        setWorkspaceLoading(false);
        setWorkspaceError('');
        setActivePage('Dashboard');
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
        setWorkspaceError(membershipError.message);
        setWorkspaceLoading(false);
        return;
      }

      if (!membership) {
        setHasWorkspace(false);
        setWorkspaceName('');
        setWorkspaceId('');
        setWorkspaceLoading(false);
        return;
      }

      const { data: organisation, error: organisationError } =
        await supabase
          .from('organisations')
          .select('name')
          .eq('id', membership.organisation_id)
          .single();

      if (!mounted) return;

      if (organisationError) {
        setWorkspaceError(organisationError.message);
        setWorkspaceLoading(false);
        return;
      }

      setWorkspaceId(membership.organisation_id);
      setWorkspaceName(organisation.name);
      setHasWorkspace(true);
      setWorkspaceLoading(false);
    };

    void loadWorkspace();

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

  const handleWorkspaceCreated = async (name: string) => {
    setWorkspaceLoading(true);
    setWorkspaceError('');

    const { data: membership, error } = await supabase
      .from('memberships')
      .select('organisation_id')
      .eq('user_id', session?.user.id ?? '')
      .limit(1)
      .maybeSingle();

    if (error || !membership) {
      setWorkspaceError(
        error?.message ?? 'Your workspace was created, but could not be loaded.',
      );
      setWorkspaceLoading(false);
      return;
    }

    setWorkspaceName(name);
    setWorkspaceId(membership.organisation_id);
    setHasWorkspace(true);
    setWorkspaceLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bizora-background">
        <p className="font-medium text-bizora-primary">
          Loading Bizora...
        </p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (workspaceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bizora-background">
        <p className="font-medium text-bizora-primary">
          Loading your workspace...
        </p>
      </div>
    );
  }

  if (workspaceError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bizora-background px-6 text-center">
        <p className="mb-4 text-red-400">
          We couldn't load your business workspace.
        </p>
        <p className="mb-6 text-sm text-gray-400">
          {workspaceError}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-bizora-primary px-5 py-2 text-white"
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
        onWorkspaceCreated={handleWorkspaceCreated}
      />
    );
  }

  return (
    <AppLayout
      organisationName={workspaceName}
      userEmail={session.user.email ?? ''}
      onSignOut={handleLogout}
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {activePage === 'Customers' ? (
        <Customers
          organisationId={workspaceId}
          userId={session.user.id}
        />
      ) : activePage === 'Bookings & Scheduling' ? (
        <Bookings
          organisationId={workspaceId}
          userId={session.user.id}
        />
      ) : (
        <section>
          <p className="mb-2 text-sm font-medium text-bizora-primary">
            BUSINESS WORKSPACE
          </p>
          <h1 className="text-3xl font-bold text-white">
            Welcome to {workspaceName}
          </h1>
          <p className="mt-2 text-gray-400">
            Your Bizora workspace is ready.
          </p>
        </section>
      )}
    </AppLayout>
  );
}

export default App;
