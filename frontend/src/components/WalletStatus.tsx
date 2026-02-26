import { truncateAddress } from '../lib/hash';
import { CHAIN_ID } from '../config/contract';

const NETWORK_NAMES: Record<number, string> = {
  31337: 'Localhost',
  11155111: 'Sepolia',
  1: 'Mainnet',
};

interface WalletStatusProps {
  connected: boolean;
  address: string;
  chainId: number | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletStatus({
  connected,
  address,
  chainId,
  onConnect,
  onDisconnect,
}: WalletStatusProps) {
  if (!connected) {
    return (
      <button className="btn btn-primary" onClick={onConnect}>
        Connect Wallet
      </button>
    );
  }

  const isCorrectNetwork = chainId === CHAIN_ID;
  const networkLabel = chainId ? (NETWORK_NAMES[chainId] ?? `Chain ${chainId}`) : 'Unknown';

  return (
    <div className="wallet-status">
      <div className="wallet-info">
        <div className="wallet-label">Connected</div>
        <div className="wallet-address">{truncateAddress(address)}</div>
      </div>
      <div className={`status-badge ${isCorrectNetwork ? 'connected' : 'disconnected'}`}>
        <span className="status-indicator"></span>
        {networkLabel}
      </div>
      <button className="btn btn-disconnect" onClick={onDisconnect} title="Disconnect wallet">
        Disconnect
      </button>
    </div>
  );
}
