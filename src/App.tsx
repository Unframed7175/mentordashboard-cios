import React, { useEffect, useState } from 'react';
import ImportPage from './components/ImportPage';
import KlasTabStrip from './components/KlasTabStrip';
import KlasModal from './components/KlasModal';
import { klassenState, switchActiveKlas, getActiveStudents } from '../utils/klassen';

function App() {
  const [view, setView] = useState<'import' | 'klas' | 'detail'>('import');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [detailStudentList, setDetailStudentList] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

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

  return (
    <>
      <div id="storage-error-banner" style={{ display: 'none' }} />
      {Object.keys(klassenState.klassen).length > 0 && (
        <KlasTabStrip
          activeKlasId={klassenState.activeKlasId}
          onSwitch={handleKlasSwitch}
          onCreateKlas={() => setShowModal(true)}
        />
      )}
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
        <div>{/* KlasOverzicht goes here — Wave 2 */}</div>
      )}
      {view === 'detail' && (
        <div>{/* DetailWeergave goes here — Wave 2 */}</div>
      )}
    </>
  );
}

export default App;
