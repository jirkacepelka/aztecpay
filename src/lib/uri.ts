// Aztec Invoice URI codec — implements docs/uri-spec.md (v1).
//
//   aztec:<recipient>?token=<addr>&amount=<baseUnits>&memo=<text>&network=<net>&mode=<private|public>&v=1
//
// Pure, dependency-free, browser-safe. `amount` is always atomic base units
// (an integer string); conversion to/from a human display amount is done via
// the toBaseUnits / fromBaseUnits helpers.

export const SCHEME = 'aztec';
export const SCHEME_VERSION = 1;

export type PaymentMode = 'private' | 'public';
export type AztecNetwork = 'mainnet' | 'testnet' | 'sandbox';

export const PAYMENT_MODES: PaymentMode[] = ['private', 'public'];
export const NETWORKS: AztecNetwork[] = ['mainnet', 'testnet', 'sandbox'];

export interface InvoiceParams {
  /** AztecAddress of the payee. `0x` + 1..64 hex. */
  recipient: string;
  /** Token contract AztecAddress. `0x` + 1..64 hex. */
  token: string;
  /** Amount in atomic base units — a non-negative integer string. */
  amount: string;
  /** Human-readable memo (NOT an Aztec note/UTXO). */
  memo?: string;
  network?: AztecNetwork;
  /** Which recipient balance the payment targets. Defaults to 'private'. */
  mode?: PaymentMode;
  /** Scheme version. Defaults to 1. */
  v?: number;
}

export interface ValidationIssue {
  field: keyof InvoiceParams | 'scheme' | 'uri';
  message: string;
}

export interface DecodeResult {
  ok: boolean;
  params?: InvoiceParams;
  /** Query keys present in the URI that the spec does not define (ignored, per forward-compat). */
  unknownParams: string[];
  errors: ValidationIssue[];
}

const HEX_FIELD = /^0x[0-9a-fA-F]{1,64}$/;
const UINT = /^\d+$/;

export function isHexFieldElement(s: string): boolean {
  return HEX_FIELD.test(s);
}

export function isBaseUnitAmount(s: string): boolean {
  return UINT.test(s);
}

