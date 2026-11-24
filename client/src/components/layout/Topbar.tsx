
import { Menu, LogOut } from 'lucide-react';

type TopbarProps = {
  organisationName: string;
  userEmail: string;
  onSignOut: () => void;
  onMenuClick: () => void;
};

function Topbar({
  organisationName,
  userEmail,
  onSignOut,
  onMenuClick,
}: TopbarProps) {
  const initials = userEmail
    ? userEmail.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-bizora-border bg-bizora-background/95 px-5 backdrop-blur-md md:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-gray-400 transition hover:bg-bizora-elevated hover:text-white lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
            Workspace
          </p>

          <h2 className="truncate text-sm font-semibold text-white md:text-base">
            {organisationName}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bizora-primary/15 text-xs font-bold text-bizora-primary">
            {initials}
          </div>

          <div className="hidden min-w-0 md:block">
            <p className="max-w-[180px] truncate text-xs font-medium text-white">
              {userEmail}
            </p>

            <p className="text-[11px] text-gray-500">
              Signed in
            </p>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-bizora-border sm:block" />

        <button
          onClick={onSignOut}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-bizora-elevated hover:text-white"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;