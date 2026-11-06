// messablauf für bench.mjs und web/worker.js

// größen so gewählt, dass ein aufruf nur ein paar ms dauert
export const CASES = [
  { name: 'fibonacci',      label: 'Fibonacci rekursiv',    params: 'n = 30',         args: [30] },
  { name: 'sieve',          label: 'Sieb des Eratosthenes', params: 'n = 2.000.000',  args: [2_000_000] },
  { name: 'bubbleSort',     label: 'Bubble Sort',           params: 'n = 5.000',      args: [5_000, 12345] },
  { name: 'insertionSort',  label: 'Insertion Sort',        params: 'n = 8.000',      args: [8_000, 12345] },
  { name: 'mergeSort',      label: 'Merge Sort',            params: 'n = 100.000',    args: [100_000, 12345] },
  { name: 'matrixMultiply', label: 'Matrixmultiplikation',  params: '200 × 200',      args: [200] },
];

function stats(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  const mean = s.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const median = n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2;
  return { median, mean, sd, min: s[0], max: s[n - 1], total: mean * n };
}

function time(fn, args) {
  const t0 = performance.now();
  const result = fn(...args);
  return { ms: performance.now() - t0, result };
}

// erst aufwärmen (jit), dann messen, verglichen wird der median
export function runBenchmarks(js, wasm, { warmup = 5, runs = 100, onProgress = () => {}, onResult = () => {} } = {}) {
  const rows = [];
  const totalSteps = CASES.length * (warmup + runs);
  let step = 0;
  let lastReport = 0;
  const progress = (c, force = false) => {
    const now = performance.now();
    if (force || now - lastReport > 100) {
      lastReport = now;
      onProgress({ done: step, total: totalSteps, label: c.label });
    }
  };

  for (const c of CASES) {
    for (let i = 0; i < warmup; i++) {
      js[c.name](...c.args);
      wasm[c.name](...c.args);
      step++;
      progress(c);
    }
    const jsTimes = [], wasmTimes = [];
    let jsResult, wasmResult;
    for (let i = 0; i < runs; i++) {
      // reihenfolge abwechseln
      if (i % 2 === 0) {
        ({ ms: jsTimes[i], result: jsResult } = time(js[c.name], c.args));
        ({ ms: wasmTimes[i], result: wasmResult } = time(wasm[c.name], c.args));
      } else {
        ({ ms: wasmTimes[i], result: wasmResult } = time(wasm[c.name], c.args));
        ({ ms: jsTimes[i], result: jsResult } = time(js[c.name], c.args));
      }
      step++;
      progress(c);
    }
    const row = {
      name: c.name, label: c.label, params: c.params, runs,
      js: stats(jsTimes),
      wasm: stats(wasmTimes),
      jsResult, wasmResult,
      sameResult: jsResult === wasmResult,
    };
    row.speedup = row.js.median / row.wasm.median;
    rows.push(row);
    progress(c, true);
    onResult(row);
  }
  return rows;
}
