/**
 * Compute SHA-256 hash of a file using Web Crypto API
 * @param file The file to hash
 * @returns Hex string representation of the hash
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Convert hex string to bytes32 format for Ethereum
 * @param hex Hex string (with or without 0x prefix)
 * @returns 0x-prefixed 32-byte hex string
 */
export function hexToBytes32(hex: string): string {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length !== 64) {
    throw new Error('Invalid hash length. Expected 64 hex characters (32 bytes)');
  }
  return '0x' + cleanHex;
}

/**
 * Truncate hash for display
 * @param hash Full hash string
 * @param startChars Number of characters to show at start
 * @param endChars Number of characters to show at end
 * @returns Truncated hash
 */
export function truncateHash(hash: string, startChars = 10, endChars = 8): string {
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

/**
 * Truncate Ethereum address for display
 * @param address Ethereum address
 * @returns Truncated address
 */
export function truncateAddress(address: string): string {
  if (address.length !== 42) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
