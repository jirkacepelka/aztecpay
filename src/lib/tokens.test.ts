import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOKENS } from './tokens.ts';
import { isHexFieldElement, encodeInvoice, toBaseUnits } from './uri.ts';

test('every registry token has a valid AztecAddress and encodes into a URI', () => {
  for (const t of TOKENS) {
    assert.ok(
      isHexFieldElement(t.address),
      `${t.symbol} address invalid (len ${t.address.length}): ${t.address}`,
    );
    const uri = encodeInvoice({
      recipient: '0x1f3a4b5c6d7e8f90112233445566778899aabbccddeeff0011223344556677',
      token: t.address,
      amount: toBaseUnits('1', t.decimals),
    });
    assert.ok(uri.startsWith('aztec:'));
  }
});
