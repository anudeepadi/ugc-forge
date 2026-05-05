
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageShell } from '@/components/layout/PageShell';
import { Command } from '@/pages/Command';
import { Factory } from '@/pages/Factory';
import { Scripts } from '@/pages/Scripts';
import { Renders } from '@/pages/Renders';
import { Scores } from '@/pages/Scores';
import { Exports } from '@/pages/Exports';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h2 className="text-display text-4xl text-white mb-4">404</h2>
      <p className="text-white/50 mb-6">That workspace view doesn't exist in this prototype.</p>
      <a href="/" className="text-red-brand underline text-sm">Return to command</a>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-black">
          <Sidebar />
          <PageShell>
            <Routes>
              <Route path="/" element={<Command />} />
              <Route path="/factory" element={<Factory />} />
              <Route path="/scripts" element={<Scripts />} />
              <Route path="/renders" element={<Renders />} />
              <Route path="/scores" element={<Scores />} />
              <Route path="/exports" element={<Exports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageShell>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
