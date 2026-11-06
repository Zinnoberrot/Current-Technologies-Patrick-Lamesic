// gleiche algorithmen wie in assembly/benchmark.ts, typed arrays damit es fair bleibt

function randomArray(n, seed) {
  const a = new Int32Array(n);
  let x = seed | 0;
  for (let i = 0; i < n; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    a[i] = x;
  }
  return a;
}

function checksum(a) {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    if (a[i - 1] > a[i]) return -1;
  }
  return (a[0] + a[n >> 1] + a[n - 1]) | 0;
}

// fibonacci rekursiv

export function fibonacci(n) {
  return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}

// sieb des eratosthenes

export function sieve(n) {
  const composite = new Uint8Array(n + 1);
  let count = 0;
  for (let i = 2; i <= n; i++) {
    if (composite[i] === 0) {
      count++;
      for (let j = i * i; j <= n; j += i) composite[j] = 1;
    }
  }
  return count;
}

// bubble sort

export function bubbleSort(n, seed) {
  const a = randomArray(n, seed);
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      const x = a[j];
      const y = a[j + 1];
      if (x > y) {
        a[j] = y;
        a[j + 1] = x;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return checksum(a);
}

// insertion sort

export function insertionSort(n, seed) {
  const a = randomArray(n, seed);
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return checksum(a);
}

// merge sort

function merge(a, tmp, left, mid, right) {
  let i = left, j = mid, k = left;
  while (i < mid && j < right) {
    const x = a[i];
    const y = a[j];
    if (x <= y) { tmp[k++] = x; i++; }
    else        { tmp[k++] = y; j++; }
  }
  while (i < mid)   tmp[k++] = a[i++];
  while (j < right) tmp[k++] = a[j++];
  for (let m = left; m < right; m++) a[m] = tmp[m];
}

function mergeSortRange(a, tmp, left, right) {
  if (right - left < 2) return;
  const mid = (left + right) >> 1;
  mergeSortRange(a, tmp, left, mid);
  mergeSortRange(a, tmp, mid, right);
  merge(a, tmp, left, mid, right);
}

export function mergeSort(n, seed) {
  const a = randomArray(n, seed);
  const tmp = new Int32Array(n);
  mergeSortRange(a, tmp, 0, n);
  return checksum(a);
}

// matrixmultiplikation

export function matrixMultiply(n) {
  const size = n * n;
  const A = new Float64Array(size);
  const B = new Float64Array(size);
  const C = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    A[i] = (i % 7) * 0.5;
    B[i] = (i % 5) * 0.25;
  }
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      const aik = A[i * n + k];
      for (let j = 0; j < n; j++) {
        C[i * n + j] += aik * B[k * n + j];
      }
    }
  }
  let sum = 0;
  for (let i = 0; i < size; i++) sum += C[i];
  return sum;
}
