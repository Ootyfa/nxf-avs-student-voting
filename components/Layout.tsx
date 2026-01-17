import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Film, Trophy, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className="flex flex-col items-center justify-center w-full py-2 relative group">
        <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-brand-50 text-brand-600 scale-110' : 'text-slate-400 hover:bg-slate-50'}`}>
          <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        {/* Simple dot indicator instead of text to keep it minimal/clean */}
        {isActive && <div className="absolute bottom-1 w-1 h-1 bg-brand-600 rounded-full"></div>}
      </Link>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="glass shadow-soft rounded-3xl border border-white/50 h-16 flex justify-around items-center max-w-md mx-auto">
        <NavItem to="/" icon={Home} label="Home" />
        <NavItem to="/films" icon={Film} label="Films" />
        <NavItem to="/leaderboard" icon={Trophy} label="Rankings" />
        <NavItem to="/profile" icon={User} label="Profile" />
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col mx-auto max-w-md shadow-2xl overflow-hidden relative border-x border-slate-100">
      <main className="flex-grow overflow-y-auto pb-24 no-scrollbar">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;