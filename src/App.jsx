import { useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import BottomNav from './components/BottomNav.jsx';
import Footer from './components/Footer.jsx';
import UploadPage from './pages/UploadPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

/**
 * App root — manages navigation state and passes page context.
 * Uses simple state-based routing (no router dependency).
 */
export default function App() {
  // Navigation: 'upload' | 'review' | 'dashboard'
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Data passed between pages
  const [reviewData, setReviewData] = useState(null);

  const navigate = (page, data) => {
    if (data) setReviewData(data);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadPage onExtracted={(data) => navigate('review', data)} />;
      case 'review':
        return (
          <ReviewPage
            data={reviewData}
            onSaved={() => navigate('dashboard')}
            onBack={() => navigate('upload')}
          />
        );
      case 'dashboard':
      default:
        return <DashboardPage onUpload={() => navigate('upload')} onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex flex-1">
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar currentPage={currentPage} onNavigate={navigate} />

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      <Footer />

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav currentPage={currentPage} onNavigate={navigate} />
    </div>
  );
}
