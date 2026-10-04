#!/bin/zsh
set -e
cd "${0:A:h}/../.."
workbench_node="${WORKBENCH_NODE:-$(command -v node || true)}"
if [[ -z "$workbench_node" ]] || ! "$workbench_node" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a===24&&b>=19?0:1)' 2>/dev/null; then
  for candidate in /private/tmp/hns-exec-runtime.*/node-v24.19.0-darwin-arm64/bin/node(N); do workbench_node="$candidate"; break; done
fi
if [[ -z "$workbench_node" ]] || ! "$workbench_node" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a===24&&b>=19?0:1)' 2>/dev/null; then
  print '需要 Node 24.19+。請安裝後再啟動，或指定 WORKBENCH_NODE。'; exit 1
fi
export PATH="${workbench_node:h}:$PATH"
if [[ ! -d harness/node_modules ]]; then npm --prefix harness ci; fi
npm --prefix harness run build
export WORKBENCH_DATA_DIR="${WORKBENCH_DATA_DIR:-$HOME/Documents/AI工作台資料}"
export WORKBENCH_PORT="${WORKBENCH_PORT:-4319}"
( sleep 2; open "http://127.0.0.1:$WORKBENCH_PORT" ) &
exec "$workbench_node" apps/workbench/server.mjs
