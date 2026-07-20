# Aztec Project

## Critical: Use the `aztec` CLI, not `nargo` or `bb` directly

Always use the `aztec` CLI wrapper instead of calling `nargo` or `bb` directly:

- **Compile**: `aztec compile` (NOT `nargo compile`)
- **Test**: `aztec test` (NOT `nargo test`)
- **Prove**: NEVER call `bb` directly — proving goes through the aztec tooling
- **Formatting / docs**: `aztec-nargo fmt` and `aztec-nargo doc` are acceptable

Rationale: the `aztec` CLI pins the correct, version-matched Noir compiler and
Barretenberg backend inside the sandbox. Calling `nargo`/`bb` directly risks
version drift between the compiler, the proving backend, and the deployed
protocol.

## Error Handling: fail loudly, no silent fallbacks

Never silently swallow errors or substitute fallback values like
`AztecAddress.ZERO` for missing/invalid data. Throw immediately with a
descriptive message when a precondition is not met. A wrong-but-plausible
default in a privacy/proving system hides bugs that later surface as
unprovable state or leaked information.

## Version compatibility

Verify tool versions match before compiling or deploying:

- Keep the `aztec` sandbox, `aztec-nargo`, and the `@aztec/*` npm packages on
  the **same release version**.
- Use `aztec-up` to update the toolchain; pin the same version in
  `package.json` and `Nargo.toml`.

## Hashing: default to Poseidon2

Always use Poseidon2 unless a specific protocol requirement dictates otherwise:

```rust
use aztec::protocol::hash::poseidon2_hash;
```

Do NOT default to Pedersen hashing — Poseidon2 is the current
performance/standardization default in the Aztec stack.

## References

- Docs: https://docs.aztec.network
- AI tooling guide: https://docs.aztec.network/developers/ai_tooling
- llms.txt: https://docs.aztec.network/llms.txt
