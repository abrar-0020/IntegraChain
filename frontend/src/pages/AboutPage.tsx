export default function AboutPage() {
  return (
    <section className="site-section section-alt">
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
  );
}
