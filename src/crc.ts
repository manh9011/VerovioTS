/**
 * Pure TypeScript translation of src/crc/crc.cpp + include/crc/crc.h.
 * The repository selects CRC-32 at compile time, with reflected input/output.
 * All arithmetic is masked to uint32 to reproduce unsigned int behavior.
 */

export const CRC_NAME = "CRC-32" as const;
export const POLYNOMIAL = 0x04c11db7 >>> 0;
export const INITIAL_REMAINDER = 0xffffffff >>> 0;
export const FINAL_XOR_VALUE = 0xffffffff >>> 0;
export const REFLECT_DATA = true as const;
export const REFLECT_REMAINDER = true as const;
export const CHECK_VALUE = 0xcbf43926 >>> 0;

const WIDTH = 32;
const TOPBIT = 0x80000000 >>> 0;

let crcTable = new Uint32Array(256);

function reflect(data: number, nBits: number): number {
  let reflection = 0;
  for (let bit = 0; bit < nBits; ++bit) {
    if ((data & 0x01) !== 0) {
      reflection = (reflection | (1 << ((nBits - 1) - bit))) >>> 0;
    }
    data >>>= 1;
  }
  return reflection >>> 0;
}

function reflectDataByte(value: number): number {
  return reflect(value & 0xff, 8) & 0xff;
}

function reflectRemainder(value: number): number {
  return reflect(value >>> 0, WIDTH) >>> 0;
}

export function crcInit(): void {
  for (let dividend = 0; dividend < 256; ++dividend) {
    let remainder = (dividend << (WIDTH - 8)) >>> 0;
    for (let bit = 8; bit > 0; --bit) {
      if ((remainder & TOPBIT) !== 0) {
        remainder = ((remainder << 1) ^ POLYNOMIAL) >>> 0;
      } else {
        remainder = (remainder << 1) >>> 0;
      }
    }
    crcTable[dividend] = remainder >>> 0;
  }
}

export function crcSlow(message: Uint8Array, nBytes: number = message.length): number {
  let remainder = INITIAL_REMAINDER;
  for (let byte = 0; byte < nBytes; ++byte) {
    remainder = (remainder ^ (reflectDataByte(message[byte]) << (WIDTH - 8))) >>> 0;
    for (let bit = 8; bit > 0; --bit) {
      if ((remainder & TOPBIT) !== 0) {
        remainder = ((remainder << 1) ^ POLYNOMIAL) >>> 0;
      } else {
        remainder = (remainder << 1) >>> 0;
      }
    }
  }
  return (reflectRemainder(remainder) ^ FINAL_XOR_VALUE) >>> 0;
}

export function crcFast(message: Uint8Array, nBytes: number = message.length): number {
  let remainder = INITIAL_REMAINDER;
  for (let byte = 0; byte < nBytes; ++byte) {
    const data = (reflectDataByte(message[byte]) ^ (remainder >>> (WIDTH - 8))) & 0xff;
    remainder = (crcTable[data] ^ (remainder << 8)) >>> 0;
  }
  return (reflectRemainder(remainder) ^ FINAL_XOR_VALUE) >>> 0;
}

// C++ callers are required to invoke crcInit() before crcFast().
// Keep that contract explicit instead of hiding initialization in crcFast().
crcInit();
