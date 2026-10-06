/**
 * Header component — gradient header with hackathon branding.
 */
export default function Header() {
  return (
    <header className="gradient-header text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Hackathon branding bar */}
        <div className="flex items-center justify-between py-1.5 text-xs opacity-80 border-b border-white/20">
          <span className="tracking-wide uppercase font-medium">Cyrus Hack-A-Thon 2026</span>
          <span className="tracking-wide">Team Pixel Pirates</span>
        </div>

        {/* Main header */}
        <div className="flex items-center gap-3 py-3">
          {/* Logo icon */}
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M8 7h8" />
              <path d="M8 11h8" />
              <path d="M8 15h5" />
            </svg>
          </div>

          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">
              ReceiptGuard AI
            </h1>
            <p className="text-xs opacity-70 leading-tight">
              Turn receipts into financial intelligence
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
