/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/benchmark/fibonacci
 * @param n `i32`
 * @returns `i32`
 */
export declare function fibonacci(n: number): number;
/**
 * assembly/benchmark/sieve
 * @param n `i32`
 * @returns `i32`
 */
export declare function sieve(n: number): number;
/**
 * assembly/benchmark/bubbleSort
 * @param n `i32`
 * @param seed `u32`
 * @returns `i32`
 */
export declare function bubbleSort(n: number, seed: number): number;
/**
 * assembly/benchmark/insertionSort
 * @param n `i32`
 * @param seed `u32`
 * @returns `i32`
 */
export declare function insertionSort(n: number, seed: number): number;
/**
 * assembly/benchmark/mergeSort
 * @param n `i32`
 * @param seed `u32`
 * @returns `i32`
 */
export declare function mergeSort(n: number, seed: number): number;
/**
 * assembly/benchmark/matrixMultiply
 * @param n `i32`
 * @returns `f64`
 */
export declare function matrixMultiply(n: number): number;
