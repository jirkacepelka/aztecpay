import { useEffect, useRef, useState } from 'react';
import { AztecMark } from './icons';
import type { Discovery, Pending, WalletProvider } from '../lib/wallet';

type Stage = 'searching' | 'list' | 'verify' | 'connecting' | 'empty' | 'error';

interface Props {
  open: boolean;
  onClose: () => void;
  onConnected: (address: string) => void;
}

const FOOTER = 'Powered by Aztec Network, build by Neuport Labs with <3';
const DISCLAIMER =
  'By connecting wallet, you agree that AdamantWare is not responsible for any losses or damages. You remain solely responsible for your assets and transactions.';

export function ConnectWalletModal({ open, onClose, onConnected }: Props) {
  const [stage, setStage] = useState<Stage>('searching');
  const [providers, setProviders] = useState<WalletProvider[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [activeName, setActiveName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const discoveryRef = useRef<Discovery | null>(null);

  // Start real discovery when the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStage('searching');
    setProviders([]);
    setPending(null);
    setError('');

    (async () => {
      try {
        const wallet = await import('../lib/wallet');
        if (cancelled) return;
        const found: WalletProvider[] = [];
        const discovery = wallet.discoverWallets((p) => {
          if (cancelled) return;
          found.push(p);
          setProviders([...found]);
          setStage('list');
        }, 8000);
        discoveryRef.current = discovery;
        await discovery.done;
        if (!cancelled && found.length === 0) setStage('empty');
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || 'Failed to load wallet SDK.');
          setStage('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      discoveryRef.current?.cancel();
      discoveryRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  async function selectProvider(p: WalletProvider) {
    setActiveName(p.name);
    setStage('connecting');
    try {
      const wallet = await import('../lib/wallet');
      const pend = await wallet.establishConnection(p);
      setPending(pend);
      setStage('verify');
    } catch (e) {
      setError((e as Error).message || 'Could not establish a secure channel.');
      setStage('error');
    }
  }

  async function confirmConnection() {
    if (!pending) return;
    setStage('connecting');
    try {
      const accounts = await pending.confirm();
      if (!accounts.length) throw new Error('Wallet returned no accounts.');
      onConnected(accounts[0]);
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Connection was rejected.');
      setStage('error');
    }
  }

  function cancelVerify() {
    pending?.cancel();
    setPending(null);
    setStage(providers.length ? 'list' : 'searching');
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Connect wallet</h2>
            <p className="modal-sub">Using Web3 wallet is the best option for your privacy and security</p>
          </div>
          {(stage === 'searching' || stage === 'empty' || stage === 'error') && (
            <button className="btn-ghost-accent" onClick={() => setStage('searching')}>
              Connect Aztec
            </button>
          )}
        </div>

        {(stage === 'searching' || stage === 'connecting') && (
          <div className="searching">
            <div className="spinner" />
            <div className="searching-text">
              {stage === 'connecting' ? `Connecting to ${activeName || 'wallet'}…` : 'Searching for Aztec Wallets'}
            </div>
          </div>
        )}

        {stage === 'empty' && (
          <div className="searching">
            <div className="searching-text">No Aztec wallets found.</div>
            <p className="modal-disclaimer" style={{ textAlign: 'center', marginTop: 0 }}>
              Install an Aztec wallet (e.g. Azguard) and try again.
            </p>
          </div>
        )}

        {stage === 'error' && (
          <div className="searching">
            <div className="searching-text" style={{ color: 'var(--danger)' }}>Connection failed</div>
            <p className="modal-disclaimer" style={{ textAlign: 'center', marginTop: 0 }}>{error}</p>
          </div>
        )}

        {stage === 'list' && (
          <>
            <div className="modal-list">
              {providers.map((p, i) => (
                <button key={p.id + i} className="row-btn" onClick={() => selectProvider(p)}>
                  {p.icon ? (
                    <span className="icon-badge">
                      <img src={p.icon} alt="" width={28} height={28} style={{ borderRadius: 6 }} />
                    </span>
                  ) : (
                    <AztecMark size={28} />
                  )}
                  {p.name}
                </button>
              ))}
            </div>
            <p className="modal-disclaimer">{DISCLAIMER}</p>
          </>
        )}

        {stage === 'verify' && pending && (
          <>
            <div className="verify-row">
              <div className="verify-name">
                <AztecMark size={28} />
                {activeName || 'Wallet'}
              </div>
              <div className="piggy-grid">
                {pending.emojis.map((e, i) => (
                  <div key={i} className="piggy">{e}</div>
                ))}
              </div>
              <div className="verify-actions">
                <button className="btn btn-secondary" onClick={cancelVerify}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={confirmConnection}>
                  Verify connection
                </button>
              </div>
            </div>
            <p className="modal-disclaimer">
              Confirm these emojis match the ones shown in your wallet before verifying.
            </p>
          </>
        )}

        <div className="modal-footer">{FOOTER}</div>
      </div>
    </div>
  );
}
