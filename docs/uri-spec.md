# Aztec Invoice URI — specifikace v1

Offchain platební/fakturační URI pro Aztec Network. Inspirováno EIP-681 a BIP-21,
přizpůsobeno specifikům Aztecu (privátní/veřejné zůstatky, sítě, formát adres).

## Formát

```
aztec:<recipient>?token=<token>&amount=<baseUnits>[&memo=<text>][&network=<net>][&mode=<private|public>][&v=1]
```

- `recipient` je v path části (jako `ethereum:0x…` v EIP-681).
- Ostatní pole jsou query parametry, kódování `application/x-www-form-urlencoded`, UTF-8.

## Pole

| Pole | Pozice | Povinné | Typ | Popis |
|------|--------|:------:|-----|-------|
| `recipient` | path | ✅ | AztecAddress | Adresa příjemce platby. `0x` + až 64 hex (field element). |
| `token` | query | ✅ | AztecAddress | Adresa token kontraktu, kterým se má platit. |
| `amount` | query | ✅ | integer | Částka v **atomických base units** (bez desetinné tečky). Např. `25500000` = 25.5 tokenu s 6 desetinnými místy. |
| `memo` | query | ⭕ | string | Lidská poznámka k faktuře (URL-enkódovaná). **Není** to Aztec „note" (UTXO) — je to jen metadata. |
| `network` | query | ⭕ | enum | `mainnet` \| `testnet` \| `sandbox`. Ochrana proti platbě na špatné síti. Default: dle konfigurace aplikace. |
| `mode` | query | ⭕ | enum | `private` \| `public`. Na který zůstatek příjemce platba míří. Default: `private`. |
| `v` | query | ⭕ | integer | Verze schématu. Default `1`. |

### Terminologická poznámka: `memo` vs `note`

Na Aztecu je **note** základní privátní stavový primitiv — šifrovaný UTXO, ve kterém
jsou uložené např. token zůstatky. Poznámka na faktuře je lidsky čitelný text a s tímto
primitivem nesouvisí, proto se pole jmenuje `memo` (ne `note`), aby nedocházelo k záměně.

## Validační pravidla

1. `amount` musí být nezáporný **celočíselný** řetězec v base units. Desetinná tečka = neplatné URI.
2. `recipient` a `token` musí být validní hex field elementy (`0x` + 1–64 hex znaků).
3. `mode`, pokud je uvedeno, musí být `private` nebo `public`.
4. Neznámé query parametry se **ignorují** (forward-compat).
5. Převod z zobrazovací částky na base units dělá generátor: `baseUnits = displayAmount × 10^decimals`.

## Příklady

**Minimální:**
```
aztec:0xabc123?token=0xdef456&amount=25500000
```

**Typická faktura (25.5 USDC, privátně, testnet):**
```
aztec:0x1f3a…9c?token=0x88ce…21&amount=25500000&memo=Konzultace%20b%C5%99ezen&network=testnet&mode=private
```

**Veřejná platba bez poznámky:**
```
aztec:0x1f3a…9c?token=0x88ce…21&amount=100000000&mode=public
```

## Design rozhodnutí

- **Base units u `amount`**: jednoznačné, bez zaokrouhlovacích chyb. Cena: peněženka/parser
  potřebuje znát `decimals` tokenu pro zobrazení (dotáže token kontrakt nebo lokální seznam).
- **Rozsah polí**: „Core + Aztec" — základní čtyři (adresa, token, částka, poznámka)
  plus Aztec-kritické `network` a `mode`. `reference`/`expiry` lze doplnit v budoucí verzi.
- **Schéma `aztec:`**: kopíruje konvenci `ethereum:` z EIP-681.
