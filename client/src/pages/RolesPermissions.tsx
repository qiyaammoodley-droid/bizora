import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Crown,
  UserCog,
  User,
  RefreshCw,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Role = 'owner' | 'admin' | 'employee';

type TeamMember = {
  user_id: string;
  full_name: string | null;
  role: Role;
};

type Props = {
  organisationId: string;
  userId: string;
  userRole: string;
};

const roleDetails = {
  owner: {
    title: 'Owner',
    description: 'Full control over the business and its workspace.',
    icon: Crown,
  },
  admin: {
    title: 'Administrator',
    description: 'Manages business operations and team invitations.',
    icon: UserCog,
  },
  employee: {
    title: 'Employee',
    description: 'Access to everyday operational tools.',
    icon: User,
  },
};

const permissions = [
  { name: 'View customers', owner: true, admin: true, employee: true },
  { name: 'Manage bookings', owner: true, admin: true, employee: true },
  { name: 'View invoices and payments', owner: true, admin: true, employee: false },
  { name: 'Manage business settings', owner: true, admin: true, employee: false },
  { name: 'Invite team members', owner: true, admin: true, employee: false },
  { name: 'Change team roles', owner: true, admin: false, employee: false },
];

export default function RolesPermissions({
  organisationId,
  userId,
  userRole,
}: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isOwner = userRole === 'owner';

  async function loadMembers() {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase.rpc(
      'get_org_team_members',
      { target_org_id: organisationId }
    );

    if (loadError) {
      setError(loadError.message);
      setMembers([]);
    } else {
      setMembers((data ?? []) as TeamMember[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, [organisationId]);

  async function saveRole(member: TeamMember) {
    const newRole = pendingRoles[member.user_id];

    if (!newRole || newRole === member.role) return;

    setSavingId(member.user_id);
    setMessage('');
    setError('');

    const { error: updateError } = await supabase.rpc(
      'update_team_member_role',
      {
        target_org_id: organisationId,
        target_user_id: member.user_id,
        new_role: newRole,
      }
    );

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage(`${member.full_name || 'Team member'}'s role was updated.`);
      setPendingRoles((current) => {
        const next = { ...current };
        delete next[member.user_id];
        return next;
      });
      await loadMembers();
    }

    setSavingId(null);
  }

  const ownerCount = members.filter((member) => member.role === 'owner').length;
  const adminCount = members.filter((member) => member.role === 'admin').length;
  const employeeCount = members.filter((member) => member.role === 'employee').length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-bizora-primary">
          <ShieldCheck size={22} />
          <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Manage your team's access and understand what each role can do.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
          <Check size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
          <Users className="mb-3 text-bizora-primary" size={21} />
          <p className="text-sm text-gray-400">Total team members</p>
          <p className="mt-1 text-2xl font-semibold">{members.length}</p>
        </div>

        {(['owner', 'admin', 'employee'] as Role[]).map((role) => {
          const Icon = roleDetails[role].icon;
          const count =
            role === 'owner' ? ownerCount :
            role === 'admin' ? adminCount : employeeCount;

          return (
            <div
              key={role}
              className="rounded-xl border border-bizora-border bg-bizora-surface p-5"
            >
              <Icon className="mb-3 text-bizora-primary" size={21} />
              <p className="text-sm text-gray-400">{roleDetails[role].title}s</p>
              <p className="mt-1 text-2xl font-semibold">{count}</p>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
        <div className="mb-5">
          <h2 className="font-semibold">Role overview</h2>
          <p className="mt-1 text-sm text-gray-400">
            Each role has a different level of access within your workspace.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(['owner', 'admin', 'employee'] as Role[]).map((role) => {
            const Icon = roleDetails[role].icon;

            return (
              <div
                key={role}
                className="rounded-xl border border-bizora-border bg-bizora-background p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-bizora-elevated p-2">
                    <Icon size={20} className="text-bizora-primary" />
                  </div>
                  <h3 className="font-medium">{roleDetails[role].title}</h3>
                </div>
                <p className="text-sm leading-6 text-gray-400">
                  {roleDetails[role].description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
        <div className="mb-5">
          <h2 className="font-semibold">Team access</h2>
          <p className="mt-1 text-sm text-gray-400">
            {isOwner
              ? 'As the owner, you can change administrator and employee roles.'
              : 'Your current role does not allow you to change team permissions.'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
            <RefreshCw size={17} className="animate-spin" />
            Loading team members...
          </div>
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No team members found.
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const selectedRole = pendingRoles[member.user_id] ?? member.role;
              const canEdit =
                isOwner &&
                member.role !== 'owner' &&
                member.user_id !== userId;

              return (
                <div
                  key={member.user_id}
                  className="flex flex-col gap-4 rounded-xl border border-bizora-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {member.full_name || 'Team member'}
                      {member.user_id === userId && (
                        <span className="ml-2 text-xs text-gray-400">(You)</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs capitalize text-gray-400">
                      Current role: {member.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEdit ? (
                      <>
                        <select
                          value={selectedRole}
                          onChange={(event) =>
                            setPendingRoles((current) => ({
                              ...current,
                              [member.user_id]: event.target.value as Role,
                            }))
                          }
                          className="rounded-lg border border-bizora-border bg-bizora-background px-3 py-2 text-sm outline-none focus:border-bizora-primary"
                        >
                          <option value="admin">Administrator</option>
                          <option value="employee">Employee</option>
                        </select>

                        <button
                          onClick={() => saveRole(member)}
                          disabled={
                            selectedRole === member.role ||
                            savingId === member.user_id
                          }
                          className="rounded-lg bg-bizora-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingId === member.user_id ? 'Saving...' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <span className="flex items-center gap-2 rounded-lg bg-bizora-background px-3 py-2 text-sm capitalize text-gray-300">
                        <Lock size={14} />
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-bizora-border bg-bizora-surface p-5">
        <h2 className="mb-4 font-semibold">Permission matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-bizora-border text-gray-400">
                <th className="py-3 pr-4 font-medium">Permission</th>
                <th className="px-3 py-3 text-center font-medium">Owner</th>
                <th className="px-3 py-3 text-center font-medium">Admin</th>
                <th className="px-3 py-3 text-center font-medium">Employee</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr
                  key={permission.name}
                  className="border-b border-bizora-border last:border-0"
                >
                  <td className="py-3 pr-4">{permission.name}</td>
                  {(['owner', 'admin', 'employee'] as const).map((role) => (
                    <td key={role} className="px-3 py-3 text-center">
                      {permission[role] ? (
                        <Check className="mx-auto text-green-400" size={17} />
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

