import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import WalletStatus from './components/WalletStatus';
import NetworkStatus from './components/NetworkStatus';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import VerifyPage from './pages/VerifyPage';
import RegistrationPage from './pages/RegistrationPage';
import AboutPage from './pages/AboutPage';
import { connectWallet, getProvider, getLiveChainId, switchToSepolia, isMetaMaskMobile } from './lib/eth';
import { CHAIN_ID } from './config/contract';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

export interface WalletProps {
  walletConnected: boolean;
  address: string;
  chainId: number | null;
  requiredChainId: number;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  onConnect: () => void;
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

    if (isMetaMaskMobile()) {
      autoConnectMobile();
    } else {
      checkConnection();
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
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
      const result = await connectWallet();
      setAddress(result.address);
      setWalletConnected(true);
      let currentChainId = result.chainId;
      if (currentChainId !== CHAIN_ID) {
        await switchToSepolia();
        currentChainId = await getLiveChainId();
      }
      setChainId(currentChainId);
    } catch {
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
        const currentChainId = await getLiveChainId();
        setAddress(addr);
        setChainId(currentChainId);
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

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const walletProps: WalletProps = {
    walletConnected,
    address,
    chainId,
    requiredChainId: CHAIN_ID,
    addToast,
    onConnect: handleConnect,
  };

  return (
    <BrowserRouter>
      <ScrollToTop />

      {/* ── SITE HEADER ── */}
      <header className="site-header">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">⛓</span>
            <span className="nav-logo-text">IntegraChain</span>
          </Link>

          <nav className={`nav-links${mobileMenuOpen ? ' nav-links--open' : ''}`}>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/verify" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              Verify
            </NavLink>
            <NavLink to="/registration" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              Registration
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              About
            </NavLink>
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
        <Routes>
          <Route path="/" element={
            <HomePage {...walletProps} triggerRefresh={triggerRefresh} />
          } />
          <Route path="/verify" element={<VerifyPage {...walletProps} />} />
          <Route path="/registration" element={
            <RegistrationPage {...walletProps} refreshTrigger={refreshTrigger} />
          } />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
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
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/verify" className="footer-link">Verify</Link>
              <Link to="/registration" className="footer-link">Registration</Link>
              <Link to="/about" className="footer-link">About</Link>
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
    </BrowserRouter>
  );
}

export default App;