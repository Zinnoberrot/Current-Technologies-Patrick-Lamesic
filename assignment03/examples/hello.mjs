// führt das einstiegsbeispiel aus, npm run hello
import { add, factorial, isPrime, greet } from '../build/hello.js';

console.log('add(2, 3)        =', add(2, 3));
console.log('factorial(20)    =', factorial(20), '(BigInt, weil i64)');
console.log('isPrime(97)      =', isPrime(97));
console.log('isPrime(100)     =', isPrime(100));
console.log('greet("Patrick") =', greet('Patrick'));
