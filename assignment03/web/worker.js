// eigener thread, damit die seite nicht hängt
import * as js from '../js/algorithms.js';
import * as wasm from '../build/benchmark.js';
import { runBenchmarks } from '../js/benchmarks.js';

self.onmessage = ({ data }) => {
  const rows = runBenchmarks(js, wasm, {
    runs: data.runs,
    onProgress: p => self.postMessage({ type: 'progress', ...p }),
    onResult: row => self.postMessage({ type: 'result', row }),
  });
  self.postMessage({ type: 'done', rows });
};

self.postMessage({ type: 'ready' });
