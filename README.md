# IntegraChain

A decentralized application (dApp) for registering and verifying file integrity using Ethereum smart contracts. IntegraChain ensures data authenticity by storing cryptographic hashes on the blockchain, enabling tamper-proof verification of file integrity.

Files are hashed client-side using SHA-256, and only the hash along with metadata (owner, timestamp, optional note) is stored on-chain. This approach maintains privacy while providing verifiable proof of file existence and integrity.

## Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension

## Quick Start

### 1. Install Dependencies

```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Start Local Blockchain

Open a terminal and run:

```bash
cd contracts
npm run chain
```

Keep this terminal open. You'll see 20 test accounts with private keys. Copy the first private key (starts with `0xac0974...`) for the next step.

### 3. Configure MetaMask

1. Open MetaMask
2. Click the network dropdown → Add Network → Add network manually
3. Enter:
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
4. Click "Import Account" → paste the private key you copied
5. Switch to the Localhost 8545 network

### 4. Deploy Smart Contract

Open a **new terminal**:

```bash
cd contracts
npm run deploy
```

This deploys the `IntegrityRegistry` contract and writes the address to `frontend/src/config/contract.ts`.

**Note**: If upgrading from a previous version, you MUST redeploy the contract to get the new revoke functionality.

### 5. Start Frontend

Open a **new terminal**:

```bash
cd frontend
npm run dev
```

The app opens at `http://localhost:5173`

### 6. Use the dApp

1. Click "Connect Wallet" and approve in MetaMask
2. Toggle dark/light mode using the theme switcher in the header
3. Register a file:
   - Drag & drop a file or click to browse
   - View file metadata (size, type, modified date)
   - Add an optional note/label
   - Click "Register on Blockchain"
   - Confirm the transaction in MetaMask
4. Verify a file:
   - Drag & drop or select a file to verify
   - Click "Verify Integrity"
   - Download verification certificate if file matches
5. Bulk verify multiple files:
   - Click "Bulk" mode in Verify panel
   - Drag & drop multiple files
   - View results for all files at once
6. Compare two files:
   - Click "Compare" mode in Verify panel
   - Select two files to check if they're identical
7. View Records:
   - Click "View Recent Registrations"
   - Search by hash, owner, or note
   - Filter by "My Records" or sort by date
   - Export records as CSV or JSON
   - Revoke your own hashes if needed

## Deploying to Vercel (Sepolia Testnet)

This is the recommended production deployment path. The smart contract lives on Sepolia and the frontend is hosted on Vercel.

### 1. Get a Sepolia RPC URL

