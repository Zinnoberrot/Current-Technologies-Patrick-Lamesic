# Assignment 3 – WebAssembly mit AssemblyScript

Kleines AssemblyScript-Beispiel und Laufzeitvergleich zwischen AssemblyScript (WebAssembly) und JavaScript. Drei der Funktionen sind Sortierverfahren aus Algorithmen & Datenstrukturen (Bubble, Insertion und Merge Sort). Sie wurden dort in C++ umgesetzt und hier neu in AssemblyScript und JavaScript implementiert.

## Starten

Voraussetzung: Node.js ab Version 18.

```bash
npm install             # AssemblyScript-Compiler installieren
npm run build           # assembly/*.ts nach build/*.wasm kompilieren
npm run hello           # Beispiel ausführen
npm run bench           # Benchmark, 100 Wiederholungen
npm run bench -- 1000   # Benchmark mit beliebiger Anzahl Wiederholungen
npm start               # Browser-Version: http://localhost:8000/web/
```

## WebAssembly und AssemblyScript

WebAssembly (Wasm) ist ein binäres Format, das im Browser und in Node.js neben JavaScript ausgeführt wird. Es wird aus anderen Sprachen kompiliert. AssemblyScript verwendet dafür eine TypeScript-ähnliche Syntax, aber mit festen Typen wie `i32`, `i64` und `f64` statt `number`. Zwischen JavaScript und Wasm werden direkt nur Zahlen übergeben. Strings und Arrays müssen in den Speicher des Wasm-Moduls kopiert werden, das übernehmen die vom Compiler erzeugten Bindings.

## Beispiel

[assembly/hello.ts](assembly/hello.ts) enthält vier kleine Funktionen:

```
$ npm run hello
add(2, 3)        = 5
factorial(20)    = 2432902008176640000n (BigInt, weil i64)
isPrime(97)      = true
isPrime(100)     = false
greet("Patrick") = Hallo Patrick, grüße aus WebAssembly!
```

`npm run build` erzeugt außerdem [build/hello.wat](build/hello.wat), die Textform des kompilierten Moduls.

## Laufzeitvergleich

Alle Funktionen sind zweimal gleich implementiert: in [assembly/benchmark.ts](assembly/benchmark.ts) und in [js/algorithms.js](js/algorithms.js).

| Funktion | Größe |
|---|---|
| Fibonacci rekursiv | n = 30 |
| Sieb des Eratosthenes | n = 2.000.000 |
| Bubble Sort | n = 5.000 |
| Insertion Sort | n = 8.000 |
| Merge Sort | n = 100.000 |
| Matrixmultiplikation | 200 × 200 |

Damit der Vergleich fair ist, erzeugen beide Seiten dieselben Zufallszahlen (gleicher Generator und Seed). Jede Funktion gibt eine Prüfsumme zurück, damit kontrolliert werden kann, dass JS und Wasm dasselbe Ergebnis liefern. Vor der Messung gibt es einige Aufwärmrunden. Danach läuft jede Funktion wählbar oft, verglichen wird der Median.

Im Browser läuft der Benchmark in einem Web Worker. Dort gibt es einen Fortschrittsbalken und die Ergebnisse als Tabelle und Diagramm.

### Ergebnisse

Node v24.12.0, AMD Ryzen 7 PRO 7840U, 1000 Wiederholungen:

| Funktion | JS Median | Wasm Median | Faktor |
|---|---:|---:|---:|
| Fibonacci rekursiv | 6,68 ms | 4,71 ms | 1,42× |
| Sieb des Eratosthenes | 5,34 ms | 4,89 ms | 1,09× |
| Bubble Sort | 9,56 ms | 9,31 ms | 1,03× |
| Insertion Sort | 10,62 ms | 13,06 ms | 0,81× |
| Merge Sort | 10,63 ms | 7,02 ms | 1,51× |
| Matrixmultiplikation | 7,21 ms | 5,78 ms | 1,25× |

Faktor = Zeit JS ÷ Zeit Wasm (über 1 ist Wasm schneller). Alle Prüfsummen waren gleich.

### Fazit

- WebAssembly war bei 5 von 6 Funktionen schneller, aber nur um den Faktor 1,03 bis 1,51.
- Am größten war der Unterschied bei Merge Sort und Fibonacci, bei Bubble Sort und dem Sieb lagen beide fast gleichauf.
- Insertion Sort war in JavaScript schneller. WebAssembly ist also nicht automatisch schneller.

## Zusätzlich umgesetzt

- Faire Messung: gleiche Zufallszahlen auf beiden Seiten, Aufwärmrunden, JS und Wasm laufen abwechselnd, und die Ergebnisse werden über Prüfsummen verglichen.
- Wählbare Anzahl an Wiederholungen (10 bis 10.000), Auswertung mit Median und Standardabweichung.
- Browser-Version mit Web Worker, damit die Seite während der Messung bedienbar bleibt, dazu Fortschrittsbalken, Abbrechen-Button und Diagramm.
- Fortschrittsbalken mit Restzeit auch im Terminal.
