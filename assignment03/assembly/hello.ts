// einstiegsbeispiel für assemblyscript

export function add(a: i32, b: i32): i32 {
  return a + b;
}

// i64, kommt in js als bigint an
export function factorial(n: i32): i64 {
  let result: i64 = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function isPrime(n: i32): bool {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) {
    if (n % d == 0) return false;
  }
  return true;
}

// strings werden über die bindings kopiert
export function greet(name: string): string {
  return "Hallo " + name + ", grüße aus WebAssembly!";
}
