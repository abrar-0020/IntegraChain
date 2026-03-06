import { useState, useEffect } from 'react';
import WalletStatus from './components/WalletStatus';
import RegisterPanel from './components/RegisterPanel';
import VerifyPanel from './components/VerifyPanel';
import RecordsPanel from './components/RecordsPanel';
import NetworkStatus from './components/NetworkStatus';
import Toast from './components/Toast';
import { connectWallet, getProvider, getLiveChainId, switchToSepolia, isMetaMaskMobile } from './lib/eth';
import { CHAIN_ID } from './config/contract';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    setDarkMode(savedMode !== 'false');

    // In MetaMask mobile browser: auto-connect then auto-switch to Sepolia
    if (isMetaMaskMobile()) {
      autoConnectMobile();
    } else {
      checkConnection();
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // chainChanged fires with a hex chainId string on mobile MetaMask
      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      });
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const autoConnectMobile = async () => {
    try {
      // Step 1: request accounts — MetaMask shows one permission popup
      const result = await connectWallet();
      setAddress(result.address);
      setWalletConnected(true);

      // Step 2: if wrong network, switch to Sepolia — one more tap for user
      let currentChainId = result.chainId;
      if (currentChainId !== CHAIN_ID) {
        await switchToSepolia();
        currentChainId = await getLiveChainId();
      }
      setChainId(currentChainId);
    } catch (error: any) {
      // User rejected — fall back to manual connect flow
      checkConnection();
    }
  };

  const checkConnection = async () => {
    try {
      const provider = getProvider();
      if (!provider) return;
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        const chainId = await getLiveChainId();
        setAddress(addr);
        setChainId(chainId);
        setWalletConnected(true);
      }
    } catch (error) {
      console.error('Connection check failed:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletConnected(false);
      setAddress('');
      setChainId(null);
    } else {
      checkConnection();
    }
  };

  const handleConnect = async () => {
    try {
      const result = await connectWallet();
      setAddress(result.address);
      setChainId(result.chainId);
      setWalletConnected(true);
      addToast('success', 'Connected', 'Wallet connected successfully');
    } catch (error: any) {
      addToast('error', 'Connection Failed', error.message);
    }
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setAddress('');
    setChainId(null);
    addToast('success', 'Disconnected', 'Wallet disconnected');
  };

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const isReady = walletConnected && chainId === CHAIN_ID;

  return (
    <>
      {/* ── SITE HEADER ── */}
      <header className="site-header">
        <div className="nav-container">
          <button className="nav-logo" onClick={() => scrollTo('home')}>
            <span className="nav-logo-icon">⛓</span>
            <span className="nav-logo-text">IntegraChain</span>
          </button>

          <nav className={`nav-links${mobileMenuOpen ? ' nav-links--open' : ''}`}>
            <button className="nav-link" onClick={() => scrollTo('home')}>Home</button>
            <button className="nav-link" onClick={() => scrollTo('verify')}>Verify</button>
            <button className="nav-link" onClick={() => scrollTo('registration')}>Registration</button>
            <button className="nav-link" onClick={() => scrollTo('about')}>About</button>
          </nav>

          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀' : '☾'}
            </button>
            <WalletStatus
              connected={walletConnected}
              address={address}
              chainId={chainId}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {walletConnected && chainId === CHAIN_ID && <NetworkStatus />}
      </header>

      <main className="site-main">
        {/* ── HOME / REGISTER ── */}
        <section id="home" className="site-section">
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
                  <button className="btn btn-primary btn-lg" onClick={handleConnect}>
                    Connect Wallet to Get Started
                  </button>
                  <button className="btn btn-outline btn-lg" onClick={() => scrollTo('about')}>
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
                <button className="btn btn-primary" onClick={handleConnect}>
                  Connect MetaMask
                </button>
              </div>
            ) : chainId !== CHAIN_ID ? (
              <div className="connect-banner card error-banner">
                <div className="connect-banner-icon">⚠️</div>
                <h2 style={{ color: 'var(--error)' }}>Wrong Network</h2>
                <p>
                  Please switch to{' '}
                  {CHAIN_ID === 11155111 ? 'Sepolia testnet' : `chain ${CHAIN_ID}`} in MetaMask.
                </p>
                <p className="text-muted">
                  Current: {chainId} — Required: {CHAIN_ID}
                </p>
              </div>
            ) : (
              <div className="register-wrapper">
                <RegisterPanel onSuccess={triggerRefresh} onToast={addToast} />
              </div>
            )}
          </div>
        </section>

        {/* ── VERIFY ── */}
        <section id="verify" className="site-section section-alt">
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

        {/* ── REGISTRATION RECORDS ── */}
        <section id="registration" className="site-section">
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

        {/* ── ABOUT ── */}
        <section id="about" className="site-section section-alt">
          <div className="section-container">
            <div className="section-header">
              <span className="section-badge">About</span>
              <h2 className="section-title">How IntegraChain Works</h2>
              <p className="section-description">
                A decentralized file integrity registry built on Ethereum.
              </p>
            </div>
            <div className="about-grid">
              <div className="about-card card">
                <div className="about-card-icon">🔒</div>
                <h3>Register</h3>
                <p>
                  Upload any file and its SHA-256 hash is computed locally in your browser.
                  The hash — never the file itself — is stored on-chain via a smart contract.
                </p>
              </div>
              <div className="about-card card">
                <div className="about-card-icon">✅</div>
                <h3>Verify</h3>
                <p>
                  Upload a file at any time to regenerate its hash and check it against the
                  blockchain. Instantly know if a file is authentic and unmodified.
                </p>
              </div>
              <div className="about-card card">
                <div className="about-card-icon">🌐</div>
                <h3>Immutable</h3>
                <p>
                  Records are stored on Ethereum — decentralized, tamper-proof, and publicly
                  auditable. No central authority controls the data.
                </p>
              </div>
              <div className="about-card card">
                <div className="about-card-icon">🔑</div>
                <h3>Own Your Data</h3>
                <p>
                  Your wallet address is the owner of every hash you register. Only your
                  private key can revoke a record.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="nav-logo-icon">⛓</span>
            <span className="footer-brand-name">IntegraChain</span>
            <p className="footer-tagline">Blockchain-powered file integrity registry</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Navigation</h4>
              <button className="footer-link" onClick={() => scrollTo('home')}>Home</button>
              <button className="footer-link" onClick={() => scrollTo('verify')}>Verify</button>
              <button className="footer-link" onClick={() => scrollTo('registration')}>Registration</button>
              <button className="footer-link" onClick={() => scrollTo('about')}>About</button>
            </div>
            <div className="footer-col">
              <h4>Technology</h4>
              <span className="footer-text">Ethereum / Solidity</span>
              <span className="footer-text">React + TypeScript</span>
              <span className="footer-text">Ethers.js v6</span>
              <span className="footer-text">Hardhat</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} IntegraChain. All rights reserved.</p>
        </div>
      </footer>

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
