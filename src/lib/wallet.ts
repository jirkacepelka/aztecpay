// Aztec wallet connectivity via the Azguard wallet's own inpage-RPC client
// (@azguardwallet/client). This is the connector Azguard actually speaks — the
// generic @aztec/wallet-sdk uses numeric Fr chainInfo that Azguard doesn't
// recognize (it rendered a bogus `aztec:<n>` and rejected calls).

import { AzguardClient } from '@azguardwallet/client';
import type { DappMetadata, DappPermissions } from '@azguardwallet/types';

// Azguard CAIP-2 chain id is `aztec:<number>`, where the number is the rollup
// version. Mainnet ("alphanet") rollup version = 4248422647 (verified on-chain
// via the L1 Rollup contract getVersion()). Azguard shows this chain as
// "alphanet". To target another network, change this one value:
//   testnet  = 'aztec:1821665230'   sandbox = 'aztec:0'
export const AZTEC_CHAIN = 'aztec:4248422647' as const;

const DAPP_METADATA: DappMetadata = {
  name: 'AztecPay',
  description: 'Offchain Aztec invoices via aztec: payment URIs',
  url: typeof window !== 'undefined' ? window.location.origin : undefined,
};

// Capabilities the dapp asks the wallet user to approve.
const PERMISSIONS: DappPermissions[] = [
  {
    chains: [AZTEC_CHAIN],
    methods: ['send_transaction', 'call', 'simulate_views', 'register_contract'],
  },
];

export interface Connection {
  /** Approved Aztec account address (0x…). */
  address: string;
  disconnect: () => Promise<void>;
  onDisconnected: (fn: () => void) => void;
}

/** Whether the Azguard extension is present. */
export function isAzguardInstalled(timeoutMs = 3000): Promise<boolean> {
  return AzguardClient.isAzguardInstalled(timeoutMs);
}

export const INSTALL_URL =
  'https://chromewebstore.google.com/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn';

/**
 * Connect to Azguard. The wallet extension shows its own approval UI (account
 * selection + verification); on approval we get the account address back.
 */
export async function connectAzguard(): Promise<Connection> {
  const azguard = await AzguardClient.create();
  if (!azguard.connected) {
    await azguard.connect(DAPP_METADATA, PERMISSIONS);
  }
  const account = azguard.accounts[0];
  if (!account) throw new Error('Wallet approved no accounts.');
  // CaipAccount = `aztec:<chain>:<address>` → address is the last segment.
  const parts = account.split(':');
  const address = parts[parts.length - 1];
  return {
    address,
    disconnect: () => azguard.disconnect(),
    onDisconnected: (fn) => azguard.onDisconnected.addHandler(fn),
  };
}
