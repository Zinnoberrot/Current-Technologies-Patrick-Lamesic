/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/hello/add
 * @param a `i32`
 * @param b `i32`
 * @returns `i32`
 */
export declare function add(a: number, b: number): number;
/**
 * assembly/hello/factorial
 * @param n `i32`
 * @returns `i64`
 */
export declare function factorial(n: number): bigint;
/**
 * assembly/hello/isPrime
 * @param n `i32`
 * @returns `bool`
 */
export declare function isPrime(n: number): boolean;
/**
 * assembly/hello/greet
 * @param name `~lib/string/String`
 * @returns `~lib/string/String`
 */
export declare function greet(name: string): string;
