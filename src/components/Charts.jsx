import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { CATEGORIES, CATEGORY_COLORS, formatINR } from '../lib/formatting.js';

// Register Chart.js modules
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Category Breakdown Doughnut Chart
 */
export function CategoryDoughnutChart({ receipts = [] }) {
  // Aggregate total by category
  const totalsByCategory = {};
  for (const cat of CATEGORIES) {
    totalsByCategory[cat] = 0;
  }

  for (const r of receipts) {
    const cat = r.category || r.suggestedCategory || 'Other';
    if (totalsByCategory[cat] !== undefined) {
      totalsByCategory[cat] += Number(r.total) || 0;
    } else {
      totalsByCategory.Other += Number(r.total) || 0;
    }
  }

  const activeCategories = CATEGORIES.filter((cat) => totalsByCategory[cat] > 0);

  if (activeCategories.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-muted">
        <p className="text-xs">No expense data to chart yet</p>
      </div>
    );
  }

  const data = {
    labels: activeCategories,
    datasets: [
      {
        data: activeCategories.map((cat) => totalsByCategory[cat]),
        backgroundColor: activeCategories.map((cat) => CATEGORY_COLORS[cat]?.chart || '#6B7280'),
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11, family: 'Inter' },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatINR(ctx.raw)}`,
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div className="h-64 relative">
      <Doughnut data={data} options={options} />
    </div>
  );
}

/**
 * Spending Over Time Bar Chart (grouped by date)
 */
export function SpendingTimeBarChart({ receipts = [] }) {
  if (!receipts.length) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center text-muted">
        <p className="text-xs">No timeline data available</p>
      </div>
    );
  }

  // Aggregate amounts by date
  const byDate = {};
  for (const r of receipts) {
    if (!r.date) continue;
    if (!byDate[r.date]) byDate[r.date] = 0;
    byDate[r.date] += Number(r.total) || 0;
  }

  // Sort dates chronologically, take last 14 active dates
  const sortedDates = Object.keys(byDate).sort().slice(-14);

  const formattedLabels = sortedDates.map((d) => {
    try {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    } catch {
      return d;
    }
  });

  const data = {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Daily Spend',
        data: sortedDates.map((d) => byDate[d]),
        backgroundColor: '#154A82',
        hoverBackgroundColor: '#2F6BA8',
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items) => sortedDates[items[0].dataIndex],
          label: (ctx) => ` Spent: ${formatINR(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: 'Inter' } },
      },
      y: {
        grid: { color: '#F3F4F6' },
        ticks: {
          font: { size: 10, family: 'Inter' },
          callback: (value) => `₹${value}`,
        },
      },
    },
  };

  return (
    <div className="h-64 relative">
      <Bar data={data} options={options} />
    </div>
  );
}
