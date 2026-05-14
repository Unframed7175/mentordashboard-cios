import React, { useEffect } from 'react';
import ImportPage from './components/ImportPage';

function App() {
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

  return (
    <>
      <div id="storage-error-banner" style={{ display: 'none' }} />
      <ImportPage />
    </>
  );
}

export default App;
