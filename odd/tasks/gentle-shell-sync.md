# Gentle Shell ↔ gentle-ai sync guard

Scope: user-owned tooling outside `%LOCALAPPDATA%\gentle-shell\install`. No upstream contribution (project belongs to a third party).

## Specs

**S1** — User request, verbatim:

> Primero , quiero que al actualizar gentle-ai se actualice correctamente gs con el contrato , quiero que al hacer lo de gs update o gs update --all se actualice todo lod e gentle-shell incluidas sus extensiones a la ultima version , correctamente y evitar el problema de sicnronizacion ya que cuando gentle-ai actualiza engram o algo se rompe y eso no deberia pasar constantemente en gs , podrias solucionarlo ? quiero que siempre se sincronice correctamente gs y gentle-ai sin problema

**S2** — User constraint, verbatim:

> el problema es que gentle es de otra persona por lo que no existe pr ni push ni nada de eso mi instalacion es lo quiero que se actualice correctamente cuando ellos sacan release o cosas y poder actualizarme sin problemas

**S3** — Authorized route, verbatim selection: `L1 + L2 + L3 (alinear a stable y poner el guard)` — backup + re-provision to channel `stable` + a sync guard that fails closed.

**S4** — Observed break (measured, not assumed): `gs` is a `separate` install on channel `main` pinned at commit `a9d3f56` → `gentle-pi` 4.8.0; the paired native binary is declared by `INSTALLER_VERSION = "4.5.0"` in `stock-gentle-pi/scripts/gentle-ai-installer.mjs:25`. The package-local `prefix/node_modules/gentle-pi/.gentle-ai/v4.5.0/gentle-ai.exe` is absent, so the RDD status reader cannot resolve native status and reports `unknown (native status unavailable)`. `gs update --all` never repairs this: it updates Pi and extensions inside the frozen prefix only.

**S5** — Observed contract gap (upstream, out of reach): no `shell update` exists; `gentle-ai shell --help` states `Separate only. No Shared, update, force, recovery`. `gentle-ai update/upgrade` manages only its own tools and has no knowledge of the isolated target. Nothing validates package↔binary version compatibility.

**S6** — Derived constraints (authorized by S3, not additional user requirements):
- C1 The guard runs before launch, fails closed (non-zero exit, no launch) on any contract divergence, and prints the exact repair command.
- C2 Nothing is written inside `install/`; every artifact lives in user-owned paths that `gs update` cannot overwrite.
- C3 Any destructive step is preceded by a verified backup and is never a blanket restore or clean.
- C4 Re-provisioning uses only the owned flow `gentle-ai shell install --target <install> --mode separate --channel stable --inspect` → `--confirm <sha>`; a refusal stops the operation and is reported, never forced.
- C5 Re-provisioning runs outside a live `gs` session, because it replaces the prefix that session executes from.

**S7** — Isolation invariant: a healthy `gs` depends exclusively on its own package-local native binary. Global `~/.gentle-ai/state.json` drift is informational and never a failure, because `gs` is a `separate` install.

## Tasks

