
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { UnitSelector } from './modules/UnitSelector';
import { UnitDashboard } from './modules/UnitDashboard';
import { WeeklyReportForm } from './modules/WeeklyReportForm';
import { TeacherManager } from './modules/TeacherManager';
import { GalleryManager } from './modules/GalleryManager';
import { OrgChartManager } from './modules/OrgChartManager';
import { AnnualPlanManager } from './modules/AnnualPlanManager';
import { AttendanceForm } from './modules/AttendanceForm';
import { AttendanceList } from './modules/AttendanceList'; // New Import
import { ExternalTab } from './modules/ExternalTab';
import { AppState, UserRole } from './types';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentTab: 'INTERNAL',
    view: 'HOME',
    selectedYear: 2026,
    selectedUnit: null,
    user: { role: UserRole.GUEST }
  });

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Browser back button handling
  useEffect(() => {
    // Push initial state
    window.history.pushState({ view: state.view }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        const targetView = event.state.view;

        // Define navigation hierarchy
        const viewHierarchy: Record<string, string> = {
          'FORM_ATTENDANCE': 'VIEW_ATTENDANCE',
          'VIEW_ATTENDANCE': 'UNIT_DASHBOARD',
          'VIEW_GALLERY': 'UNIT_DASHBOARD',
          'FORM_REPORT': 'UNIT_DASHBOARD',
          'MANAGE_TEACHERS': 'UNIT_DASHBOARD',
          'VIEW_ORG': 'UNIT_DASHBOARD',
          'VIEW_PLAN': 'UNIT_DASHBOARD',
          'UNIT_DASHBOARD': 'HOME',
          'HOME': 'HOME'
        };

        const previousView = viewHierarchy[state.view] || 'HOME';

        setState(prev => ({
          ...prev,
          view: previousView as any,
          selectedUnit: previousView === 'HOME' ? null : prev.selectedUnit
        }));
      } else {
        // Prevent exit, go to home
        setState(prev => ({ ...prev, view: 'HOME', selectedUnit: null }));
        window.history.pushState({ view: 'HOME' }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [state.view]);

  // Push state when view changes
  useEffect(() => {
    if (state.view !== 'HOME') {
      window.history.pushState({ view: state.view }, '');
    }
  }, [state.view]);

  const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
  };

  const handleTabChange = (tab: 'INTERNAL' | 'EXTERNAL') => {
    setState(prev => ({ ...prev, currentTab: tab, view: 'HOME', selectedUnit: null }));
  };

  const handleChangeYear = (dir: 'next' | 'prev') => {
    setState(prev => ({ ...prev, selectedYear: dir === 'next' ? prev.selectedYear + 1 : prev.selectedYear - 1 }));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setState(prev => ({ ...prev, user: { role: UserRole.SUPER_ADMIN } }));
      setShowAdminLogin(false);
      setAdminPassword('');
    } else { alert("Salah."); }
  };

  const renderContent = () => {
    if (state.view === 'HOME') {
      return (
        <div className="flex flex-row gap-4 md:gap-6 items-stretch min-h-[500px]">
          <div className="w-12 md:w-16 shrink-0 flex flex-col transition-all duration-300">
            <div className="bg-gradient-to-b from-red-700 to-red-900 rounded-xl shadow-lg text-white flex flex-col items-center py-4 h-full relative sticky top-24">
              <button onClick={() => handleChangeYear('next')} className="p-1 hover:bg-white/20 rounded-full mb-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth={3} /></svg></button>
              <div className="flex-1 flex items-center justify-center"><p className="whitespace-nowrap -rotate-90 text-[10px] font-bold tracking-widest text-red-200">SESI SEKOLAH</p></div>
              <h2 className="text-2xl md:text-3xl font-black -rotate-90 text-yellow-400 py-4">{state.selectedYear}</h2>
              <div className="flex-1 flex items-center justify-center"><p className="whitespace-nowrap -rotate-90 text-[10px] font-bold text-white">{state.selectedYear < 2026 ? 'ARKIB' : 'SEMASA'}</p></div>
              <button onClick={() => handleChangeYear('prev')} className="p-1 hover:bg-white/20 rounded-full mt-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={3} /></svg></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="bg-white p-1 rounded-xl shadow-sm border mb-6 flex shrink-0">
              <button onClick={() => handleTabChange('INTERNAL')} className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all ${state.currentTab === 'INTERNAL' ? 'bg-red-50 text-red-700' : 'text-gray-400'}`}>UNIT KOKURIKULUM</button>
              <button onClick={() => handleTabChange('EXTERNAL')} className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all ${state.currentTab === 'EXTERNAL' ? 'bg-red-50 text-red-700' : 'text-gray-400'}`}>PENCAPAIAN</button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={state.currentTab + state.selectedYear} initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}>
                {state.currentTab === 'INTERNAL' ? <UnitSelector selectedYear={state.selectedYear} onSelectUnit={u => setState(prev => ({ ...prev, selectedUnit: u, view: 'UNIT_DASHBOARD' }))} /> : <ExternalTab userRole={state.user.role} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      );
    }

    // Guard clause for unit
    if (!state.selectedUnit && state.view !== 'HOME') {
        setState(prev => ({ ...prev, view: 'HOME' }));
        return null;
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div key={state.view} initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}>
          {state.view === 'UNIT_DASHBOARD' && state.selectedUnit && <UnitDashboard unit={state.selectedUnit} userRole={state.user.role} onNavigate={v => setState(prev => ({ ...prev, view: v }))} onBack={() => setState(prev => ({ ...prev, view: 'HOME' }))} />}
          {state.view === 'VIEW_GALLERY' && state.selectedUnit && <GalleryManager unit={state.selectedUnit} year={state.selectedYear} userRole={state.user.role} onBack={() => setState(prev => ({ ...prev, view: 'UNIT_DASHBOARD' }))} />}
          {state.view === 'FORM_REPORT' && state.selectedUnit && <WeeklyReportForm unit={state.selectedUnit} year={state.selectedYear} onBack={() => setState(prev => ({ ...prev, view: 'UNIT_DASHBOARD' }))} />}
          {state.view === 'MANAGE_TEACHERS' && state.selectedUnit && <TeacherManager unit={state.selectedUnit} userRole={state.user.role} onBack={() => setState(prev => ({ ...prev, view: 'UNIT_DASHBOARD' }))} />}
          
          {/* VIEW_ATTENDANCE: List View */}
          {state.view === 'VIEW_ATTENDANCE' && state.selectedUnit && (
             <AttendanceList 
                unit={state.selectedUnit} 
                year={state.selectedYear} 
                onBack={() => setState(prev => ({ ...prev, view: 'UNIT_DASHBOARD' }))} 
                onCreateNew={() => setState(prev => ({ ...prev, view: 'FORM_ATTENDANCE' }))}
             />
          )}

          {/* FORM_ATTENDANCE: Form View */}
          {state.view === 'FORM_ATTENDANCE' && state.selectedUnit && (
             <AttendanceForm 
                unit={state.selectedUnit} 
                year={state.selectedYear} 
                onBack={() => setState(prev => ({ ...prev, view: 'VIEW_ATTENDANCE' }))} // Back goes to List, not Dashboard
             />
          )}

          {state.view === 'VIEW_ORG' && state.selectedUnit && (
             <OrgChartManager 
                unit={state.selectedUnit} 
                year={state.selectedYear} 
                onBack={() => setState(prev => ({ ...prev, view: 'UNIT_DASHBOARD' }))} 
             />
          )}
          {state.view === 'VIEW_PLAN' && state.selectedUnit && (
             <AnnualPlanManager 
                unit={state.selectedUnit} 
                year={state.selectedYear} 
                onBack={() => setState(prev => ({ ...prev, view: 'UNIT_DASHBOARD' }))} 
             />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      <Header onLogoClick={() => state.user.role === UserRole.SUPER_ADMIN ? setState(prev => ({ ...prev, user: { role: UserRole.GUEST } })) : setShowAdminLogin(true)} />
      {state.user.role === UserRole.SUPER_ADMIN && <div className="bg-yellow-400 text-black text-center text-xs py-1 font-bold">MOD ADMIN AKTIF</div>}
      {state.selectedYear < 2026 && <div className="bg-gray-800 text-white text-center text-[10px] py-1 font-bold">PAPARAN ARKIB TAHUN {state.selectedYear}</div>}
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 flex-1 w-full">{renderContent()}</main>
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminLogin(false)}></div>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs relative animate-scaleUp">
            <h3 className="text-lg font-bold text-center mb-4">Admin Login</h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <Input type="password" placeholder="Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="text-center" />
              <Button type="submit" className="w-full">Masuk</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
