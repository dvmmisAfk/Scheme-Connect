import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary, OfflineBanner } from '@/components/ui';
import { Presenter } from '@/components/Presenter';
import Onboarding from '@/screens/Onboarding';
import Questionnaire from '@/screens/Questionnaire';
import Results from '@/screens/Results';
import SchemeDetail from '@/screens/SchemeDetail';
import Saved from '@/screens/Saved';
import Ask from '@/screens/Ask';
import Sahayak, { SahayakFamily } from '@/screens/Sahayak';
import AdminSchemes, { AdminScheme } from '@/screens/Admin';
import Lab from '@/screens/Lab';
import Tokens from '@/screens/Tokens';
import { NotFound } from '@/screens/Misc';
import { useSession } from '@/store/session';

export default function App() {
  const presenter = useSession((s) => s.presenter);
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className={presenter ? 'lg:pr-[360px]' : ''}>
        <OfflineBanner />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/check" element={<Questionnaire />} />
            <Route path="/results" element={<Results />} />
            <Route path="/scheme/:id" element={<SchemeDetail />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/ask" element={<Ask />} />
            <Route path="/sahayak" element={<Sahayak />} />
            <Route path="/sahayak/family/:id" element={<SahayakFamily />} />
            <Route path="/admin/schemes" element={<AdminSchemes />} />
            <Route path="/admin/schemes/:id" element={<AdminScheme />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </div>
      <Presenter />
    </BrowserRouter>
  );
}
