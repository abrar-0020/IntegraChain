import { useState, useEffect } from 'react';
import { getNetworkStatus } from '../lib/eth';

export default function NetworkStatus() {
  const [status, setStatus] = useState<{
    blockNumber: number;
    gasPrice: string;
    chainId: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const networkStatus = await getNetworkStatus();
      setStatus(networkStatus);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load network status:', error);
      setIsLoading(false);
    }
  };

  if (isLoading || !status) {
    return null;
  }

  return (
    <div className="network-status">
      <div className="network-status-item">
        <span className="network-status-label">Block:</span>
        <span className="network-status-value">{status.blockNumber}</span>
      </div>
      <div className="network-status-item">
        <span className="network-status-label">Gas:</span>
        <span className="network-status-value">{status.gasPrice}</span>
      </div>
      <div className="network-status-item">
        <span className="network-status-label">Chain ID:</span>
        <span className="network-status-value">{status.chainId}</span>
      </div>
    </div>
  );
}
