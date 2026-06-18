import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PastModels from './pages/PastModels';
import PredictiveModels from './pages/PredictiveModels';
import CorrelativeGraphs from './pages/CorrelativeGraphs';
import AIChat from './pages/AIChat';
import EcoGame from './pages/EcoGame';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  // Lifted so Dashboard chart range persists when navigating away and back
  const [dateRange, setDateRange] = useState('Daily');
  // Key changes on nav to trigger page-enter animation
  const [pageKey, setPageKey] = useState(0);

  const handleNav = useCallback((id) => {
    setActivePage(id);
    setPageKey(k => k + 1);
  }, []);

  const pageProps = { dateRange, setDateRange };

  function renderPage() {
    switch (activePage) {
      case 'dashboard':   return <Dashboard    key={pageKey} {...pageProps} />;
      case 'past':        return <PastModels   key={pageKey} />;
      case 'predictive':  return <PredictiveModels key={pageKey} />;
      case 'correlative': return <CorrelativeGraphs key={pageKey} />;
      case 'chat':        return <AIChat        key={pageKey} />;
      case 'ecogame':     return <EcoGame       key={pageKey} />;
      default:            return <Dashboard    key={pageKey} {...pageProps} />;
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={activePage} onNav={handleNav} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header city="Pleasantville, NY" />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