| ID | Specs | Route | Commit | State |
| --- | --- | --- | --- | --- |
| T1 | S3, C1, C2, C3, S7 | writer: `gs-sync` in POSIX sh with `status`/`check`/`backup`/`realign`/`install`/`uninstall`/`hooks` | n/a (no repo) | done |
| T2 | S3, C1, C2 | writer: `.bashrc` hook block wiring `gs`/`gentle-shell` through `check` | n/a | done |
| T3 | C1, C3, S7 | writer: fixture-based tests, RED first, covering divergence, healthy, missing local binary, global-only drift | n/a | done |
| T4 | S2, S5, C4, C5 | writer: runbook with `update`/`realign`/`repair` flows | n/a | done |
| T5 | S4 | writer: repair the missing package-local native bundle in place (run the package's own postinstall) | n/a | done |
| T6 | S4, S7 | verify: pair aligned, package-local binary present, RDD status readable | n/a | done |
| T7 | S3, C4, C5 | HITL: migrate the shell to a fresh `stable` root and swap (clean terminal, outside `gs`) | n/a | blocked |
| T8 | — | cleanup: stale installs, old installer backups, scratch, cache, legacy npm package | n/a | done |

## Log

**L1** — S1 verbatim (original request).

**L2** — S2 verbatim (no upstream PR/push; installation must update correctly against upstream releases).

**L3** — Diagnosis delivered by the parent with evidence: channel `main` snapshot pin `a9d3f56`; `INSTALLER_VERSION = "4.5.0"`; missing package-local `v4.5.0` binary; `state.json` reporting `5.0.0` while both binaries self-report `4.5.1-0.20261117215211-066208d79d33`; upstream has no `shell update`.

**L4** — User selected route `L1 + L2 + L3 (alinear a stable y poner el guard)` (S3).

**L5** — Measured shim surface: `~/.bashrc:38` prepends `~/.local/share/shell-shims`; `gs` → `gentle-shell` → `install/bin/gentle-shell.cmd` → `supervisor.exe shell launch <install> gentle-shell %*`.

**L6** — Root cause corrected. `gentle-pi` never ships the native binary in its tarball (verified for 4.4.0, 4.8.0 and 5.0.0: no `.gentle-ai/` entries, `scripts.postinstall` = `node scripts/install-gentle-ai.mjs`, which downloads on macOS/Linux and `go install`s on Windows into `<packageDir>/.gentle-ai/v<INSTALLER_VERSION>/gentle-ai.exe`). In the installed 4.8.0 prefix that directory did not exist at all, so the RDD reader could not resolve native status. Fix: ran the package's own postinstall (`go install` with Go 1.27.4) → `v4.5.0/gentle-ai.exe` (29 MB) → `gentle-ai review mode status` now answers `receipt-driven development: on (decided by default)`.

**L7** — Guard defect rounds, all found by running the tool in the real environment, each fixed with a RED-first test: (1) hook returned 0 after negating the guard status, so a blocked launch reported success; (2) `status`/`check` wrote temp files; (3) `realign` accepted a missing, ambiguous or uppercase inspect digest and could reach the destructive install; (4) `.bashrc` staging crossed filesystems instead of renaming atomically; (5) empty `gentlePi` parsed as healthy; (6) tests were tautological (asserted only exit codes); (7) the suite was NOT hermetic and wrote six real backups into the live `install/state/gentle-shell/backups`; (8) the backup root and the install target resolved from remapped `$LOCALAPPDATA`/`$HOME`/`$USERPROFILE`, landing inside the install tree and in the isolated home; (9) real-home resolution cannot rely on `getent` (absent) or `$USERNAME` (unset) and now derives structurally from the install root.

**L8** — Isolated-session environment, measured: `$HOME` and `$USERPROFILE` = `<root>/home`, `$LOCALAPPDATA` = `<root>/state`, `$USERNAME` unset, `getent` absent, `id -un` = `Deus`. Every path default in any tool touching this machine must be marker-verified, never derived by string concatenation from those variables.

**L9** — Guard installed and verified on the real profile: `install` resolved `/c/Users/Deus` structurally, wrote `~/.local/bin/gs-sync` and the delimited block at `~/.bashrc:138-162`, left the isolated home untouched, and a blocked launch returns `rc=1` with `missing-install` + repair hint.

**L10** — Cleanup executed with a verified fresh backup (`backups/20261123T222521Z`, manifest present): removed `install.replaced-20261117T175009Z` (1009 MB), four old installer backups (209 MB), `cache` (92 MB), `install/tmp` scratch (46 MB) and the stale `Roaming/npm/node_modules/gentle-pi` 4.7.0-main (249 MB). Kept: `AppData/Local/Gentle Dot` (another product's runtime), `go/bin` (development builds), `Documents/dev/gentle-dot`, `.pi/gentle-ai` (40 MB cache) and the remaining 1.5 GB of unrelated global npm tools in `Roaming/npm`, which are not on `PATH` but are not this feature's to delete.
