$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$node = Join-Path $root ".tools\node22\node.exe"
$next = Join-Path $root "node_modules\next\dist\bin\next"
$port = if ($env:PORT) { $env:PORT } else { "3100" }

if (-not $env:DEMO_MODE) {
  $env:DEMO_MODE = "true"
}

$env:NEXT_TEST_WASM = "1"
$env:NEXT_TEST_WASM_DIR = Join-Path $root "node_modules\@next\swc-wasm-nodejs"

& $node $next "dev" "--port" $port
