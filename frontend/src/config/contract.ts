// Contract configuration.
// In production (Vercel), set VITE_CONTRACT_ADDRESS and VITE_CHAIN_ID as
// environment variables in the Vercel project dashboard.
// For local development these values are auto-updated by `npm run deploy`.
export const CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? "0x8097361B90f0259d131f79E117D6dFEF1A424Ae1";

export const CHAIN_ID: number = Number(
  import.meta.env.VITE_CHAIN_ID ?? 11155111
);
