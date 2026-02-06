import { useState } from 'react';
import { computeFileHash, hexToBytes32, truncateHash, truncateAddress } from '../lib/hash';
import { getRecord, formatTimestamp, getProvider } from '../lib/eth';
import { downloadCertificate, formatFileSize, isFileSizeLarge, isFileSizeVeryLarge } from '../lib/certificate';
import type { ToastMessage } from '../App';

interface VerifyPanelProps {
  onToast: (type: ToastMessage['type'], title: string, message: string) => void;
}

interface BulkVerifyResult {
  fileName: string;
  hash: string;
  exists: boolean;
  owner?: string;
  timestamp?: string;
  note?: string;
  revoked?: boolean;
}

export default function VerifyPanel({ onToast }: VerifyPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hashHex, setHashHex] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [hashingProgress, setHashingProgress] = useState(0);
  const [verifyResult, setVerifyResult] = useState<{
    exists: boolean;
    owner: string;
    timestamp: string;
    note: string;
    isOwner: boolean;
    revoked: boolean;
  } | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkVerifyResult[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [secondFile, setSecondFile] = useState<File | null>(null);
  const [secondHash, setSecondHash] = useState<string>('');

  const processFile = async (selectedFile: File, isSecond = false) => {
    if (!isSecond) {
      setFile(selectedFile);
      setHashHex('');
      setVerifyResult(null);
    } else {
      setSecondFile(selectedFile);
      setSecondHash('');
    }
    
    setHashingProgress(0);
    
    // File size warnings
    if (isFileSizeVeryLarge(selectedFile.size)) {
      onToast('warning', 'Very Large File', 'File is over 500MB. Hashing may take a while.');
    } else if (isFileSizeLarge(selectedFile.size)) {
      onToast('warning', 'Large File', 'File is over 100MB. Hashing may take some time.');
    }

    setIsHashing(true);

    try {
      const progressInterval = setInterval(() => {
        setHashingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const hash = await computeFileHash(selectedFile);
      
      clearInterval(progressInterval);
      setHashingProgress(100);
      
      if (!isSecond) {
        setHashHex(hash);
      } else {
        setSecondHash(hash);
      }
    } catch (error: any) {
      onToast('error', 'Hashing Failed', error.message);
    } finally {
      setIsHashing(false);
      setTimeout(() => setHashingProgress(0), 1000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile, false);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (bulkMode && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleBulkVerify(Array.from(e.dataTransfer.files));
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0], false);
    }
  };

  const handleBulkVerify = async (files: File[]) => {
    setBulkResults([]);
    setIsVerifying(true);

    const results: BulkVerifyResult[] = [];

    for (const f of files) {
      try {
        const hash = await computeFileHash(f);
        const bytes32Hash = hexToBytes32(hash);
        const record = await getRecord(bytes32Hash);

        results.push({
          fileName: f.name,
          hash,
          exists: record.exists,
          owner: record.owner,
          timestamp: record.exists ? formatTimestamp(Number(record.timestamp)) : undefined,
          note: record.note,
          revoked: record.revoked,
        });
      } catch (error) {
        results.push({
          fileName: f.name,
          hash: 'Error computing hash',
          exists: false,
        });
      }
    }

    setBulkResults(results);
    setIsVerifying(false);
    onToast('success', 'Bulk Verification Complete', `Verified ${files.length} files`);
  };

  const handleVerify = async () => {
    if (!hashHex) return;

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const bytes32Hash = hexToBytes32(hashHex);
      const record = await getRecord(bytes32Hash);

      if (record.exists) {
        const provider = getProvider();
        const signer = await provider!.getSigner();
        const currentAddress = await signer.getAddress();
        
        setVerifyResult({
          exists: true,
          owner: record.owner,
          timestamp: formatTimestamp(Number(record.timestamp)),
          note: record.note,
          isOwner: record.owner.toLowerCase() === currentAddress.toLowerCase(),
          revoked: record.revoked,
        });
        if (record.revoked) {
          onToast('warning', 'Hash Revoked', 'This hash was registered but has been revoked by owner');
        } else {
          onToast('success', 'Match Found', 'File hash exists on blockchain');
        }
      } else {
        setVerifyResult({
          exists: false,
          owner: '',
          timestamp: '',
          note: '',
          isOwner: false,
          revoked: false,
        });
        onToast('warning', 'No Record', 'This file hash is not registered');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'An unexpected error occurred';
      onToast('error', 'Verification Failed', errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!verifyResult?.exists || !file) return;

    downloadCertificate({
      hash: hashHex.startsWith('0x') ? hashHex : '0x' + hashHex,
      owner: verifyResult.owner,
      timestamp: verifyResult.timestamp,
      note: verifyResult.note,
      fileName: file.name,
      verifiedAt: new Date().toLocaleString(),
    });

    onToast('success', 'Downloaded', 'Verification certificate downloaded');
  };

  const handleCompare = () => {
    if (!hashHex || !secondHash) return;

    if (hashHex === secondHash) {
      onToast('success', 'Files Match', 'Both files have identical hashes');
    } else {
      onToast('error', 'Files Different', 'Files have different hashes - not the same file');
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(hashHex);
    onToast('success', 'Copied', 'Hash copied to clipboard');
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: 0 }}>Verify File</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn-mode ${bulkMode ? 'active' : ''}`}
            onClick={() => setBulkMode(!bulkMode)}
            title="Bulk verify multiple files"
          >
            Bulk
          </button>
          <button 
            className={`btn-mode ${compareMode ? 'active' : ''}`}
            onClick={() => setCompareMode(!compareMode)}
            title="Compare two files"
          >
            Compare
          </button>
        </div>
      </div>
      <p className="card-description">
        {bulkMode ? 'Drag & drop multiple files or click to browse' : compareMode ? 'Compare two files to check if they are identical' : 'Choose a file to verify if its hash is registered on the blockchain'}
      </p>

      {!compareMode && (
        <>
          <div className="form-group">
            <label className="form-label">Select File{bulkMode ? 's' : ''}</label>
            <div
              className={`file-dropzone ${isDragActive ? 'active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="verify-file-input"
                onChange={handleFileChange}
                disabled={isVerifying || isHashing}
                multiple={bulkMode}
                style={{ display: 'none' }}
              />
              <label htmlFor="verify-file-input" className="file-dropzone-label">
                {isHashing ? (
                  <div className="dropzone-content">
                    <span className="loading"></span>
                    <span>Computing hash... {hashingProgress}%</span>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Drag & drop file{bulkMode ? 's' : ''} here or click to browse</span>
                  </div>
                )}
              </label>
            </div>
            
            {file && !bulkMode && (
              <div className="file-metadata">
                <div className="file-name">{file.name}</div>
                <div className="file-info">
                  <span>Size: {formatFileSize(file.size)}</span>
                  <span>Type: {file.type || 'Unknown'}</span>
                  <span>Modified: {new Date(file.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {hashHex && !bulkMode && (
            <div className="hash-display">
              <div className="hash-label">SHA-256 Hash</div>
              <div className="hash-value">
                <span title={hashHex.startsWith('0x') ? hashHex : '0x' + hashHex}>{truncateHash(hashHex, 16, 16)}</span>
                <button className="copy-btn" onClick={copyHash} title="Copy full hash">
                  Copy
                </button>
              </div>
            </div>
          )}

          {!bulkMode && (
            <button
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={!hashHex || isVerifying || isHashing}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {isVerifying ? (
                <>
                  <span className="loading"></span>
                  Verifying...
                </>
              ) : (
                'Verify Integrity'
              )}
            </button>
          )}

          {verifyResult && !bulkMode && (
            <div className={`verify-result ${verifyResult.exists && !verifyResult.revoked ? 'success' : 'error'}`}>
              <div className="verify-result-title">
                {verifyResult.exists && !verifyResult.revoked ? 'FILE UNCHANGED' : verifyResult.revoked ? 'HASH REVOKED' : 'NO RECORD'}
              </div>
              {verifyResult.exists && (
                <>
                  <div className="verify-result-detail" style={{ marginBottom: '0.5rem' }}>
                    {verifyResult.revoked ? 'Hash was registered but has been revoked by owner' : 'Hash matches blockchain record - file integrity verified'}
                  </div>
                  <div className="verify-result-detail">
                    <strong>Owner:</strong> {truncateAddress(verifyResult.owner)}
                    {verifyResult.isOwner && ' (You)'}
                  </div>
                  <div className="verify-result-detail">
                    <strong>Registered:</strong> {verifyResult.timestamp}
                  </div>
                  {verifyResult.note && (
                    <div className="verify-result-detail">
                      <strong>Note:</strong> {verifyResult.note}
                    </div>
                  )}
                  {!verifyResult.revoked && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleDownloadCertificate}
                      style={{ width: '100%', marginTop: '0.75rem' }}
                    >
                      Download Certificate
                    </button>
                  )}
                </>
              )}
              {!verifyResult.exists && (
                <>
                  <div className="verify-result-detail">
                    This file hash has not been registered on the blockchain
                  </div>
                  <div className="verify-result-detail" style={{ marginTop: '0.5rem', color: '#ff6b6b' }}>
                    File might have been tampered with or was never registered
                  </div>
                </>
              )}
            </div>
          )}

          {bulkResults.length > 0 && bulkMode && (
            <div className="bulk-results">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Bulk Verification Results</h3>
              {bulkResults.map((result, idx) => (
                <div key={idx} className={`bulk-result-item ${result.exists && !result.revoked ? 'success' : 'error'}`}>
                  <div style={{ fontWeight: 500 }}>{result.fileName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {truncateHash(result.hash, 12, 12)}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {result.exists && !result.revoked ? 'VERIFIED' : result.revoked ? 'REVOKED' : 'NOT REGISTERED'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {compareMode && (
        <div className="compare-mode">
          <div className="compare-section">
            <label className="form-label">First File</label>
            <input type="file" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], false)} />
            {file && <div className="file-metadata"><div className="file-name">{file.name}</div></div>}
            {hashHex && <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{truncateHash(hashHex, 16, 16)}</div>}
          </div>
          
          <div className="compare-section">
            <label className="form-label">Second File</label>
            <input type="file" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], true)} />
            {secondFile && <div className="file-metadata"><div className="file-name">{secondFile.name}</div></div>}
            {secondHash && <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{truncateHash(secondHash, 16, 16)}</div>}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCompare}
            disabled={!hashHex || !secondHash}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Compare Files
          </button>
        </div>
      )}
    </div>
  );
}
