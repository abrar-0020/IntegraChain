import { useNavigate } from 'react-router-dom';
import RegisterPanel from '../components/RegisterPanel';
import type { WalletProps } from '../App';

interface HomePageProps extends WalletProps {
  triggerRefresh: () => void;
}

export default function HomePage({
  walletConnected,
  chainId,
  addToast,
  onConnect,
  triggerRefresh,
  requiredChainId,
}: HomePageProps) {
  const navigate = useNavigate();

  return (
    <section className="site-section">
      <div className="section-container">
        <div className="hero">
          <div className="hero-badge">Blockchain-Powered Integrity</div>
          <h1 className="hero-title">
            Secure Your Files with{' '}
            <span className="hero-accent">Immutable</span> Blockchain Records
          </h1>
          <p className="hero-subtitle">
            IntegraChain lets you register and verify file integrity using the Ethereum
            blockchain. Every hash is permanently recorded on-chain — tamper-proof and
            publicly auditable.
          </p>
          {!walletConnected && (
            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={onConnect}>
                Connect Wallet to Get Started
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/about')}>
                Learn More
              </button>
            </div>
          )}
        </div>

        {!walletConnected ? (
          <div className="connect-banner card">
            <div className="connect-banner-icon">🔐</div>
            <h2>Connect Your Wallet</h2>
            <p>Connect your MetaMask wallet to register files on the blockchain.</p>
            <button className="btn btn-primary" onClick={onConnect}>
              Connect MetaMask
            </button>
          </div>
        ) : chainId !== requiredChainId ? (
          <div className="connect-banner card error-banner">
            <div className="connect-banner-icon">⚠️</div>
            <h2 style={{ color: 'var(--error)' }}>Wrong Network</h2>
            <p>
              Please switch to{' '}
              {requiredChainId === 11155111 ? 'Sepolia testnet' : `chain ${requiredChainId}`} in MetaMask.
            </p>
            <p className="text-muted">
              Current: {chainId} — Required: {requiredChainId}
            </p>
          </div>
        ) : (
          <div className="register-wrapper">
            <RegisterPanel onSuccess={triggerRefresh} onToast={addToast} />
          </div>
        )}
      </div>
    </section>
  );
}
