# HaxFootball 1

HaxFootball 1 is the node-haxball implementation of the HaxFootball room program. It is maintained independently from [HaxFootball 2](https://github.com/haxbrasil/haxfootball), which uses haxball-rs.

## Engine boundaries

- node-haxball is the room backend.
- Presnap LOS violations reject the hike; this version does not use physical LOS blocker planes.
- Native score mutation and `!setscore` are not supported.
- Replay recording uses node-haxball's start/stop lifecycle.
- haxball-rs trace buffers, incident dumps, recording snapshots, and desync-verifier controls are not present.

## Development

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm test -- --run
pnpm run build
pnpm run format:ci
pnpm run lint
pnpm run states:check
```

To open a local room, provide a fresh HaxBall headless token:

```sh
LANGUAGE=pt-BR DEBUG=true TOKEN="<token>" pnpm run dev:node
```

Release artifacts are published as `room-vX.Y.Z.tgz` through the repository's release workflow.
