import { useState } from 'react';
import { computeFileHash, hexToBytes32, truncateHash } from '../lib/hash';
import { registerHash, isHashRegistered } from '../lib/eth';
import { formatFileSize, isFileSizeLarge, isFileSizeVeryLarge } from '../lib/certificate';
import type { ToastMessage } from '../App';

interface RegisterPanelProps {
  onSuccess: () => void;
  onToast: (type: ToastMessage['type'], title: string, message: string) => void;
}

export default function RegisterPanel({ onSuccess, onToast }: RegisterPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hashHex, setHashHex] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [hashingProgress, setHashingProgress] = useState(0);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setHashHex('');
    setIsDuplicate(false);
    setHashingProgress(0);
    
    // File size warnings
    if (isFileSizeVeryLarge(selectedFile.size)) {
      onToast('warning', 'Very Large File', 'File is over 500MB. Hashing may take a while.');
    } else if (isFileSizeLarge(selectedFile.size)) {
      onToast('warning', 'Large File', 'File is over 100MB. Hashing may take some time.');
    }

    setIsHashing(true);

    try {
      // Simulate progress for large files
      const progressInterval = setInterval(() => {
        setHashingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const hash = await computeFileHash(selectedFile);
      
      clearInterval(progressInterval);
      setHashingProgress(100);
      setHashHex(hash);

      // Check for duplicates
      const bytes32Hash = hexToBytes32(hash);
      const alreadyRegistered = await isHashRegistered(bytes32Hash);
      if (alreadyRegistered) {
        setIsDuplicate(true);
        onToast('warning', 'Duplicate Detected', 'This file hash is already registered on the blockchain');
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
    await processFile(selectedFile);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRegister = async () => {
    if (!hashHex) return;

    if (isDuplicate) {
      onToast('error', 'Cannot Register', 'This hash is already registered. Registration cancelled.');
      return;
    }

    setIsRegistering(true);

    try {
      const bytes32Hash = hexToBytes32(hashHex);
      const txHash = await registerHash(bytes32Hash, note);
      onToast('success', 'Registered', `File hash registered successfully`);
      
      // Reset form
      setFile(null);
      setHashHex('');
      setNote('');
      setIsDuplicate(false);
      const fileInput = document.getElementById('register-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      onSuccess();
    } catch (error: any) {
      if (error.message.includes('user rejected')) {
        onToast('warning', 'Cancelled', 'Transaction was cancelled');
      } else if (error.message.includes('already registered')) {
        onToast('error', 'Already Registered', 'This file hash is already registered');
      } else {
        onToast('error', 'Registration Failed', error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(hashHex);
    onToast('success', 'Copied', 'Hash copied to clipboard');
  };

  const getFullHash = () => {
    return hashHex.startsWith('0x') ? hashHex : '0x' + hashHex;
  };

  return (
    <div className="card">
      <h2 className="card-title">Register File</h2>
      <p className="card-description">
        Choose a file or drag & drop to compute its SHA-256 hash and register it on the blockchain
      </p>

      <div className="form-group">
        <label className="form-label">Select File</label>
        <div
          className={`file-dropzone ${isDragActive ? 'active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="register-file-input"
            onChange={handleFileChange}
            disabled={isRegistering || isHashing}
            style={{ display: 'none' }}
          />
          <label htmlFor="register-file-input" className="file-dropzone-label">
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
                <span>Drag & drop file here or click to browse</span>
              </div>
            )}
          </label>
        </div>
        
        {file && (
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

      {hashHex && (
        <div className="hash-display">
          <div className="hash-label">SHA-256 Hash {isDuplicate && <span className="duplicate-badge">DUPLICATE</span>}</div>
          <div className="hash-value">
            <span title={getFullHash()}>{truncateHash(hashHex, 16, 16)}</span>
            <button className="copy-btn" onClick={copyHash} title="Copy full hash">
              Copy
            </button>
          </div>
          <div className="hash-full" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', wordBreak: 'break-all' }}>
            {getFullHash()}
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Note / Label (optional)</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Contract v1.0, Report Q4 2025"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
          disabled={isRegistering}
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {note.length}/80 characters
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleRegister}
        disabled={!hashHex || isRegistering || isHashing || isDuplicate}
        style={{ width: '100%' }}
      >
        {isRegistering ? (
          <>
            <span className="loading"></span>
            Registering...
          </>
        ) : isDuplicate ? (
          'Cannot Register Duplicate'
        ) : (
          'Register on Blockchain'
        )}
      </button>
    </div>
  );
}
