import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { SideNav } from '@/components/SideNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoading } from '@/components/PageLoading';
import { Dashboard } from '@/pages/Dashboard';
import { Documents } from '@/pages/Documents';
import { Income } from '@/pages/Income';
import { Savings } from '@/pages/Savings';
import { Transactions } from '@/pages/Transactions';
import { Outflows } from '@/pages/Outflows';
import { useHydrate } from '@/store/hooks';
import { initAuth } from '@/auth/google';
import { useAuthSync } from '@/auth/syncEffect';

// Lazy-loaded pages: Upload pulls in pdfjs+xlsx+papaparse (heavy parser
// pipeline), and MonthlyReview is rarely the first page visited. Keeping
// them off the home-route critical path drops the initial bundle from ~340KB
// to roughly the 60–80KB range.
const Upload = lazy(() => import('@/pages/Upload').then(m => ({ default: m.Upload })));
const MonthlyReview = lazy(() => import('@/pages/MonthlyReview').then(m => ({ default: m.MonthlyReview })));

initAuth(import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined);

export function App() {
  useHydrate();
  useAuthSync();
  return (
    <HashRouter>
      <div className="flex h-full bg-bg text-ink">
        <SideNav />
        <div className="flex-1 flex flex-col min-w-0">
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/income" element={<Income />} />
                <Route path="/outflows" element={<Outflows />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/monthly-review" element={<MonthlyReview />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </HashRouter>
  );
}
