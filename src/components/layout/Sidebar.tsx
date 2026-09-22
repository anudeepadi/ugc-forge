
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Factory, FileText, Film, Download, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PIPELINE_SERVICES } from '@/lib/mock-data';

const NAV_ITEMS = [
  { to: '/', label: 'Command', icon: LayoutDashboard, end: true },
  { to: '/factory', label: 'Factory', icon: Factory, end: false },
  { to: '/scripts', label: 'Scripts', icon: FileText, end: false },
  { to: '/renders', label: 'Renders', icon: Film, end: false },
  { to: '/scores', label: 'Scores', icon: Star, end: false },
  { to: '/exports', label: 'Exports', icon: Download, end: false },
];

const STATUS_DOT: Record<string, string> = {
  online: 'bg-success',
  offline: 'bg-red-brand',
  warning: 'bg-warning',
};

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-black border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm font-mono">UF</span>
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">UGC Forge</div>
            <div className="text-white/40 text-xs">Campaign workflow prototype</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="text-label text-white/30 px-2 mb-3">Workspace</div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-red-brand text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5',
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Stack status */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="text-label text-white/30 px-2 mb-3">Example pipeline</div>
          <ul className="space-y-3">
            {PIPELINE_SERVICES.map((svc) => (
              <li key={svc.name} className="px-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[svc.status])} />
                  <span className="text-white/80 text-xs font-medium">{svc.name}</span>
                </div>
                <p className="text-white/40 text-xs ml-3.5">{svc.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-white/30 text-xs">Workflow prototype</span>
          <span className="border border-white/20 text-white/40 text-xs px-2 py-0.5 uppercase tracking-wider">
            MVP
          </span>
        </div>
      </div>
    </aside>
  );
}
