import JSZip from 'jszip';

export async function extractPdfsFromZip(file: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const pdfFiles: File[] = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry.dir && path.toLowerCase().endsWith('.pdf')) {
      const blob = await entry.async('blob');
      const name = path.split('/').pop() ?? path;
      pdfFiles.push(new File([blob], name, { type: 'application/pdf' }));
    }
  }
  return pdfFiles;
}
