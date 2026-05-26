import React, { useEffect, useState } from 'react';
import ImportPage from './components/ImportPage';
import KlasTabStrip from './components/KlasTabStrip';
import KlasModal from './components/KlasModal';
import KlasOverzicht from './components/KlasOverzicht';
import DetailWeergave from './components/DetailWeergave';
import SettingsPage from './components/SettingsPage';
import OnboardingWizard from './components/OnboardingWizard';
import { klassenState, switchActiveKlas, getActiveStudents, saveOnboardingCompleted, deleteKlas, renameKlas } from '../utils/klassen';
import { loadSettings, applyTheme } from '../utils/settings';

function App() {
  const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings' | 'onboarding'>(
    () => (klassenState.onboardingCompleted || Object.values(klassenState.klassen).some((k: any) => k.students?.length > 0))
      ? 'import' : 'onboarding'
  );
  const [prevView, setPrevView] = useState<'import' | 'klas' | 'detail'>('klas');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [detailStudentList, setDetailStudentList] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
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

  function handleOpenSettings() {
    setSettingsOpenCount(c => c + 1);
    setPrevView(view as 'import' | 'klas' | 'detail');
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

  async function handleDeleteKlas(klasId: string): Promise<void> {
    const confirmed = window.confirm(
      `Klas '${klassenState.klassen[klasId]?.naam ?? klasId}' verwijderen? Dit kan niet ongedaan worden gemaakt.`
    );
    if (!confirmed) return;
    await deleteKlas(klasId);
    setRefreshKey(k => k + 1);
  }

  async function handleRenameKlas(klasId: string, newNaam: string): Promise<void> {
    await renameKlas(klasId, newNaam);
    setRefreshKey(k => k + 1);
  }

  async function handleOnboardingComplete(klasId: string) {
    await saveOnboardingCompleted();
    await switchActiveKlas(klasId);
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
          canDelete: (klas.students?.length ?? 1) === 0,
        }))}
        activeKlasId={klassenState.activeKlasId}
        onSwitch={handleKlasSwitch}
        onCreateKlas={() => setShowModal(true)}
        onSettings={handleOpenSettings}
        onDeleteKlas={handleDeleteKlas}
        onRenameKlas={handleRenameKlas}
        isSettingsActive={view === 'settings'}
        isDark={isDark}
      />
      {showModal && (
        <KlasModal
          onCreated={handleKlasCreated}
          onCancel={() => setShowModal(false)}
        />
      )}
      {view === 'import' && (
        <ImportPage onImportComplete={handleImportComplete} />
      )}
      {view === 'klas' && (
        <KlasOverzicht
          refreshKey={refreshKey}
          onSelectStudent={handleStudentSelect}
          onKlasDeleted={handleBack}
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
      {view === 'onboarding' && (
        <OnboardingWizard onComplete={handleOnboardingComplete} onAbort={() => setView('import')} />
      )}
    </>
  );
}

export default App;
