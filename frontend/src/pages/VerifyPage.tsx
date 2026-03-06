import VerifyPanel from '../components/VerifyPanel';
import type { WalletProps } from '../App';

export default function VerifyPage({ walletConnected, chainId, addToast, requiredChainId }: WalletProps) {
  const isReady = walletConnected && chainId === requiredChainId;

  return (
    <section className="site-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">Verification</span>
          <h2 className="section-title">Verify File Integrity</h2>
          <p className="section-description">
            Upload any file to check if its hash has been registered on the blockchain.
            Instantly confirm authenticity and view ownership details.
          </p>
        </div>
        {isReady ? (
          <VerifyPanel onToast={addToast} />
        ) : (
          <div className="card section-locked">
            <p>Connect your wallet and switch to the correct network to verify files.</p>
          </div>
        )}
      </div>
    </section>
  );
}
