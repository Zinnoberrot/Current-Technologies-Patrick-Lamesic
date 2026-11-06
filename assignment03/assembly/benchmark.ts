// gegenstück zu js/algorithms.js, nur zahlen rein, prüfsumme raus

// xorshift32, gleiche zahlen wie in js
function randomArray(n: i32, seed: u32): StaticArray<i32> {
  const a = new StaticArray<i32>(n);
  let x = seed;
  for (let i = 0; i < n; i++) {
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    unchecked(a[i] = <i32>x);
  }
  return a;
}

// -1 wenn nicht sortiert
function checksum(a: StaticArray<i32>): i32 {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    if (unchecked(a[i - 1]) > unchecked(a[i])) return -1;
  }
  return unchecked(a[0]) + unchecked(a[n >> 1]) + unchecked(a[n - 1]);
}

// fibonacci rekursiv

export function fibonacci(n: i32): i32 {
  return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}

// sieb des eratosthenes

export function sieve(n: i32): i32 {
  const composite = new StaticArray<u8>(n + 1);
  let count = 0;
  for (let i = 2; i <= n; i++) {
    if (unchecked(composite[i]) == 0) {
      count++;
      for (let j = <i64>i * i; j <= n; j += i) unchecked(composite[<i32>j] = 1);
    }
  }
  return count;
}

// bubble sort (algo & dat)

export function bubbleSort(n: i32, seed: u32): i32 {
  const a = randomArray(n, seed);
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      const x = unchecked(a[j]);
      const y = unchecked(a[j + 1]);
      if (x > y) {
        unchecked(a[j] = y);
        unchecked(a[j + 1] = x);
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return checksum(a);
}

// insertion sort (algo & dat)

export function insertionSort(n: i32, seed: u32): i32 {
  const a = randomArray(n, seed);
  for (let i = 1; i < n; i++) {
    const key = unchecked(a[i]);
    let j = i - 1;
    while (j >= 0 && unchecked(a[j]) > key) {
      unchecked(a[j + 1] = unchecked(a[j]));
      j--;
    }
    unchecked(a[j + 1] = key);
  }
  return checksum(a);
}

// merge sort (algo & dat)

function merge(a: StaticArray<i32>, tmp: StaticArray<i32>, left: i32, mid: i32, right: i32): void {
  let i = left, j = mid, k = left;
  while (i < mid && j < right) {
    const x = unchecked(a[i]);
    const y = unchecked(a[j]);
    if (x <= y) { unchecked(tmp[k++] = x); i++; }
    else        { unchecked(tmp[k++] = y); j++; }
  }
  while (i < mid)   unchecked(tmp[k++] = unchecked(a[i++]));
  while (j < right) unchecked(tmp[k++] = unchecked(a[j++]));
  for (let m = left; m < right; m++) unchecked(a[m] = unchecked(tmp[m]));
}

function mergeSortRange(a: StaticArray<i32>, tmp: StaticArray<i32>, left: i32, right: i32): void {
  if (right - left < 2) return;
  const mid = (left + right) >> 1;
  mergeSortRange(a, tmp, left, mid);
  mergeSortRange(a, tmp, mid, right);
  merge(a, tmp, left, mid, right);
}

export function mergeSort(n: i32, seed: u32): i32 {
  const a = randomArray(n, seed);
  const tmp = new StaticArray<i32>(n);
  mergeSortRange(a, tmp, 0, n);
  return checksum(a);
}

// matrixmultiplikation

export function matrixMultiply(n: i32): f64 {
  const size = n * n;
  const A = new StaticArray<f64>(size);
  const B = new StaticArray<f64>(size);
  const C = new StaticArray<f64>(size);
  for (let i = 0; i < size; i++) {
    unchecked(A[i] = <f64>(i % 7) * 0.5);
    unchecked(B[i] = <f64>(i % 5) * 0.25);
  }
  // reihenfolge i/k/j, cachefreundlicher
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      const aik = unchecked(A[i * n + k]);
      for (let j = 0; j < n; j++) {
        unchecked(C[i * n + j] += aik * unchecked(B[k * n + j]));
      }
    }
  }
  let sum: f64 = 0;
  for (let i = 0; i < size; i++) sum += unchecked(C[i]);
  return sum;
}
