// npm run bench oder npm run bench -- 1000
import os from 'node:os';
import * as js from './js/algorithms.js';
import * as wasm from './build/benchmark.js';
import { runBenchmarks } from './js/benchmarks.js';

const runs = Number(process.argv[2] ?? 100);
if (!Number.isInteger(runs) || runs < 1) {
  console.error('Anzahl der Wiederholungen muss eine positive ganze Zahl sein, z. B.: npm run bench -- 1000');
  process.exit(1);
}

const ms = x => x.toFixed(2).padStart(8) + ' ms';
const tty = process.stdout.isTTY;
const started = performance.now();

function progressBar({ done, total, label }) {
  if (!tty) return;
  const width = 30;
  const frac = done / total;
  const elapsed = (performance.now() - started) / 1000;
  const eta = frac > 0 ? elapsed / frac - elapsed : 0;
  const bar = '█'.repeat(Math.round(frac * width)).padEnd(width, '░');
  process.stdout.write(`\r${bar} ${(frac * 100).toFixed(0).padStart(3)} %  ${label.padEnd(22)} noch ca. ${eta.toFixed(0)} s   `);
}
const clearLine = () => tty && process.stdout.write('\r' + ' '.repeat(100) + '\r');

console.log(`Node ${process.version} (V8 ${process.versions.v8}) · ${os.cpus()[0].model}`);
console.log(`${runs} Wiederholungen pro Funktion und Sprache (+ 5 Aufwärmrunden)\n`);
console.log('Funktion                 Parameter        JS Median   Wasm Median   Faktor    JS σ       Wasm σ    gleich');
console.log('-'.repeat(108));

const rows = runBenchmarks(js, wasm, {
  runs,
  onProgress: progressBar,
  onResult: r => {
    clearLine();
    console.log(
      r.label.padEnd(25) + r.params.padEnd(15) + ms(r.js.median) + '   ' + ms(r.wasm.median) +
      (r.speedup.toFixed(2) + '×').padStart(9) + '  ' + ms(r.js.sd) + '  ' + ms(r.wasm.sd) + '  ' +
      (r.sameResult ? 'ja' : `NEIN (${r.jsResult} / ${r.wasmResult})`)
    );
  },
});
clearLine();

const jsTotal = rows.reduce((a, r) => a + r.js.total, 0);
const wasmTotal = rows.reduce((a, r) => a + r.wasm.total, 0);
console.log('-'.repeat(108));
console.log(`Gesamtzeit gemessen: JavaScript ${(jsTotal / 1000).toFixed(1)} s · AssemblyScript ${(wasmTotal / 1000).toFixed(1)} s · Laufzeit ${((performance.now() - started) / 1000).toFixed(0)} s`);
console.log('\nFaktor = Median JS / Median Wasm (> 1: WebAssembly schneller, < 1: JavaScript schneller)');
console.log('σ = Standardabweichung der Einzelmessungen');
if (rows.some(r => !r.sameResult)) process.exitCode = 1;
