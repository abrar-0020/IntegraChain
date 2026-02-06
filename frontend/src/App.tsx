import { useState, useEffect } from 'react';
import WalletStatus from './components/WalletStatus';
import RegisterPanel from './components/RegisterPanel';
import VerifyPanel from './components/VerifyPanel';
import RecordsPanel from './components/RecordsPanel';
import NetworkStatus from './components/NetworkStatus';
import Toast from './components/Toast';
import { connectWallet, getProvider } from './lib/eth';

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
  const [showRecords, setShowRecords] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Initialize dark mode from storage or default to dark
    const savedMode = localStorage.getItem('darkMode');
    setDarkMode(savedMode !== 'false');
    
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
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

  const checkConnection = async () => {
    try {
      const provider = getProvider();
      if (!provider) return;

      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        const network = await provider.getNetwork();
        setAddress(addr);
        setChainId(Number(network.chainId));
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

  return (
    <>
      <div className="container">
        <header className="header">
          <div className="header-content">
            <div>
              <h1 className="header-title">IntegraChain</h1>
              <p className="header-description">
                Register and verify file integrity using blockchain technology
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? 'Light' : 'Dark'}
              </button>
              <WalletStatus
                connected={walletConnected}
                address={address}
                chainId={chainId}
                onConnect={handleConnect}
              />
            </div>
          </div>
          {walletConnected && chainId === 31337 && <NetworkStatus />}
        </header>

        {!walletConnected ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Connect Your Wallet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Please connect your MetaMask wallet to use this application
            </p>
            <button className="btn btn-primary" onClick={handleConnect}>
              Connect Wallet
            </button>
          </div>
        ) : chainId !== 31337 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Wrong Network</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Please switch to Localhost 8545 (Chain ID: 31337) in MetaMask to use this application
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Current Chain ID: {chainId}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
              Tip: Make sure you have started the local Hardhat blockchain node and deployed the contract
            </p>
          </div>
        ) : (
          <>
            <div className="main-grid">
              <RegisterPanel onSuccess={triggerRefresh} onToast={addToast} />
              <VerifyPanel onToast={addToast} />
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                className="btn" 
                onClick={() => setShowRecords(!showRecords)}
                style={{ 
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '0.75rem 1.5rem'
                }}
              >
                {showRecords ? 'Hide' : 'View'} Recent Registrations
              </button>
            </div>

            {showRecords && <RecordsPanel refreshTrigger={refreshTrigger} onToast={addToast} />}
          </>
        )}
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
