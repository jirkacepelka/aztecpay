# AztecPay

Offchain invoice generator for Aztec Network. Builds shareable `aztec:` payment
URIs (with QR codes) — no backend, fully static, deployable to **IPFS + ENS**.

- URI scheme: see [docs/uri-spec.md](docs/uri-spec.md)
- Stack: Vite + React + TypeScript, system fonts only (no external requests)

## Develop

```bash
npm install
npm run dev        # http://localhost:5187
npm run test       # URI codec + token registry unit tests (node --test)
npm run build      # static output → dist/
```

Node 24 is required (managed via nvm in this environment).

## Screens

- **Create** — form (recipient, token, amount, mode, note) → builds the invoice.
  Reachable by clicking the `{AztecPay}` logo.
- **Invoice** — the shareable invoice: QR of the `aztec:` URI, amount, address,
  note, `Pay Invoice` + `Copy URI`. This is also the landing view when opened
  via a shared link (the URI lives in the URL hash: `…/#aztec:0x…?…`).
- **Pay** — `You receive` summary, token badge, optional note, `Pay Invoice`.
- **Connect wallet** modal — **real Azguard** connection via
  `@azguardwallet/client` (Azguard's own inpage-RPC client). Azguard shows its
  own approval popup (account pick + verification), then returns the account.
  Needs the Azguard extension installed. The target chain is `AZTEC_CHAIN` in
  `src/lib/wallet.ts` = `aztec:4248422647` — Aztec **mainnet** ("alphanet"; the
  number is the rollup version). Change it for other networks.
- **Choose token** modal — ETH / USDC / add custom.

## Deploy to IPFS + ENS

The build is fully static with **relative asset paths** (`base: './'` in
`vite.config.ts`) and stores invoice state in the URL hash, so it works from any
IPFS gateway path.

```bash
npm run build
# pin dist/ to IPFS (pick one)
ipfs add -r dist                      # local node → returns a CID
# or: npx thirdweb upload dist / w3 up dist / nft.storage, etc.
```

Then point your ENS name at the CID:

1. ENS app → your name → **Records** → **Content Hash**
2. set `ipfs://<CID>`
3. resolves at `https://<name>.eth.limo` (and ENS-aware browsers).

Re-deploying = new CID → update the content hash record.

## Wallet integration

`Connect` uses **`@azguardwallet/client`** (`src/lib/wallet.ts`), lazy-loaded so
it code-splits from the core bundle. It's a tiny zero-dependency inpage-RPC
client — the whole built site is ~200 kB (no Barretenberg WASM). The dapp
requests permission for chain `aztec:4248422647` (mainnet) and, on approval,
reads the account address from Azguard.

> Earlier this used `@aztec/wallet-sdk`, which sends numeric `Fr` chainInfo that
> Azguard didn't recognize (it rendered a bogus `aztec:<n>` and rejected calls
> with "Unauthorized method/chain"). Azguard speaks its own client protocol.

## Not yet wired (mocked in the UI)

- **Actual payment** (`Pay Invoice`) — shows a demo toast; needs an Azguard
  `send_transaction` op against the token contract.
- **Live data** — `Block: 5009`, the `$` fiat estimate, and token decimals use
  static/registry values; wire an Aztec node + price feed later.
- **Aztec logo / ETH glyph** — geometric placeholders (Figma asset export was
  rate-limited); swap for the official brand assets.
