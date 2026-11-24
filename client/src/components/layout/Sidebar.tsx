
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  FolderOpen,
  ChartNoAxesCombined,
  UserRoundCog,
  Settings,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
  userRole: string;
};

const navigation = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { name: 'Customers', icon: Users },
      { name: 'Bookings & Scheduling', icon: CalendarDays },
      { name: 'Payments & Invoices', icon: CreditCard },
      { name: 'Business Records', icon: FolderOpen },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { name: 'Reports & Analytics', icon: ChartNoAxesCombined },
      { name: 'Team & Employees', icon: UserRoundCog },
      { name: 'Business Settings', icon: Settings },
      { name: 'Roles & Permissions', icon: ShieldCheck },
    ],
  },
];

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
  userRole,
}: SidebarProps) {
  const canViewFinancials =
    userRole === 'owner' || userRole === 'admin';

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-bizora-border bg-bizora-sidebar transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-bizora-border px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-bizora-primary p-2">
              <Building2 size={21} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Bizora
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
          {navigation.map((section) => {
            const visibleItems = section.items.filter(
              (item) =>
                item.name !== 'Payments & Invoices' ||
                canViewFinancials,
            );

            return (
              <div key={section.label}>
                <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-gray-500">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = activePage === item.name;

                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          onNavigate(item.name);
                          onClose();
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] font-medium transition ${
                          active
                            ? 'bg-bizora-primary/15 text-bizora-primary'
                            : 'text-gray-400 hover:bg-bizora-elevated hover:text-white'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>

                        {active && (
                          <span className="ml-auto h-5 w-1 rounded-full bg-bizora-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-bizora-border p-4">
          <div className="rounded-xl border border-bizora-border bg-bizora-surface p-4">
            <p className="text-xs font-semibold text-white">
              Bizora Workspace
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Business management made simple.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
