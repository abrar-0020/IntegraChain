# IntegraChain

A decentralized application for registering and verifying file integrity on the Ethereum blockchain. IntegraChain computes SHA-256 hashes of files entirely in the browser and stores those hashes on-chain, creating tamper-proof, publicly auditable records of file existence.

**Live:** https://integrachain.vercel.app  
**Network:** Sepolia Testnet  
**Contract:** `0x8097361B90f0259d131f79E117D6dFEF1A424Ae1`

---

## How It Works

1. A file is selected and its SHA-256 hash is computed locally using the Web Crypto API. The file itself never leaves the browser.
2. The hash, together with the wallet address, block timestamp, and an optional note, is submitted to the `IntegrityRegistry` smart contract on Sepolia.
3. To verify a file later, the same hash is recomputed and checked against the on-chain record. Any modification to the file produces a completely different hash, immediately revealing tampering.

---

## Features

- File hash registration with optional descriptive note
- Single-file and bulk integrity verification
- Side-by-side file comparison
- Hash revocation (owner-only soft delete)
- Downloadable JSON verification certificates
- Paginated registration history with search and sort
- CSV and JSON record export
- Dark and light theme with smooth transitions
- Mobile-responsive layout with MetaMask in-app browser support
- Auto-connect and auto-switch to Sepolia in MetaMask mobile browser
- Real-time network status (block number, gas price, chain ID)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20, Hardhat |
| Frontend | React 18, TypeScript, Vite 5 |
| Routing | React Router v7 |
| Blockchain Library | ethers.js v6 |
| Wallet | MetaMask |
| Hashing | Web Crypto API (SHA-256) |
| Hosting | Vercel |

---

## Project Structure

```
contracts/
  contracts/          Solidity source -- IntegrityRegistry.sol
  scripts/            Deployment script (deploy.ts)
  hardhat.config.ts   Network and compiler configuration
  .env.example        Environment variable template

frontend/
  src/
    pages/            Home, Verify, Registration, About
    components/       Reusable UI components
    lib/              Ethereum, hashing, and certificate utilities
    config/           Contract address and ABI
  .env.example        Environment variable template

vercel.json           Vercel build configuration and SPA rewrites
```

---

## Smart Contract

**`registerHash(bytes32 hash, string note)`**  
Stores a file hash with an optional note. Reverts if the hash is already registered.

**`getRecord(bytes32 hash)`**  
Returns the owner address, UNIX timestamp, note, and revocation status for a registered hash.

**`revokeHash(bytes32 hash)`**  
Marks a hash as revoked. Can only be called by the original registering address.

**Events:** `HashRegistered`, `HashRevoked`

---

## Local Development

### Prerequisites

- Node.js 18 or later
- MetaMask browser extension

### Install dependencies

```bash
cd contracts && npm install
cd ../frontend && npm install
```

### Start a local blockchain

```bash
cd contracts
npm run chain
```

Leave this terminal running. Note the first private key in the output (beginning with `0xac0974`) -- you will need it to import the test account into MetaMask.

### Configure MetaMask for localhost

Add a custom network in MetaMask:

| Field | Value |
|---|---|
| Network Name | Localhost 8545 |
| RPC URL | http://127.0.0.1:8545 |
| Chain ID | 31337 |
| Currency Symbol | ETH |

Then import an account using the private key copied above and switch to the Localhost 8545 network.

### Deploy the contract locally

Open a new terminal:

```bash
cd contracts
npm run deploy
```

The script deploys `IntegrityRegistry`, writes the contract address to `frontend/src/config/contract.ts`, and creates `frontend/.env.local`.

### Start the frontend

```bash
cd frontend
npm run dev
```

The application is available at http://localhost:5173.

---

## Deploying to Sepolia

### 1. Obtain a Sepolia RPC endpoint

Create a free project on Alchemy (https://alchemy.com) or Infura (https://infura.io) targeting Sepolia and copy the HTTPS endpoint.

### 2. Obtain Sepolia ETH

Request test ETH from a faucet such as sepoliafaucet.com or faucet.sepolia.dev.

### 3. Configure the deployer environment

```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
```

`contracts/.env` is excluded by `.gitignore`. Do not commit it.

### 4. Deploy

```bash
cd contracts
npm run deploy:sepolia
```

The script prints the deployed contract address on completion.

---

## Deploying the Frontend to Vercel

### Set environment variables

In your Vercel project under Settings > Environment Variables, add:

| Variable | Value |
|---|---|
| VITE_CONTRACT_ADDRESS | The address output by the deploy script |
| VITE_CHAIN_ID | 11155111 |

### Deploy

Connect the GitHub repository in the Vercel dashboard. Every push to the main branch triggers an automatic redeploy. To deploy manually:

```bash
npm install -g vercel
vercel
```

Trigger a redeploy after setting environment variables for the first time.

---

## Troubleshooting

**Wrong network (local):** Switch MetaMask to Localhost 8545, Chain ID 31337.

**Wrong network (Vercel):** Switch MetaMask to Sepolia testnet, Chain ID 11155111.

**Contract not deployed (local):** Run `npm run deploy` from the `contracts/` directory.

**Contract not deployed (Sepolia):** Run `npm run deploy:sepolia` and verify `SEPOLIA_RPC_URL` and `PRIVATE_KEY` are set in `contracts/.env`.

**Zero ETH on Sepolia:** Request test ETH from sepoliafaucet.com.

**Zero ETH locally:** Import the Hardhat test account using the private key from `npm run chain` output.

**Vercel build failure:** Confirm `VITE_CONTRACT_ADDRESS` and `VITE_CHAIN_ID` are set in Vercel environment variables, then trigger a fresh redeploy.

**Node.js version warning:** Hardhat officially supports Node.js 18 through 22.

---

## License

MIT
