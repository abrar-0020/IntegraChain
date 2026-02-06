import { useState, useEffect } from 'react';
import { getRecentEvents, formatTimestamp, revokeHash } from '../lib/eth';
import { truncateHash, truncateAddress } from '../lib/hash';
import { exportAsCSV, exportAsJSON } from '../lib/certificate';

interface RecordsPanelProps {
  refreshTrigger: number;
  onToast?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
}

export default function RecordsPanel({ refreshTrigger, onToast }: RecordsPanelProps) {
  const [events, setEvents] = useState<Array<{
    owner: string;
    hash: string;
    timestamp: number;
    note: string;
    blockNumber: number;
  }>>([]);
  const [filteredEvents, setFilteredEvents] = useState<typeof events>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'mine'>('all');
  const [currentAddress, setCurrentAddress] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    loadEvents();
    getCurrentAddress();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterBy, events, currentAddress, sortBy]);

  const getCurrentAddress = async () => {
    try {
      const provider = (await import('../lib/eth')).getProvider();
      if (provider) {
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setCurrentAddress(addr.toLowerCase());
      }
    } catch (error) {
      console.error('Failed to get address:', error);
    }
  };

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const recentEvents = await getRecentEvents(50);
      setEvents(recentEvents);
      setFilteredEvents(recentEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.note.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBy === 'mine') {
      filtered = filtered.filter(e => e.owner.toLowerCase() === currentAddress);
    }

    if (sortBy === 'oldest') {
      filtered.sort((a, b) => a.blockNumber - b.blockNumber);
    } else {
      filtered.sort((a, b) => b.blockNumber - a.blockNumber);
    }

    setFilteredEvents(filtered);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      exportAsCSV(filteredEvents);
    } else {
      exportAsJSON(filteredEvents);
    }
    if (onToast) {
      onToast('success', 'Exported', `Records exported as ${format.toUpperCase()}`);
    }
  };

  const handleRevoke = async (hash: string) => {
    if (!onToast) return;
    
    try {
      await revokeHash(hash);
      onToast('success', 'Revoked', 'Hash has been revoked successfully');
      loadEvents();
    } catch (error: any) {
      if (error.message.includes('user rejected')) {
        onToast('warning', 'Cancelled', 'Revocation was cancelled');
      } else {
        onToast('error', 'Revoke Failed', error.message || 'Failed to revoke hash');
      }
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    if (onToast) {
      onToast('success', 'Copied', 'Hash copied to clipboard');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: 0 }}>Recent Registrations</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => handleExport('csv')} disabled={filteredEvents.length === 0} style={{ padding: '0.5rem 0.75rem' }}>
            CSV
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('json')} disabled={filteredEvents.length === 0} style={{ padding: '0.5rem 0.75rem' }}>
            JSON
          </button>
        </div>
      </div>
      <p className="card-description">
        Search, filter, and export registered file hashes
      </p>

      <div style={{ display: 'flex',gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input"
          placeholder="Search by hash, owner, or note..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select 
          className="input" 
          value={filterBy} 
          onChange={(e) => setFilterBy(e.target.value as 'all' | 'mine')}
          style={{ width: 'auto' }}
        >
          <option value="all">All Records</option>
          <option value="mine">My Records</option>
        </select>
        <select 
          className="input" 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
          style={{ width: 'auto' }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <span className="loading"></span>
          Loading records...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          {events.length === 0 ? 'No registrations found. Register a file to see it here.' : 'No records match your filters.'}
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Showing {filteredEvents.length} of {events.length} records
          </div>
          <div className="records-list">
            {filteredEvents.map((event, index) => (
              <div key={`${event.blockNumber}-${index}`} className="record-item">
                <div className="record-header">
                  <div className="record-hash">
                    {truncateHash(event.hash, 16, 16)}
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => copyHash(event.hash)}
                    title="Copy full hash"
                  >
                    Copy
                  </button>
                </div>
                <div className="record-meta">
                  <span>
                    <strong>Owner:</strong> {truncateAddress(event.owner)}
                    {event.owner.toLowerCase() === currentAddress && ' (You)'}
                  </span>
                  <span>
                    <strong>Time:</strong> {formatTimestamp(event.timestamp)}
                  </span>
                  <span>
                    <strong>Block:</strong> {event.blockNumber}
                  </span>
                </div>
                {event.note && <div className="record-note">"{event.note}"</div>}
                {event.owner.toLowerCase() === currentAddress && (
                  <button 
                    className="btn-revoke"
                    onClick={() => handleRevoke(event.hash)}
                    title="Revoke this hash"
                    style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
