import { useEffect, useMemo, useState } from 'react';
import {
  decodeInvoice,
  encodeInvoice,
  fromBaseUnits,
  toBaseUnits,
  shortenAddress,
  type InvoiceParams,
  type PaymentMode,
} from './lib/uri';
import { TOKENS, tokenByAddress, type TokenMeta } from './lib/tokens';
import { EthMark, AztecMark } from './components/icons';
import { Qr } from './components/Qr';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { ChooseTokenModal } from './components/ChooseTokenModal';

// Exactly two pages, per the design:
//   'index'   = create an invoice (landing). "You receive" card + Create Invoice.
//   'invoice' = invoice overview + pay. QR card + Pay Invoice / Copy URI.
type View = 'index' | 'invoice';

// Fallback recipient for the preview when no wallet is connected, so the invoice
// still renders. The real recipient is always the connected wallet's address.
const PREVIEW_RECIPIENT = '0x21852de10424512daabbccddeeff00112233445566778899' + '53b68b30f76da45c';

function tokenIcon(symbol: string) {
  return symbol === 'ETH' ? <EthMark size={26} /> : <AztecMark size={24} />;
}

/** Resolve display amount / symbol / fiat for an invoice using the token registry. */
function resolve(inv: InvoiceParams | null) {
  if (!inv) return null;
  const token = tokenByAddress(inv.token);
  const decimals = token?.decimals;
  let display = inv.amount;
  try {
    if (decimals != null) display = fromBaseUnits(inv.amount, decimals);
  } catch {
    display = inv.amount;
  }
  const symbol = token?.symbol ?? 'TOKEN';
  const fiat = token ? Number(display) * token.usdPrice : null;
  return { token, display, symbol, fiat };
}

export function App() {
  const [view, setView] = useState<View>('index');
  const [wallet, setWallet] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Index (create) form state
  const [amount, setAmount] = useState('0.01');
  const [token, setToken] = useState<TokenMeta>(TOKENS[0]);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<PaymentMode>('public');

  // The invoice shown on the 'invoice' page (from Create Invoice or a shared link).
  const [invoice, setInvoice] = useState<InvoiceParams | null>(null);

  const recipient = wallet ?? PREVIEW_RECIPIENT;

  // A shared aztec: URI in the URL hash → open the invoice (pay) page directly.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash.toLowerCase().startsWith('aztec:')) {
      const res = decodeInvoice(decodeURIComponent(hash));
      if (res.ok && res.params) {
        setInvoice(res.params);
        setView('invoice');
      }
    }
  }, []);

  const idxFiat = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n * token.usdPrice : null;
  }, [amount, token]);

  const uri = useMemo(() => {
    if (!invoice) return '';
    try {
      return encodeInvoice(invoice);
    } catch {
      return '';
    }
  }, [invoice]);

  const resolved = resolve(invoice);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  function createInvoice() {
    let base: string;
    try {
      base = toBaseUnits(amount || '0', token.decimals);
      if (base === '0') throw new Error('Enter an amount greater than zero.');
    } catch (e) {
      showToast((e as Error).message);
      return;
    }
    const inv: InvoiceParams = {
      recipient,
      token: token.address,
      amount: base,
      memo: note.trim() || undefined,
      network: 'testnet',
      mode,
    };
    try {
      window.location.hash = encodeInvoice(inv);
    } catch (e) {
      showToast((e as Error).message);
      return;
    }
    setInvoice(inv);
    setView('invoice');
  }

  async function copyUri() {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      showToast('URI copied to clipboard');
    } catch {
      showToast('Copy failed — select the URI manually');
    }
  }

  function payNow() {
    if (!wallet) {
      setConnectOpen(true);
      return;
    }
    showToast('Payment submitted (demo)');
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => setView('index')} title="Home">
          {'{AztecPay}'}
        </button>
        {wallet ? (
          <button className="btn-connect" onClick={() => setWallet(null)} title="Disconnect">
            {shortenAddress(wallet, 6, 4)}
          </button>
        ) : (
          <button className="btn-connect" onClick={() => setConnectOpen(true)}>
            Connect
          </button>
        )}
      </header>

      <main className="stage">
        {/* ---------- INDEX: create invoice ---------- */}
        {view === 'index' && (
          <div className="pay-card">
            <div className="receive-box">
              <div className="receive-label">You receive</div>
              <input
                className="receive-amount-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                size={Math.max((amount || '').length, 4)}
                aria-label="Amount"
              />
              <div className="receive-fiat">{idxFiat != null ? `$${idxFiat.toFixed(2)}` : '—'}</div>
              <button className="token-badge token-badge-btn" onClick={() => setTokenModalOpen(true)}>
                {tokenIcon(token.symbol)}
                {token.symbol}
              </button>
            </div>

            <input
              className="note-input"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="seg">
              {(['public', 'private'] as PaymentMode[]).map((m) => (
                <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
                  {m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            <button className="btn btn-primary btn-block" onClick={createInvoice}>
              Create Invoice
            </button>
          </div>
        )}

        {/* ---------- INVOICE: overview + pay ---------- */}
        {view === 'invoice' && invoice && resolved && (
          <div className="invoice-card">
            <h2>Invoice on Aztec Network</h2>
            <div className="invoice-body">
              <Qr value={uri} />
              <div className="invoice-details">
                <div className="amount-lg">
                  {resolved.display} <span className="unit">{resolved.symbol}</span>
                </div>
                <div className="to-pay">To pay</div>

                <div className="field-label">Address:</div>
                <div className="field-value mono">{shortenAddress(invoice.recipient, 18, 16)}</div>

                {invoice.memo && (
                  <>
                    <div className="field-label">Note:</div>
                    <div className="field-value">{invoice.memo}</div>
                  </>
                )}
              </div>
            </div>
            <div className="invoice-actions">
              <button className="btn btn-primary" onClick={payNow}>
                Pay Invoice
              </button>
              <button className="btn btn-secondary" onClick={copyUri}>
                Copy URI
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="status">
        <span className="status-block">Block: 5009</span>
        <span className="status-net">Aztec V5</span>
      </div>

      <ConnectWalletModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={(addr) => {
          setWallet(addr);
          showToast('Wallet connected');
        }}
      />

      <ChooseTokenModal
        open={tokenModalOpen}
        tokens={TOKENS}
        onClose={() => setTokenModalOpen(false)}
        onSelect={(t) => {
          setToken(t);
          setTokenModalOpen(false);
        }}
        onAddCustom={() => showToast('Custom token — coming soon')}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
