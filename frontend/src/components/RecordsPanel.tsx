import { useState, useEffect } from 'react';
import { getRecentEvents, formatTimestamp } from '../lib/eth';
import { truncateHash, truncateAddress } from '../lib/hash';

interface RecordsPanelProps {
  refreshTrigger: number;
}

export default function RecordsPanel({ refreshTrigger }: RecordsPanelProps) {
  const [events, setEvents] = useState<Array<{
    owner: string;
    hash: string;
    timestamp: number;
    note: string;
    blockNumber: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const recentEvents = await getRecentEvents(10);
      setEvents(recentEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  return (
    <div className="card">
      <h2 className="card-title">Recent Registrations</h2>
      <p className="card-description">
        Latest file hashes registered on the blockchain
      </p>

      {isLoading ? (
        <div className="empty-state">
          <span className="loading"></span>
          Loading records...
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          No registrations found. Register a file to see it here.
        </div>
      ) : (
        <div className="records-list">
          {events.map((event, index) => (
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
                  📋
                </button>
              </div>
              <div className="record-meta">
                <span>
                  <strong>Owner:</strong> {truncateAddress(event.owner)}
                </span>
                <span>
                  <strong>Time:</strong> {formatTimestamp(event.timestamp)}
                </span>
                <span>
                  <strong>Block:</strong> {event.blockNumber}
                </span>
              </div>
              {event.note && <div className="record-note">"{event.note}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
