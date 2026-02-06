/**
 * Generate and download verification certificate as JSON
 */
export function downloadCertificate(data: {
  hash: string;
  owner: string;
  timestamp: string;
  note: string;
  fileName: string;
  verifiedAt: string;
}) {
  const certificate = {
    title: 'IntegraChain Verification Certificate',
    hash: data.hash,
    fileName: data.fileName,
    owner: data.owner,
    registeredAt: data.timestamp,
    verifiedAt: data.verifiedAt,
    note: data.note || 'N/A',
    status: 'VERIFIED - File Unchanged',
    blockchain: 'Ethereum (Localhost)',
    generatedBy: 'IntegraChain dApp',
  };

  const blob = new Blob([JSON.stringify(certificate, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `verification-certificate-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export records as CSV
 */
export function exportAsCSV(records: Array<{
  hash: string;
  owner: string;
  timestamp: number;
  note: string;
  blockNumber: number;
}>) {
  const headers = ['Hash', 'Owner', 'Timestamp', 'Note', 'Block Number'];
  const rows = records.map(r => [
    r.hash,
    r.owner,
    new Date(r.timestamp * 1000).toLocaleString(),
    r.note || '',
    r.blockNumber.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `integrachain-records-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export records as JSON
 */
export function exportAsJSON(records: Array<{
  hash: string;
  owner: string;
  timestamp: number;
  note: string;
  blockNumber: number;
}>) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalRecords: records.length,
    records: records.map(r => ({
      ...r,
      timestampISO: new Date(r.timestamp * 1000).toISOString(),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `integrachain-records-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file size is too large (warn above 100MB)
 */
export function isFileSizeLarge(bytes: number): boolean {
  return bytes > 100 * 1024 * 1024; // 100MB
}

/**
 * Check if file size is extremely large (warn above 500MB)
 */
export function isFileSizeVeryLarge(bytes: number): boolean {
  return bytes > 500 * 1024 * 1024; // 500MB
}
