import { AztecMark } from './icons';
import type { TokenMeta } from '../lib/tokens';

interface Props {
  open: boolean;
  tokens: TokenMeta[];
  onClose: () => void;
  onSelect: (t: TokenMeta) => void;
  onAddCustom?: () => void;
}

export function ChooseTokenModal({ open, tokens, onClose, onSelect, onAddCustom }: Props) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <h2 className="modal-title">Chose token</h2>
          <button className="token-add" onClick={onAddCustom}>
            Add custom
          </button>
        </div>
        <div className="modal-list">
          {tokens.map((t) => (
            <button key={t.symbol} className="row-btn token-row" onClick={() => onSelect(t)}>
              <AztecMark size={28} />
              {t.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