Create a free account on [Infura](https://infura.io) or [Alchemy](https://alchemy.com) and create a new project targeting the **Sepolia** network. Copy the HTTPS endpoint.

### 2. Get Sepolia ETH

Add Sepolia to MetaMask (or use the existing Sepolia preset), then visit a faucet:
- [sepoliafaucet.com](https://sepoliafaucet.com)
- [faucet.sepolia.dev](https://faucet.sepolia.dev)

### 3. Configure the Deployer Environment

```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
```

> **Never commit `.env`.** It is already in `.gitignore`.

### 4. Deploy the Contract to Sepolia

```bash
cd contracts
npm install
npm run deploy:sepolia
```

The script will print the deployed contract address and display the environment variables you need for Vercel:

```
✅ IntegrityRegistry deployed to: 0xAbCd...
📋 Next steps:
   Set these in your Vercel project → Settings → Environment Variables:
   VITE_CONTRACT_ADDRESS=0xAbCd...
   VITE_CHAIN_ID=11155111
```

### 5. Deploy the Frontend to Vercel

```bash
npm i -g vercel   # install once
vercel            # from the repo root
```

Or connect your GitHub repo in the Vercel dashboard for automatic deploys on every push to `main`.

### 6. Set Environment Variables on Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_CONTRACT_ADDRESS` | The address printed by the deploy script |
| `VITE_CHAIN_ID` | `11155111` |

Trigger a redeploy after saving the variables (Vercel → Deployments → Redeploy).

> **Want to run locally instead?** Follow the [Quick Start](#quick-start) section — it uses Hardhat's local network, no RPC key required.

## Feature Guide

### Drag & Drop
Simply drag files from your file explorer directly into the dashed boxes in Register or Verify panels. Works for single files and bulk verification.

### Duplicate Detection 
When registering, the app automatically checks if a hash already exists on the blockchain and warns you before allowing duplicate registration.

### File Size Warnings
- Files over 100MB trigger a warning that hashing may take time
- Files over 500MB trigger a stronger warning
- Progress indicator shows hashing progress for large files

### Hash Revocation
Owners can "soft delete" their registered hashes by revoking them. Revoked hashes remain on the blockchain but are marked as deprecated, useful for mistakes or outdated registrations.

### Verification Certificate
When a file successfully verifies, click "Download Certificate" to get a JSON file containing:
- File hash and name
- Owner address
- Registration timestamp
- Verification timestamp
- Optional note

### Network Status
Real-time blockchain information displayed below the header when connected:
- Current block number (updates every 5 seconds)
- Gas price in Gwei
- Chain ID

### Search & Export
In Recent Registrations:
- Search across hashes, owner addresses, and notes
- Filter to show only your registrations
- Sort by newest or oldest first
- Export filtered results as CSV or JSON for record keeping

## Features

- **File Hash Registration**: Register SHA-256 hashes of files on the blockchain with optional notes
- **Integrity Verification**: Verify if files have been tampered with by comparing their current hash with blockchain records
- **Drag & Drop Interface**: Drag and drop files directly into register or verify areas for quick processing
- **Bulk Verification**: Upload and verify multiple files simultaneously with results overview
- **File Comparison**: Compare two files side-by-side to check if they are identical
- **Download Certificates**: Generate and download verification certificates as JSON proofs
- **Smart Duplicate Detection**: Warns when attempting to register an already-registered hash
- **File Size Warnings**: Alerts for large files that may take longer to hash
- **Hash Revocation**: Owners can revoke/deprecate previously registered hashes (soft delete)
- **Search & Filter**: Search records by hash, owner, or note; filter by ownership and sort by date
- **Export Records**: Export blockchain records as CSV or JSON for archiving
- **Dark/Light Mode**: Toggle between dark and light themes with persistent preference
- **Network Status**: Real-time display of block number, gas price, and chain ID
- **File Metadata Display**: Shows file size, type, and last modified date
- **Progress Indicators**: Visual feedback during hash computation for large files
- **Enhanced Hash Visualization**: Full hash display with easy copy functionality
- **Privacy-Focused**: Only cryptographic hashes are stored, never the actual file content
- **Timestamp Proof**: Each registration includes an immutable timestamp proving file existence at a specific time
- **Owner Tracking**: Track which Ethereum address registered each file hash
- **Responsive UI**: Clean, modern interface that works on all device sizes

## Verification Results

**File Unchanged:**
- Displays "FILE UNCHANGED" with green indicator
- Shows hash matches blockchain record
- Displays owner address, registration timestamp, and optional note

**File Tampered or Not Registered:**
- Displays "NO RECORD" with red indicator
- Warns that file might have been tampered with or was never registered
- Helps detect unauthorized modifications

## Project Structure

```
/contracts          - Hardhat smart contract project
  /contracts        - Solidity source files
  /scripts          - Deployment scripts
/frontend           - React + Vite frontend
  /src/components   - UI components
  /src/lib          - Hash and Ethereum utilities
  /src/config       - Contract address (auto-generated)
```

## How IntegraChain Works

1. **Client-side hashing**: Files are hashed in the browser using Web Crypto API (SHA-256), ensuring your files never leave your device
2. **On-chain registry**: Only the hash (32 bytes), owner address, timestamp, and optional note are stored on the blockchain
3. **Verification**: Upload any file to compute its hash and check if it matches records on the blockchain
4. **Event log**: Recent registrations are displayed by reading blockchain events
5. **Tamper detection**: Any modification to a file produces a completely different hash, immediately revealing tampering

## Troubleshooting

**"Wrong network" error (local)**: Switch MetaMask to Localhost 8545 (Chain ID: 31337)

**"Wrong network" error (Vercel)**: Switch MetaMask to **Sepolia** testnet (Chain ID: 11155111)

**"Contract not deployed" (local)**: Run `npm run deploy` in the `contracts/` directory

**"Contract not deployed" (Sepolia)**: Run `npm run deploy:sepolia` and make sure `SEPOLIA_RPC_URL` and `PRIVATE_KEY` are set in `contracts/.env`

**MetaMask shows 0 ETH on Sepolia**: Get free Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

**MetaMask shows 0 ETH locally**: Ensure you imported the Hardhat test account using the private key from the `npm run chain` output

**Vercel build fails**: Check that `VITE_CONTRACT_ADDRESS` and `VITE_CHAIN_ID` are set in Vercel → Settings → Environment Variables, then redeploy

**Port already in use**: Change the port in `frontend/vite.config.ts` or terminate the process using port 5173

**Node.js version warning**: Hardhat officially supports Node.js 18-22. If you encounter issues with newer Node.js versions, consider downgrading

## Tech Stack

- **Smart Contract**: Solidity 0.8.20, Hardhat
- **Frontend**: React 18, TypeScript, Vite
- **Blockchain Library**: ethers.js v6
- **Local Chain**: Hardhat Network (EVM compatible)
- **Wallet Integration**: MetaMask
- **Cryptography**: Web Crypto API (SHA-256)
- **Styling**: Custom CSS with dark/light mode support
- **Hosting**: Vercel (static frontend deployment)

## Smart Contract Functions

- `registerHash(bytes32 hash, string note)`: Register a new file hash with optional note
- `getRecord(bytes32 hash)`: Retrieve registration details for a hash
- `revokeHash(bytes32 hash)`: Revoke a hash (only by owner)
- Events: `HashRegistered`, `HashRevoked` for blockchain indexing

## Use Cases

- **Document Verification**: Prove the authenticity and integrity of legal documents, contracts, or certificates
- **Software Distribution**: Verify downloaded files haven't been tampered with
- **Audit Trails**: Create immutable records of file existence at specific timestamps
- **Academic Integrity**: Timestamp research papers or thesis submissions
- **Digital Evidence**: Establish proof of file existence for legal or compliance purposes

## Important Notes

- The local Hardhat blockchain resets every time you stop `npm run chain` — all registrations are lost
- For persistence during local testing, keep the Hardhat node running and do not restart it
- The Vercel deployment connects to whichever network you set via `VITE_CONTRACT_ADDRESS` / `VITE_CHAIN_ID`
- For a permanent public deployment, deploy the contract to Sepolia testnet or Ethereum mainnet
- Files are **never** uploaded — only their SHA-256 hash is stored on-chain
- Each registration writes to the blockchain and costs gas (free on local/testnet, real ETH on mainnet)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or commercial purposes.
