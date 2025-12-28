import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
