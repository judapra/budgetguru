import { AppHeader } from '@/components/app-header';
import { Dashboard } from '@/components/dashboard/dashboard';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <Dashboard />
      </main>
    </div>
  );
}
