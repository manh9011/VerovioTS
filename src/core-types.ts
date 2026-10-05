export * from './vrvdef';

export type ClassIdLike = import('./vrvdef').ClassId | number;
export type BinaryComparator = (a: import('./vrvdef').ObjectLike, b: import('./vrvdef').ObjectLike) => boolean;
