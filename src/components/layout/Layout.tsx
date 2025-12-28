import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="pb-20 md:pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
