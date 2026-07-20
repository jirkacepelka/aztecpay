// Real Aztec wallet connectivity via @aztec/wallet-sdk (dApp side only:
// discovery + secure channel + accounts). The heavy @aztec/aztec.js graph is
// pulled in here; import this module dynamically so it code-splits away from
// the core app bundle.

import { WalletManager, type WalletProvider, type PendingConnection } from '@aztec/wallet-sdk/manager';
import { hashToEmoji } from '@aztec/wallet-sdk/crypto';
import { Fr } from '@aztec/aztec.js/fields';

export type { WalletProvider };

export const APP_ID = 'aztecpay';

// Aztec network chain info for wallet discovery + calls. This MUST match the
// network the user's wallet is on, or the wallet rejects methods with
// "Unauthorized method/chain". chainId = L1 chain id, version = rollup version.
// Values from https://docs.aztec.network/networks
const NETWORKS = {
  mainnet: { chainId: 1, version: 4248422647 },
  testnet: { chainId: 11155111, version: 1821665230 },
} as const;

const NETWORK: keyof typeof NETWORKS = 'mainnet';

export const CHAIN_INFO = {
  chainId: new Fr(NETWORKS[NETWORK].chainId),
  version: new Fr(NETWORKS[NETWORK].version),
};

export interface Discovery {
  wallets: AsyncIterable<WalletProvider>;
  done: Promise<void>;
  cancel: () => void;
}

/** Start extension-wallet discovery. Providers arrive via the callback. */
export function discoverWallets(
  onWalletDiscovered: (p: WalletProvider) => void,
  timeout = 60000,
): Discovery {
  return WalletManager.configure({ extensions: { enabled: true } }).getAvailableWallets({
    chainInfo: CHAIN_INFO,
    appId: APP_ID,
    timeout,
    onWalletDiscovered,
  });
}

export interface Pending {
  /** Verification hash rendered as individual emojis for the 3×3 grid. */
  emojis: string[];
  /** Confirm after the user matches emojis with their wallet → returns account addresses. */
  confirm: () => Promise<string[]>;
  cancel: () => void;
}

/** ECDH handshake with a provider; returns the verification emojis + confirm/cancel. */
export async function establishConnection(provider: WalletProvider): Promise<Pending> {
  const pending: PendingConnection = await provider.establishSecureChannel(APP_ID);
  const emojiStr = hashToEmoji(pending.verificationHash, 9);
  return {
    emojis: [...emojiStr],
    confirm: async () => {
      const wallet = await pending.confirm();
      const accounts = await wallet.getAccounts();
      return accounts.map((a) => {
        const anyA = a as { toString(): string };
        return anyA.toString();
      });
    },
    cancel: () => pending.cancel(),
  };
}
