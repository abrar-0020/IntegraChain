import { truncateAddress } from '../lib/hash';

interface WalletStatusProps {
  connected: boolean;
  address: string;
  chainId: number | null;
  onConnect: () => void;
}

export default function WalletStatus({
  connected,
  address,
  chainId,
  onConnect,
}: WalletStatusProps) {
  if (!connected) {
    return (
      <button className="btn btn-primary" onClick={onConnect}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="wallet-status">
      <div className="wallet-info">
        <div className="wallet-label">Connected</div>
        <div className="wallet-address">{truncateAddress(address)}</div>
      </div>
      <div className={`status-badge ${chainId === 31337 ? 'connected' : 'disconnected'}`}>
        <span className="status-indicator"></span>
        {chainId === 31337 ? 'Localhost' : `Chain ${chainId}`}
      </div>
    </div>
  );
}
