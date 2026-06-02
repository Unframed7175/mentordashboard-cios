import React, { useEffect, useState } from 'react';
import ImportPage from './components/ImportPage';
import KlasTabStrip from './components/KlasTabStrip';
import KlasModal from './components/KlasModal';
import FeedbackModal from './components/FeedbackModal';
import KlasOverzicht from './components/KlasOverzicht';
import DetailWeergave from './components/DetailWeergave';
import SettingsPage from './components/SettingsPage';
import HelpPage from './components/HelpPage';
import OnboardingWizard from './components/OnboardingWizard';
import KlasVerwijderenModal from './components/KlasVerwijderenModal';
import { klassenState, switchActiveKlas, getActiveStudents, saveOnboardingCompleted, deleteKlas, renameKlas, countUniekeLeerlingen } from '../utils/klassen';
import { loadSettings, applyTheme } from '../utils/settings';

function App() {
  const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings' | 'onboarding' | 'help'>(
    () => (klassenState.onboardingCompleted || Object.values(klassenState.klassen).some((k: any) => k.students?.length > 0))
      ? 'import' : 'onboarding'
  );
  const [prevView, setPrevView] = useState<'import' | 'klas' | 'detail'>('klas');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [detailStudentList, setDetailStudentList] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ klasId: string; naam: string; count: number } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [settingsOpenCount, setSettingsOpenCount] = useState(0);
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadSettings();
        const dark =
          s.theme === 'dark' ||
          (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(dark);
        applyTheme(s.theme ?? 'light');
      } catch {
        // On load failure: leave defaults (light mode)
      }
    })();
  }, []);

  useEffect(() => {
    function preventNav(e: DragEvent) {
      e.preventDefault();
    }
    document.addEventListener('dragover', preventNav);
    document.addEventListener('drop', preventNav);
    return () => {
      document.removeEventListener('dragover', preventNav);
      document.removeEventListener('drop', preventNav);
    };
  }, []);

  function handleImportComplete() {
    setRefreshKey(k => k + 1);
    setView('klas');
  }

  function handleFeedback() {
    setFeedbackOpen(true);
  }

  function handleOpenSettings() {
    setSettingsOpenCount(c => c + 1);
    // CR-02: guard against non-content views (settings/onboarding) being stored as prevView
    const safeView = (view === 'import' || view === 'klas' || view === 'detail')
      ? view
      : 'klas';
    setPrevView(safeView);
    setView('settings');
  }

  function handleToggleDark(next: boolean) {
    setIsDark(next);
  }

  function handleNormenChanged() {
    setRefreshKey(k => k + 1);
  }

  function handleBackFromSettings() {
    setView(prevView);
  }

  function handleOpenHelp() {
    // CR-02: guard against non-content views (settings/onboarding/help) being stored as prevView
    const safeView = (view === 'import' || view === 'klas' || view === 'detail')
      ? view
      : 'klas';
    setPrevView(safeView);
    setView('help');
  }

  function handleBackFromHelp() {
    setView(prevView);
  }

  function handleNavigateToImportFromSettings() {
    setView('import');
  }

  async function handleKlasSwitch(id: string) {
    await switchActiveKlas(id);
    setRefreshKey(k => k + 1);
    const hasStudents = getActiveStudents().length > 0;
    setView(hasStudents ? 'klas' : 'import');
  }

  function handleStudentSelect(id: string, orderedList: string[]) {
    setActiveStudentId(id);
    setDetailStudentList(orderedList);
    setView('detail');
  }

  function handleBack() {
    setView('klas');
    setActiveStudentId(null);
  }

  async function handleKlasCreated(klasId: string) {
    await switchActiveKlas(klasId);
    setRefreshKey(k => k + 1);
    setView('klas');
    setShowModal(false);
  }

  function handleDeleteKlas(klasId: string): void {
    const klas = klassenState.klassen[klasId];
    const naam = klas?.naam ?? klasId;
    const count = countUniekeLeerlingen(klas?.students);
    setShowDeleteModal({ klasId, naam, count });
  }

  async function handleConfirmDeleteKlas(): Promise<void> {
    if (!showDeleteModal) return;
    const { klasId } = showDeleteModal;
    const wasActive = klasId === klassenState.activeKlasId;
    await deleteKlas(klasId);
    setShowDeleteModal(null);
    setRefreshKey(k => k + 1);
    if (Object.keys(klassenState.klassen).length === 0) {
      setView('import');
    } else if (wasActive && (view === 'klas' || view === 'detail')) {
      setView('klas');
    }
  }

  async function handleRenameKlas(klasId: string, newNaam: string): Promise<void> {
    await renameKlas(klasId, newNaam);
    setRefreshKey(k => k + 1);
  }

  async function handleOnboardingComplete(klasId: string) {
    try { await saveOnboardingCompleted(); } catch { /* Tauri niet beschikbaar in browser */ }
    try { await switchActiveKlas(klasId); } catch { /* Tauri niet beschikbaar in browser */ }
    setRefreshKey(k => k + 1);
    setView('klas');
  }

  return (
    <>
      <div id="storage-error-banner" style={{ display: 'none' }} />
      <KlasTabStrip
        klassen={Object.values(klassenState.klassen).map((klas: any) => ({
          id: klas.id,
          naam: klas.naam,
        }))}
        activeKlasId={klassenState.activeKlasId}
        onSwitch={handleKlasSwitch}
        onCreateKlas={() => setShowModal(true)}
        onSettings={handleOpenSettings}
        onFeedback={handleFeedback}
        onDeleteKlas={handleDeleteKlas}
        onRenameKlas={handleRenameKlas}
        isSettingsActive={view === 'settings'}
        isDark={isDark}
        onHelp={handleOpenHelp}
        isHelpActive={view === 'help'}
      />
      {showModal && (
        <KlasModal
          onCreated={handleKlasCreated}
          onCancel={() => setShowModal(false)}
        />
      )}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      {showDeleteModal && (
        <KlasVerwijderenModal
          klasNaam={showDeleteModal.naam}
          leerlingCount={showDeleteModal.count}
          onConfirm={handleConfirmDeleteKlas}
          onCancel={() => setShowDeleteModal(null)}
        />
      )}
      {view === 'import' && (
        <ImportPage onImportComplete={handleImportComplete} />
      )}
      {view === 'klas' && (
        <KlasOverzicht
          refreshKey={refreshKey}
          onSelectStudent={handleStudentSelect}
        />
      )}
      {view === 'detail' && activeStudentId && (
        <DetailWeergave
          leerlingId={activeStudentId}
          prevId={detailStudentList[detailStudentList.indexOf(activeStudentId) - 1] ?? null}
          nextId={detailStudentList[detailStudentList.indexOf(activeStudentId) + 1] ?? null}
          onNavigate={setActiveStudentId}
          onBack={handleBack}
        />
      )}
      {view === 'settings' && (
        <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
          <SettingsPage
            key={settingsOpenCount}
            onBack={handleBackFromSettings}
            onNavigateToImport={handleNavigateToImportFromSettings}
            isDark={isDark}
            onToggleDark={handleToggleDark}
            onNormenChanged={handleNormenChanged}
          />
        </div>
      )}
      {view === 'help' && (
        <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
          <HelpPage onBack={handleBackFromHelp} />
        </div>
      )}
      {view === 'onboarding' && (
        <OnboardingWizard onComplete={handleOnboardingComplete} onAbort={() => setView('import')} />
      )}
    </>
  );
}

export default App;
