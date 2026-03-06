import RecordsPanel from '../components/RecordsPanel';
import type { WalletProps } from '../App';

interface RegistrationPageProps extends WalletProps {
  refreshTrigger: number;
}

export default function RegistrationPage({
  walletConnected,
  chainId,
  addToast,
  refreshTrigger,
  requiredChainId,
}: RegistrationPageProps) {
  const isReady = walletConnected && chainId === requiredChainId;

  return (
    <section className="site-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">On-Chain Records</span>
          <h2 className="section-title">Registration History</h2>
          <p className="section-description">
            Browse, search, and export all file hash registrations recorded on the blockchain.
          </p>
        </div>
        {isReady ? (
          <RecordsPanel refreshTrigger={refreshTrigger} onToast={addToast} />
        ) : (
          <div className="card section-locked">
            <p>Connect your wallet to view registration records.</p>
          </div>
        )}
      </div>
    </section>
  );
}
