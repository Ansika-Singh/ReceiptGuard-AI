import { useState, useEffect, useMemo } from 'react';
import {
  getReceipts,
  deleteReceipt,
  setAllReceipts,
  clearAllStorage,
  getDismissedAlerts,
  dismissAlert,
} from '../lib/storage.js';
import { auditAllReceipts } from '../lib/intelligence.js';
import { formatINR } from '../lib/formatting.js';
import { generateDemoTransactions } from '../data/demoData.js';
import { CategoryDoughnutChart, SpendingTimeBarChart } from '../components/Charts.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import AlertCard from '../components/AlertCard.jsx';

/**
 * DashboardPage component
 * Shows high-level financial metrics, category/temporal charts,
 * active AI-assisted review alerts, and full searchable transactions.
 */
export default function DashboardPage({ onUpload, onNavigate }) {
  const [receipts, setReceipts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [bannerMessage, setBannerMessage] = useState(null);

  // Refresh data from storage
  const reloadData = () => {
    const list = getReceipts();
    setReceipts(list);
    setDismissedAlerts(getDismissedAlerts());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Compute system-wide alerts across all current receipts
  const allAlerts = useMemo(() => {
    return auditAllReceipts(receipts);
  }, [receipts]);

  // Filter out alerts already marked as "Looks fine"
  const activeAlerts = useMemo(() => {
    return allAlerts.filter((a) => !dismissedAlerts.includes(a.id));
  }, [allAlerts, dismissedAlerts]);

  // Financial summary metrics
  const totalSpending = useMemo(() => {
    return receipts.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  }, [receipts]);

  const thisMonthSpending = useMemo(() => {
    const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-10"
    return receipts
      .filter((r) => (r.date || '').startsWith(currentYearMonth))
      .reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  }, [receipts]);

  // Demo Tool Actions
  const handleLoadDemoData = () => {
    const seeded = generateDemoTransactions();
    setAllReceipts(seeded);
    reloadData();
    setBannerMessage({
      type: 'success',
      text: `Loaded ${seeded.length} realistic demo transactions! Baseline electronics purchases & Starbucks receipt seeded.`,
    });
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all transaction records and dismissed alert states?')) {
      clearAllStorage();
      reloadData();
      setBannerMessage({
        type: 'info',
        text: 'All expense data and alert states have been reset.',
      });
      setTimeout(() => setBannerMessage(null), 4000);
    }
  };

  const handleDismissAlert = (alertId) => {
    dismissAlert(alertId);
    setDismissedAlerts(getDismissedAlerts());
  };

  const handleDeleteReceipt = (receiptId) => {
    if (window.confirm('Delete this transaction receipt?')) {
      deleteReceipt(receiptId);
      reloadData();
    }
  };

  const handleReviewReceipt = (receipt) => {
    onNavigate('review', {
      ...receipt,
      sourceMode: 'existing_edit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Financial Dashboard
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Turn receipts into financial intelligence &middot; AI-assisted expense review
          </p>
        </div>

        {/* Demo Tools & Add Receipt */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemoData}
            className="px-3 py-2 bg-white text-primary border border-primary/30 hover:bg-primary-50 text-xs font-semibold rounded-lg transition-smooth cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Seed ~25 realistic transactions relative to today"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Load Demo Data
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="px-3 py-2 bg-white text-gray-600 hover:text-red-600 border border-gray-300 hover:bg-red-50 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
            title="Reset all receipts"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={onUpload}
            className="px-4 py-2 bg-primary text-white hover:bg-primary-mid text-xs font-bold rounded-lg transition-smooth cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Receipt
          </button>
        </div>
      </div>

      {/* Banner Notification */}
      {bannerMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-smooth ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button onClick={() => setBannerMessage(null)} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spending */}
        <div className="card p-4 border border-border">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spending</span>
            <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <span className="font-bold text-xs">₹</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatINR(totalSpending)}
          </div>
          <p className="text-[11px] text-muted mt-0.5">Across {receipts.length} recorded receipts</p>
        </div>

        {/* This Month */}
        <div className="card p-4 border border-border">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatINR(thisMonthSpending)}
          </div>
          <p className="text-[11px] text-muted mt-0.5">Current billing cycle</p>
        </div>

        {/* Receipt Count */}
        <div className="card p-4 border border-border">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Receipts Stored</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {receipts.length}
          </div>
          <p className="text-[11px] text-muted mt-0.5">With thumbnail visual caches</p>
        </div>

        {/* Items Requiring Review (Amber Badge) */}
        <div className={`card p-4 border ${activeAlerts.length > 0 ? 'border-amber-300 bg-amber-50/50' : 'border-border'}`}>
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">Requires Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-950 mt-1">
            {activeAlerts.length}
          </div>
          <p className="text-[11px] text-amber-800 mt-0.5">
            {activeAlerts.length === 1 ? '1 item requires review' : `${activeAlerts.length} items require review`}
          </p>
        </div>
      </div>

      {/* Active AI-Assisted Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                Items Requiring Review ({activeAlerts.length})
              </h3>
            </div>
            <span className="text-xs text-muted">
              AI-assisted detection &middot; Deterministic Explanations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={handleDismissAlert}
                onReview={(id) => {
                  const target = receipts.find((r) => r.id === id);
                  if (target) handleReviewReceipt(target);
                }}
                onDeleteDuplicate={(id) => handleDeleteReceipt(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visual Analytics Charts: Category Doughnut & Spend Over Time Bar */}
      {receipts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spending Over Time Bar Chart */}
          <div className="lg:col-span-7 card p-5 border border-border">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Spending Over Time</h3>
                <p className="text-xs text-muted">Daily expense timeline</p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded">
                Recent Days
              </span>
            </div>
            <SpendingTimeBarChart receipts={receipts} />
          </div>

          {/* Spending by Category Doughnut Chart */}
          <div className="lg:col-span-5 card p-5 border border-border">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Spending by Category</h3>
                <p className="text-xs text-muted">Expense allocation</p>
              </div>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                Categorized
              </span>
            </div>
            <CategoryDoughnutChart receipts={receipts} />
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="card p-12 text-center border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M8 7h8" />
              <path d="M8 11h8" />
              <path d="M8 15h5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No receipts recorded yet</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Get started by uploading a receipt or click "Load Demo Data" to explore sample transactions and AI-assisted alerts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleLoadDemoData}
              className="px-4 py-2.5 bg-white text-primary border border-primary text-xs font-bold rounded-lg hover:bg-primary-50 transition-smooth cursor-pointer"
            >
              Load Demo Data
            </button>
            <button
              onClick={onUpload}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-mid transition-smooth cursor-pointer shadow-sm"
            >
              Upload First Receipt
            </button>
          </div>
        </div>
      )}

      {/* Full Searchable Transactions Table */}
      {receipts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Recorded Transactions ({receipts.length})
            </h3>
            <span className="text-xs text-muted">
              Search by merchant, category, date, or item
            </span>
          </div>

          <TransactionTable
            receipts={receipts}
            alerts={activeAlerts}
            onReviewReceipt={handleReviewReceipt}
            onDeleteReceipt={handleDeleteReceipt}
          />
        </div>
      )}
    </div>
  );
}
