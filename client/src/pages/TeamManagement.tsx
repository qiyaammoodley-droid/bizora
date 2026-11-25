
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Mail,
  UserPlus,
  Clock,
  Send,
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

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export default function TeamManagement({
  organisationId,
  userRole,
}: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');

  const [loading, setLoading] = useState(true);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationListLoading, setInvitationListLoading] = useState(false);

  const [error, setError] = useState('');
  const [invitationError, setInvitationError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = ['owner', 'admin'].includes(userRole);
  const isOwner = userRole === 'owner';

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

  const loadInvitations = useCallback(async () => {
    if (!canManage) return;

    setInvitationListLoading(true);
    setInvitationError('');

    const { data, error: loadError } = await supabase
      .from('team_invitations')
      .select('id, email, role, status, created_at, expires_at')
      .eq('organisation_id', organisationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (loadError) {
      setInvitationError(loadError.message);
      setInvitations([]);
      setInvitationListLoading(false);
      return;
    }

    setInvitations((data ?? []) as Invitation[]);
    setInvitationListLoading(false);
  }, [organisationId, canManage]);

  useEffect(() => {
    void loadTeam();
    void loadInvitations();
  }, [loadTeam, loadInvitations]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return members;

    return members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    );
  }, [members, search]);

  const roleStyle = (memberRole: string) => {
    switch (memberRole) {
      case 'owner':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
      case 'admin':
        return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
      default:
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    }
  };

  const handleInvitation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setInvitationError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setInvitationError('Please enter an email address.');
      return;
    }

    if (!isOwner && role === 'admin') {
      setInvitationError('Only owners can invite administrators.');
      return;
    }

    setInvitationLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'invite-team-member',
        {
          body: {
            email: cleanEmail,
            role,
            organisationId,
          },
        }
      );

      if (functionError) {
        let message = functionError.message;

        const context = (
          functionError as typeof functionError & { context?: Response }
        ).context;

        if (context instanceof Response) {
          try {
            const responseBody = await context.json();
            message = responseBody.error || message;
          } catch {
            // Keep the original error message.
          }
        }

        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Could not create the invitation.');
      }

      setSuccess(
        `Invitation created for ${cleanEmail}. It expires in seven days.`
      );

      setEmail('');
      setRole('employee');

      await loadInvitations();
    } catch (err) {
      setInvitationError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred.'
      );
    } finally {
      setInvitationLoading(false);
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
          onClick={() => {
            void loadTeam();
            void loadInvitations();
          }}
          disabled={loading || invitationListLoading}
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
            <h2 className="font-semibold text-white">Your team</h2>
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
            <Users size={32} className="mx-auto mb-3 text-gray-500" />

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

      {/* Invitation form */}
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
              Invite people to join your business workspace.
              Invitations remain valid for seven days.
            </p>
          </div>
        </div>

        {!canManage ? (
          <p className="mt-5 text-sm text-amber-300">
            Only owners and administrators can invite team members.
          </p>
        ) : (
          <form onSubmit={handleInvitation} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="invite-email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email address
              </label>

              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@example.com"
                className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-bizora-primary"
              />
            </div>

            <div>
              <label
                htmlFor="invite-role"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Team role
              </label>

              <select
                id="invite-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-lg border border-bizora-border bg-bizora-background px-4 py-3 text-sm text-white outline-none focus:border-bizora-primary"
              >
                <option value="employee">Employee</option>

                {isOwner && (
                  <option value="admin">Administrator</option>
                )}
              </select>
            </div>

            {invitationError && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {invitationError}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={invitationLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-bizora-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Send size={16} />
              {invitationLoading ? 'Creating invitation...' : 'Send invitation'}
            </button>

            <p className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck size={15} />
              Invitations are checked securely on the server.
            </p>
          </form>
        )}
      </div>

      {/* Pending invitations */}
      {canManage && (
        <div className="rounded-xl border border-bizora-border bg-bizora-surface">
          <div className="flex flex-col justify-between gap-3 border-b border-bizora-border p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-white">
                Pending invitations
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Invitations awaiting acceptance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadInvitations()}
              disabled={invitationListLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-bizora-border px-3 py-2 text-xs text-gray-300 transition hover:border-bizora-primary disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={invitationListLoading ? 'animate-spin' : ''}
              />
              Refresh invitations
            </button>
          </div>

          {invitationError && (
            <div className="m-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              Could not load invitations: {invitationError}
            </div>
          )}

          {invitationListLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Mail size={30} className="mx-auto mb-3 text-gray-500" />

              <h3 className="font-semibold text-white">
                No pending invitations
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Invitations you create will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-bizora-border">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-bizora-primary/10 p-2 text-bizora-primary">
                      <Mail size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        {invitation.email}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {invitation.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-gray-400 sm:items-end">
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <Clock size={13} />
                      Pending
                    </span>

                    <span>
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-bizora-border px-5 py-4">
            <p className="text-xs text-gray-500">
              {invitations.length} pending invitation
              {invitations.length === 1 ? '' : 's'}.
              Email delivery is not configured yet.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
