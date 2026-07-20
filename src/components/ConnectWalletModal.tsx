import { useEffect, useState } from 'react';

type Stage = 'connecting' | 'not-installed' | 'error';

interface Props {
  open: boolean;
  onClose: () => void;
  onConnected: (address: string) => void;
}

const FOOTER = 'Powered by Aztec Network, build by Neuport Labs with <3';

export function ConnectWalletModal({ open, onClose, onConnected }: Props) {
  const [stage, setStage] = useState<Stage>('connecting');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStage('connecting');
    setError('');

    (async () => {
      try {
        const wallet = await import('../lib/wallet');
        if (cancelled) return;
        if (!(await wallet.isAzguardInstalled())) {
          if (!cancelled) setStage('not-installed');
          return;
        }
        // Azguard shows its own approval popup (account pick + verification).
        const conn = await wallet.connectAzguard();
        if (cancelled) return;
        onConnected(conn.address);
        onClose();
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || 'Connection was rejected.');
          setStage('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, retry, onConnected, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Connect wallet</h2>
            <p className="modal-sub">Using Web3 wallet is the best option for your privacy and security</p>
          </div>
        </div>

        {stage === 'connecting' && (
          <div className="searching">
            <div className="spinner" />
            <div className="searching-text">Waiting for Azguard…</div>
            <p className="modal-disclaimer" style={{ textAlign: 'center', marginTop: 0 }}>
              Approve the connection in the Azguard wallet popup.
            </p>
          </div>
        )}

        {stage === 'not-installed' && (
          <div className="searching">
            <div className="searching-text">Azguard wallet not found</div>
            <a
              className="btn btn-primary"
              href="https://chromewebstore.google.com/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Install Azguard
            </a>
          </div>
        )}

        {stage === 'error' && (
          <div className="searching">
            <div className="searching-text" style={{ color: 'var(--danger)' }}>Connection failed</div>
            <p className="modal-disclaimer" style={{ textAlign: 'center', marginTop: 0 }}>{error}</p>
            <button className="btn btn-secondary" onClick={() => setRetry((n) => n + 1)}>
              Try again
            </button>
          </div>
        )}

        <div className="modal-footer">{FOOTER}</div>
      </div>
    </div>
  );
}
