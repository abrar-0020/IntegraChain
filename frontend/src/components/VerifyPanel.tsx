import { useState } from 'react';
import { computeFileHash, hexToBytes32, truncateHash, truncateAddress } from '../lib/hash';
import { getRecord, formatTimestamp, getProvider } from '../lib/eth';
import type { ToastMessage } from '../App';

interface VerifyPanelProps {
  onToast: (type: ToastMessage['type'], title: string, message: string) => void;
}

export default function VerifyPanel({ onToast }: VerifyPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hashHex, setHashHex] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    exists: boolean;
    owner: string;
    timestamp: string;
    note: string;
    isOwner: boolean;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setHashHex('');
    setVerifyResult(null);
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
        });
        onToast('success', 'Match Found', 'File hash exists on blockchain');
      } else {
        setVerifyResult({
          exists: false,
          owner: '',
          timestamp: '',
          note: '',
          isOwner: false,
        });
        onToast('warning', 'No Record', 'This file hash is not registered');
      }
    } catch (error: any) {
      onToast('error', 'Verification Failed', error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(hashHex);
    onToast('success', 'Copied', 'Hash copied to clipboard');
  };

  return (
    <div className="card">
      <h2 className="card-title">Verify File</h2>
      <p className="card-description">
        Choose a file to verify if its hash is registered on the blockchain
      </p>

      <div className="form-group">
        <label className="form-label">Select File</label>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="verify-file-input"
            onChange={handleFileChange}
            disabled={isVerifying}
          />
          <label htmlFor="verify-file-input" className="file-input-label">
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

      {verifyResult && (
        <div className={`verify-result ${verifyResult.exists ? 'success' : 'error'}`}>
          <div className="verify-result-title">
            {verifyResult.exists ? '✓ FILE UNCHANGED' : '✗ NO RECORD'}
          </div>
          {verifyResult.exists && (
            <>
              <div className="verify-result-detail" style={{ marginBottom: '0.5rem' }}>
                Hash matches blockchain record - file integrity verified
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
            </>
          )}
          {!verifyResult.exists && (
            <>
              <div className="verify-result-detail">
                This file hash has not been registered on the blockchain
              </div>
              <div className="verify-result-detail" style={{ marginTop: '0.5rem', color: '#ff6b6b' }}>
                ⚠️ File might have been tampered with or was never registered
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
