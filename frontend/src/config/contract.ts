// Contract configuration.
// In production (Vercel), set VITE_CONTRACT_ADDRESS and VITE_CHAIN_ID as
// environment variables in the Vercel project dashboard.
// For local development these values are auto-updated by `npm run deploy`.
export const CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const CHAIN_ID: number = Number(
  import.meta.env.VITE_CHAIN_ID ?? 31337
);