/** Validate a fully-formed InvoiceParams object. Returns a list of issues (empty = valid). */
export function validate(p: Partial<InvoiceParams>): ValidationIssue[] {
  const errors: ValidationIssue[] = [];

  if (!p.recipient) {
    errors.push({ field: 'recipient', message: 'Recipient address is missing.' });
  } else if (!isHexFieldElement(p.recipient)) {
    errors.push({ field: 'recipient', message: 'Invalid AztecAddress (expected 0x + 1–64 hex).' });
  }

  if (!p.token) {
    errors.push({ field: 'token', message: 'Token address is missing.' });
  } else if (!isHexFieldElement(p.token)) {
    errors.push({ field: 'token', message: 'Invalid token address (expected 0x + 1–64 hex).' });
  }

  if (p.amount == null || p.amount === '') {
    errors.push({ field: 'amount', message: 'Amount is missing.' });
  } else if (!isBaseUnitAmount(p.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a non-negative integer in base units (no decimal point).' });
  }

  if (p.mode != null && !PAYMENT_MODES.includes(p.mode)) {
    errors.push({ field: 'mode', message: `mode must be one of: ${PAYMENT_MODES.join(', ')}.` });
  }

  if (p.network != null && !NETWORKS.includes(p.network)) {
    errors.push({ field: 'network', message: `network must be one of: ${NETWORKS.join(', ')}.` });
  }

  if (p.v != null && (!Number.isInteger(p.v) || p.v < 1)) {
    errors.push({ field: 'v', message: 'Version (v) must be a positive integer.' });
  }

  return errors;
}

/** Encode invoice params into an `aztec:` URI. Throws if params are invalid. */
export function encodeInvoice(p: InvoiceParams): string {
  const errors = validate(p);
  if (errors.length) {
    throw new Error('Invalid invoice params: ' + errors.map((e) => `${e.field}: ${e.message}`).join('; '));
  }

  const q = new URLSearchParams();
  q.set('token', p.token);
  q.set('amount', p.amount);
  if (p.memo) q.set('memo', p.memo);
  if (p.network) q.set('network', p.network);
  if (p.mode) q.set('mode', p.mode);
  if (p.v != null && p.v !== SCHEME_VERSION) q.set('v', String(p.v));

  return `${SCHEME}:${p.recipient}?${q.toString()}`;
}

const KNOWN_KEYS = new Set(['token', 'amount', 'memo', 'network', 'mode', 'v']);

/** Decode an `aztec:` URI into params, collecting validation errors and unknown keys. */
export function decodeInvoice(uri: string): DecodeResult {
  const errors: ValidationIssue[] = [];
  const unknownParams: string[] = [];
  const trimmed = uri.trim();

  const prefix = `${SCHEME}:`;
  if (!trimmed.toLowerCase().startsWith(prefix)) {
    return { ok: false, unknownParams, errors: [{ field: 'scheme', message: `URI must start with "${prefix}".` }] };
  }

  // Manual split (custom-scheme URLs are opaque; avoid URL() quirks).
  const rest = trimmed.slice(prefix.length);
  const qIdx = rest.indexOf('?');
  const recipient = qIdx === -1 ? rest : rest.slice(0, qIdx);
  const queryStr = qIdx === -1 ? '' : rest.slice(qIdx + 1);

  const q = new URLSearchParams(queryStr);
  for (const key of q.keys()) {
    if (!KNOWN_KEYS.has(key) && !unknownParams.includes(key)) unknownParams.push(key);
  }

  const vRaw = q.get('v');
  const params: InvoiceParams = {
    recipient,
    token: q.get('token') ?? '',
    amount: q.get('amount') ?? '',
    memo: q.get('memo') ?? undefined,
    network: (q.get('network') as AztecNetwork) ?? undefined,
    mode: (q.get('mode') as PaymentMode) ?? undefined,
    v: vRaw != null ? Number(vRaw) : undefined,
  };

  if (vRaw != null && !UINT.test(vRaw)) {
    errors.push({ field: 'v', message: 'Version (v) must be a positive integer.' });
  }

  errors.push(...validate(params));

  return { ok: errors.length === 0, params, unknownParams, errors };
}

// ---------------------------------------------------------------------------
// Base-unit <-> display-amount conversion (integer-safe, no floating point).
// ---------------------------------------------------------------------------

/** Convert a human display amount (e.g. "25.5") to base units given token decimals. */
export function toBaseUnits(display: string, decimals: number): string {
  const s = display.trim();
  if (!/^\d+(\.\d+)?$/.test(s)) {
    throw new Error('Invalid amount: expected a non-negative decimal number (e.g. 25.5).');
  }
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('decimals must be a non-negative integer.');
  }
  const [intPart, fracPartRaw = ''] = s.split('.');
  if (fracPartRaw.length > decimals) {
    throw new Error(`Amount has more decimals (${fracPartRaw.length}) than the token allows (${decimals}).`);
  }
  const frac = fracPartRaw.padEnd(decimals, '0');
  const combined = (intPart + frac).replace(/^0+(?=\d)/, '');
  return combined === '' ? '0' : combined;
}

/** Convert base units back to a human display string given token decimals. */
export function fromBaseUnits(base: string, decimals: number): string {
  if (!UINT.test(base)) throw new Error('base units must be a non-negative integer.');
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('decimals must be a non-negative integer.');
  }
  if (decimals === 0) return base;
  const padded = base.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPart = padded.slice(padded.length - decimals).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/** Shorten an address for display: 0x21852de10424512d..53b68b30f76da45c */
export function shortenAddress(addr: string, head = 14, tail = 16): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}..${addr.slice(-tail)}`;
}
