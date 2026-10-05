/**
 * Canonical translation of include/vrv/devicecontext.h + src/devicecontext.cpp.
 *
 * The runtime implementation lives in `./bboxdevicecontext` as
 * `DeviceContextCompat` (structural boundary introduced Pass 207, extended
 * Pass 313 + device base-state pass with SetPen/SetBrush/SetFont stacks,
 * view-box/size state, Deactivate/Reactivate, RGB2Int, text extents).
 * This module is the path-aligned home (`devicecontext.cpp` ->
 * `devicecontext.ts`) so basename audits resolve; it re-exports the canonical
 * implementation without duplicating logic.
 */
export { DeviceContextCompat as DeviceContext } from './bboxdevicecontext';
export type { DeviceContextDependencies, ExtentGlyphLike, GlyphResourcesLike } from './bboxdevicecontext';

/** Canonical `DegToRad` from devicecontext.h extern "C" block. */
export function DegToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

/** Canonical `RadToDeg` from devicecontext.h extern "C" block. */
export function RadToDeg(deg: number): number {
  return (deg * 180.0) / Math.PI;
}
