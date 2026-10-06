/**
 * Desktop sidebar navigation — hidden on mobile.
 */

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'upload',
    label: 'Upload Receipt',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-border py-4 flex-shrink-0" role="navigation" aria-label="Main navigation">
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id || (item.id === 'dashboard' && currentPage === 'review');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-smooth cursor-pointer
                ${isActive
                  ? 'bg-primary-50 text-primary'
                  : 'text-muted hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={isActive ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* AI-assisted note */}
      <div className="mt-auto mx-3 p-3 bg-primary-50 rounded-lg">
        <p className="text-xs text-primary font-medium mb-1">AI-Assisted Detection</p>
        <p className="text-xs text-muted leading-relaxed">
          Receipts are analyzed for potential duplicates and unusual expenses. All detections require manual review.
        </p>
      </div>
    </aside>
  );
}
