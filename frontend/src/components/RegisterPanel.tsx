import { useState } from 'react';
import { computeFileHash, hexToBytes32, truncateHash } from '../lib/hash';
import { registerHash } from '../lib/eth';
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setHashHex('');
    setIsHashing(true);

    try {
      const hash = await computeFileHash(selectedFile);
      setHashHex(hash);
    } catch (error: any) {
      onToast('error', 'Hashing Failed', error.message);
    } finally {
      setIsHashing(false);
    }

    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handleRegister = async () => {
    if (!hashHex) return;

    setIsRegistering(true);

    try {
      const bytes32Hash = hexToBytes32(hashHex);
      const txHash = await registerHash(bytes32Hash, note);
      onToast('success', 'Registered', `File hash registered successfully`);
      
      // Reset form
      setFile(null);
      setHashHex('');
      setNote('');
      const fileInput = document.getElementById('register-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      onSuccess();
    } catch (error: any) {
      if (error.message.includes('user rejected')) {
        onToast('warning', 'Cancelled', 'Transaction was cancelled');
      } else if (error.message.includes('already registered')) {
        onToast('error', 'Already Registered', 'This file hash is already registered');
      } else {
        onToast('error', 'Registration Failed', error.message);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(hashHex);
    onToast('success', 'Copied', 'Hash copied to clipboard');
  };

  return (
    <div className="card">
      <h2 className="card-title">Register File</h2>
      <p className="card-description">
        Choose a file to compute its SHA-256 hash and register it on the blockchain
      </p>

      <div className="form-group">
        <label className="form-label">Select File</label>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="register-file-input"
            onChange={handleFileChange}
            disabled={isRegistering}
          />
          <label htmlFor="register-file-input" className="file-input-label">
            {isHashing ? 'Computing hash...' : 'Choose a file'}
          </label>
        </div>
        {file && <div className="file-name">📄 {file.name}</div>}
      </div>

      {hashHex && (
        <div className="hash-display">
          <div className="hash-label">SHA-256 Hash</div>
          <div className="hash-value">
            <span>{truncateHash(hashHex, 16, 16)}</span>
            <button className="copy-btn" onClick={copyHash} title="Copy full hash">
              📋
            </button>
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
        disabled={!hashHex || isRegistering || isHashing}
        style={{ width: '100%' }}
      >
        {isRegistering ? (
          <>
            <span className="loading"></span>
            Registering...
          </>
        ) : (
          'Register on Blockchain'
        )}
      </button>
    </div>
  );
}
