import { BrowserProvider, Contract, EventLog } from 'ethers';
import { CONTRACT_ADDRESS, CHAIN_ID } from '../config/contract';
import { CONTRACT_ABI } from '../config/abi';

declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Get the ethers.js provider
 */
export function getProvider(): BrowserProvider | null {
  if (!window.ethereum) return null;
  return new BrowserProvider(window.ethereum);
}

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<{ address: string; chainId: number }> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use this app.');
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  return { address, chainId };
}

/**
 * Get the IntegrityRegistry contract instance
 */
export async function getContract(): Promise<Contract> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No provider available');
  }

  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Register a file hash on the blockchain
 */
export async function registerHash(hash: string, note: string): Promise<string> {
  const contract = await getContract();
  const tx = await contract.registerHash(hash, note);
  await tx.wait();
  return tx.hash;
}

/**
 * Get a record from the blockchain
 */
export async function getRecord(hash: string): Promise<{
  exists: boolean;
  owner: string;
  timestamp: bigint;
  note: string;
  revoked: boolean;
}> {
  const contract = await getContract();
  const [exists, owner, timestamp, note, revoked] = await contract.getRecord(hash);
  return { exists, owner, timestamp, note, revoked };
}

/**
 * Revoke a hash (only owner can revoke)
 */
export async function revokeHash(hash: string): Promise<string> {
  const contract = await getContract();
  const tx = await contract.revokeHash(hash);
  await tx.wait();
  return tx.hash;
}

/**
 * Check if a hash is already registered
 */
export async function isHashRegistered(hash: string): Promise<boolean> {
  const record = await getRecord(hash);
  return record.exists;
}

/**
 * Get network status information
 */
export async function getNetworkStatus(): Promise<{
  blockNumber: number;
  gasPrice: string;
  chainId: number;
}> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No provider available');
  }

  const blockNumber = await provider.getBlockNumber();
  const feeData = await provider.getFeeData();
  const network = await provider.getNetwork();
  
  return {
    blockNumber,
    gasPrice: feeData.gasPrice ? (Number(feeData.gasPrice) / 1e9).toFixed(2) + ' Gwei' : 'N/A',
    chainId: Number(network.chainId),
  };
}

/**
 * Get recent HashRegistered events
 */
export async function getRecentEvents(limit = 10): Promise<Array<{
  owner: string;
  hash: string;
  timestamp: number;
  note: string;
  blockNumber: number;
}>> {
  const provider = getProvider();
  if (!provider) return [];

  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    const filter = contract.filters.HashRegistered();
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    
    const parsedEvents = events
      .filter((event): event is EventLog => 'args' in event)
      .map((event) => ({
        owner: event.args[0] as string,
        hash: event.args[1] as string,
        timestamp: Number(event.args[2]),
        note: event.args[3] as string,
        blockNumber: event.blockNumber,
      }))
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, limit);

    return parsedEvents;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}
