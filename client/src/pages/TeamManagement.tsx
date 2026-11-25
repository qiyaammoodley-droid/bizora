
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Mail,
  UserPlus,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

type TeamManagementProps = {
  organisationId: string;
  userRole: string;
};

type TeamMember = {
  user_id: string;
  full_name: string;
  role: string;
};

export default function TeamManagement({
  organisationId,
  userRole,
}: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManage = userRole === 'owner' || userRole === 'admin';

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase.rpc(
      'get_org_team_members',
      {
        target_org_id: organisationId,
      }
    );

    if (loadError) {
      setError(loadError.message);
      setMembers([]);
      setLoading(false);
      return;
    }

    setMembers((data ?? []) as TeamMember[]);
    setLoading(false);
  }, [organisationId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return members;

    return members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    );
  }, [members, search]);

  const roleStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
      case 'admin':
        return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
      default:
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    }
  };

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-bizora-primary">
            BUSINESS MANAGEMENT
          </p>

          <h1 className="text-3xl font-bold text-white">
            Team & Employees
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            View and manage the people who belong to your business.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTeam()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-bizora-border bg-bizora-surface px-4 py-2.5 text-sm text-gray-300 transition hover:border-bizora-primary disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh team
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Total team members</p>
            <Users className="text-bizora-primary" size={20} />
          </div>
          <p className="mt-4 text-3xl font-bold text-white">
            {loading ? '...' : members.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Members in this workspace
          </p>
        </div>

        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Administrators</p>
            <ShieldCheck className="text-sky-300" size={20} />
          </div>
          <p className="mt-4 text-3xl font-bold text-white">
            {loading
              ? '...'
              : members.filter((member) => member.role === 'admin').length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Owners are counted separately
          </p>
        </div>

        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Employees</p>
            <UserRound className="text-emerald-300" size={20} />
          </div>
          <p className="mt-4 text-3xl font-bold text-white">
            {loading
              ? '...'
              : members.filter((member) => member.role === 'employee').length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Standard team members
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          Could not load your team: {error}
        </div>
      )}

      <div className="rounded-xl border border-bizora-border bg-bizora-surface">
        <div className="flex flex-col justify-between gap-4 border-b border-bizora-border p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Your team
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              People currently connected to your workspace.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-3 text-gray-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team members..."
              className="w-full rounded-lg border border-bizora-border bg-bizora-background py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-bizora-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Loading your team...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Users
              size={32}
              className="mx-auto mb-3 text-gray-500"
            />
            <h3 className="font-semibold text-white">
              {search ? 'No matching team members' : 'No team members found'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {search
                ? 'Try another name or role.'
                : 'Your workspace team directory is currently empty.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-bizora-border">
            {filteredMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bizora-primary/10 text-bizora-primary">
                    <UserRound size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {member.full_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Team member ID: {member.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${roleStyle(member.role)}`}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-bizora-border px-5 py-4">
          <p className="text-xs text-gray-500">
            Showing {filteredMembers.length} of {members.length} team members.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-bizora-primary/10 p-2 text-bizora-primary">
            <UserPlus size={20} />
          </div>

          <div className="flex-1">
            <h2 className="font-semibold text-white">
              Invite new team members
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Team invitations and role management are the next part
              of this build. Invitations will use a secure server-side
              process so that private authentication credentials are
              never exposed in your browser.
            </p>

            {!canManage && (
              <p className="mt-3 text-xs text-amber-300">
                Only owners and admins will be able to manage team invitations.
              </p>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Mail size={15} />
              Secure email invitations coming next.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
