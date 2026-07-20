import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeInvoice,
  decodeInvoice,
  toBaseUnits,
  fromBaseUnits,
  validate,
  shortenAddress,
  type InvoiceParams,
} from './uri.ts';

const ADDR = '0x1f3a4b5c6d7e8f90112233445566778899aabbccddeeff00112233445566778';
const TOKEN = '0x88ce00112233445566778899aabbccddeeff00112233445566778899aabbcc21';

test('encode → decode round-trip preserves all fields', () => {
  const p: InvoiceParams = {
    recipient: ADDR,
    token: TOKEN,
    amount: '25500000',
    memo: 'Konzultace březen #042',
    network: 'testnet',
    mode: 'private',
  };
  const uri = encodeInvoice(p);
  const r = decodeInvoice(uri);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.params!.recipient, ADDR);
  assert.equal(r.params!.token, TOKEN);
  assert.equal(r.params!.amount, '25500000');
  assert.equal(r.params!.memo, 'Konzultace březen #042');
  assert.equal(r.params!.network, 'testnet');
  assert.equal(r.params!.mode, 'private');
});

test('encoded URI has aztec: scheme and recipient in path', () => {
  const uri = encodeInvoice({ recipient: ADDR, token: TOKEN, amount: '1' });
  assert.ok(uri.startsWith(`aztec:${ADDR}?`));
});

test('rejects decimal amount', () => {
  assert.throws(() => encodeInvoice({ recipient: ADDR, token: TOKEN, amount: '25.5' }));
  assert.ok(validate({ recipient: ADDR, token: TOKEN, amount: '25.5' }).some((e) => e.field === 'amount'));
});

test('rejects invalid recipient / token', () => {
  assert.ok(validate({ recipient: 'nope', token: TOKEN, amount: '1' }).some((e) => e.field === 'recipient'));
  assert.ok(validate({ recipient: ADDR, token: '0xZZ', amount: '1' }).some((e) => e.field === 'token'));
});

test('rejects bad mode / network', () => {
  assert.ok(validate({ recipient: ADDR, token: TOKEN, amount: '1', mode: 'secret' as never }).some((e) => e.field === 'mode'));
  assert.ok(validate({ recipient: ADDR, token: TOKEN, amount: '1', network: 'devnet' as never }).some((e) => e.field === 'network'));
});

test('decode surfaces unknown params but still parses known ones', () => {
  const r = decodeInvoice(`aztec:${ADDR}?token=${TOKEN}&amount=100&reference=INV-042&expiry=999`);
  assert.equal(r.ok, true);
  assert.deepEqual(r.unknownParams.sort(), ['expiry', 'reference']);
});

test('decode rejects non-aztec scheme', () => {
  const r = decodeInvoice(`ethereum:${ADDR}?amount=1`);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.field === 'scheme'));
});

test('memo with special chars survives round-trip', () => {
  const memo = 'Faktura #7 — 50% záloha & DPH';
  const uri = encodeInvoice({ recipient: ADDR, token: TOKEN, amount: '1', memo });
  assert.equal(decodeInvoice(uri).params!.memo, memo);
});

test('toBaseUnits / fromBaseUnits are integer-safe', () => {
  assert.equal(toBaseUnits('25.5', 6), '25500000');
  assert.equal(toBaseUnits('0.000001', 6), '1');
  assert.equal(toBaseUnits('100', 0), '100');
  assert.equal(toBaseUnits('1000000', 18), '1000000000000000000000000');
  assert.equal(fromBaseUnits('25500000', 6), '25.5');
  assert.equal(fromBaseUnits('1', 6), '0.000001');
  assert.equal(fromBaseUnits('1000000000000000000', 18), '1');
  assert.equal(fromBaseUnits(toBaseUnits('0.1', 18), 18), '0.1');
});

test('toBaseUnits rejects too many decimals', () => {
  assert.throws(() => toBaseUnits('1.1234567', 6));
});

test('shortenAddress produces figma-style middle ellipsis', () => {
  const out = shortenAddress('0x21852de10424512d0f76da45c53b68b30f76da45c000000000000000000000000');
  assert.ok(out.startsWith('0x21852de1042'));
  assert.ok(out.includes('..'));
});
