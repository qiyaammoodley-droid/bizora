
import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

type AppLayoutProps = {
  organisationName: string;
  userEmail: string;
  onSignOut: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
};

function AppLayout({
  organisationName,
  userEmail,
  onSignOut,
  activePage,
  onNavigate,
  children,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bizora-background text-white">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:pl-[248px]">
        <Topbar
          organisationName={organisationName}
          userEmail={userEmail}
          onSignOut={onSignOut}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1600px] px-5 py-7 md:px-8 md:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
