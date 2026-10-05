/**
 * Pure TypeScript translation of Verovio's src/calcledgerlinesfunctor.cpp
 * / include/vrv/calcledgerlinesfunctor.h.
 *
 * Calculates ledger lines for notes and standalone accidentals, then shortens
 * overlapping ledger-line dashes per staff. Unmigrated tree/layout classes
 * (Note, Accid, Cursor, Layer, Staff, ...) are represented by structural
 * contracts; no layout algorithm is invented.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

// Canonical data_HORIZONTALALIGNMENT ordinals from src-cpp/libmei/dist/atttypes.h.
const HORIZONTALALIGNMENT_left = 1;
const HORIZONTALALIGNMENT_right = 2;
const HORIZONTALALIGNMENT_center = 3;
// StaffSearch::RESOLVE_CROSS_STAFF from src-cpp/include/vrv/layerelement.h.
const RESOLVE_CROSS_STAFF = 1;
// Cursor::InputMode::DURATION_FIRST from src-cpp/include/vrv/cursor.h.
const CURSOR_DURATION_FIRST = 1;

export interface LedgerLineDash {
  m_x1: number;
  m_x2: number;
}

export interface LedgerLineLike {
  m_dashes: LedgerLineDash[];
}

export interface CalcLedgerStaffLike {
  m_drawingStaffSize: number;
  GetDrawingX(): number;
  AddLedgerLineAbove(count: number, left: number, right: number, extension: number, cueSize: boolean, event: unknown): void;
  AddLedgerLineBelow(count: number, left: number, right: number, extension: number, cueSize: boolean, event: unknown): void;
  GetLedgerLinesAbove(): LedgerLineLike[];
  GetLedgerLinesAboveCue(): LedgerLineLike[];
  GetLedgerLinesBelow(): LedgerLineLike[];
  GetLedgerLinesBelowCue(): LedgerLineLike[];
}

export interface CalcLedgerPositionInterfaceLike {
  HasLedgerLines(linesAbove: { value: number }, linesBelow: { value: number }, staff: unknown): boolean;
}

export interface CalcLedgerLayerElementLike {
  GetAncestorStaff(strategy: number): CalcLedgerStaffLike | null;
  GetDrawingX(): number;
  GetDrawingCueSize(): boolean;
  GetPositionInterface(): CalcLedgerPositionInterfaceLike | null;
}

export interface CalcLedgerAccidLike extends CalcLedgerLayerElementLike {
  GetFirstAncestor(classId: ClassId): unknown;
  HasAccid(): boolean;
  GetAccid(): number;
}

export interface CalcLedgerNoteLike extends CalcLedgerLayerElementLike {
  IsVisible(): boolean;
  GetDrawingRadius(doc: unknown): number;
}

export interface CalcLedgerCursorLike extends CalcLedgerNoteLike {
  IsRestMode(): boolean;
  GetInputMode(): number;
}

export interface CalcLedgerLayerLike {
  HasCursor(): boolean;
  GetCursor(): CalcLedgerCursorLike;
}

export interface CalcLedgerDocLike {
  GetOptions(): { m_svgHtml5: { GetValue(): boolean } };
  GetGlyphWidth(code: number, staffSize: number, cueSize: boolean): number;
  GetDrawingLedgerLineExtension(staffSize: number, cueSize: boolean): number;
  GetDrawingMinimalLedgerLineExtension(staffSize: number, cueSize: boolean): number;
  GetCueScaling(): number;
}

export interface CalcLedgerAccidStatics {
  GetAccidGlyph(accid: number): number;
}

function assertInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`CalcLedgerLinesFunctor: ${message}`);
}

export class CalcLedgerLinesFunctor extends DocFunctor {
  private accidStatics: CalcLedgerAccidStatics;

  public constructor(doc: unknown, accidStatics?: CalcLedgerAccidStatics) {
    super(doc);
    // C++ calls the Accid static directly; the owning class is not yet
    // migrated as an importable runtime, so the static is injected with an
    // explicit-failure default rather than a fabricated glyph table.
    this.accidStatics = accidStatics ?? {
      GetAccidGlyph: () => { throw new Error('CalcLedgerLinesFunctor: Accid::GetAccidGlyph not available'); },
    };
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  public VisitAccid(accid: CalcLedgerAccidLike): FunctorCode {
    if (accid.GetFirstAncestor(ClassId.NOTE) || !accid.HasAccid()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const staff = accid.GetAncestorStaff(0);
    assertInvariant(staff, 'expected staff');

    const width = (this.m_doc as unknown as CalcLedgerDocLike).GetGlyphWidth(
      this.accidStatics.GetAccidGlyph(accid.GetAccid()), staff.m_drawingStaffSize, false);

    this.CalcForLayerElement(accid, width, HORIZONTALALIGNMENT_center);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitCursor(cursor: CalcLedgerCursorLike): FunctorCode {
    if (cursor.IsRestMode() || cursor.GetInputMode() === CURSOR_DURATION_FIRST) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    return this.VisitNote(cursor);
  }

  public VisitLayer(layer: CalcLedgerLayerLike): FunctorCode {
    if (layer.HasCursor()) {
      this.VisitCursor(layer.GetCursor());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: CalcLedgerNoteLike): FunctorCode {
    if (!note.IsVisible()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const radius = note.GetDrawingRadius(this.m_doc);

    this.CalcForLayerElement(note, 2 * radius, HORIZONTALALIGNMENT_left);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitStaffEnd(staff: CalcLedgerStaffLike): FunctorCode {
    const doc = this.m_doc as unknown as CalcLedgerDocLike;
    const extension = doc.GetDrawingLedgerLineExtension(staff.m_drawingStaffSize, false);
    const minExtension = doc.GetDrawingMinimalLedgerLineExtension(staff.m_drawingStaffSize, false);
    const cueScaling = doc.GetCueScaling();
    this.AdjustLedgerLines(
      staff.GetLedgerLinesAbove(), staff.GetLedgerLinesAboveCue(), cueScaling, extension, minExtension);
    this.AdjustLedgerLines(
      staff.GetLedgerLinesBelow(), staff.GetLedgerLinesBelowCue(), cueScaling, extension, minExtension);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public CalcForLayerElement(
    layerElement: CalcLedgerLayerElementLike, width: number, alignment: number,
  ): void {
    const doc = this.m_doc as unknown as CalcLedgerDocLike;
    const staff = layerElement.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    assertInvariant(staff, 'expected staff');

    const staffSize = staff.m_drawingStaffSize;
    const staffX = staff.GetDrawingX();
    const drawingCueSize = layerElement.GetDrawingCueSize();

    const linesAbove = { value: 0 };
    const linesBelow = { value: 0 };

    const positionInterface = layerElement.GetPositionInterface();
    assertInvariant(positionInterface, 'expected position interface');

    if (!positionInterface.HasLedgerLines(linesAbove, linesBelow, staff)) return;

    const extension = doc.GetDrawingLedgerLineExtension(staffSize, drawingCueSize);
    let left = layerElement.GetDrawingX() - extension - staffX;
    let right = layerElement.GetDrawingX() + width + extension - staffX;

    if (alignment === HORIZONTALALIGNMENT_center) {
      // C++ int division at the / 2 boundary; Math.trunc preserves it.
      right -= Math.trunc(width / 2);
      left -= Math.trunc(width / 2);
    }

    const event = doc.GetOptions().m_svgHtml5.GetValue() ? layerElement : null;
    if (linesAbove.value > 0) {
      staff.AddLedgerLineAbove(linesAbove.value, left, right, extension, drawingCueSize, event);
    }
    else {
      staff.AddLedgerLineBelow(linesBelow.value, left, right, extension, drawingCueSize, event);
    }
  }

  public AdjustLedgerLines(
    lines: LedgerLineLike[], cueLines: LedgerLineLike[], cueScaling: number, extension: number, minExtension: number,
  ): void {
    assertInvariant(minExtension <= extension, 'minExtension <= extension');

    interface Adjustment {
      left: number;
      right: number;
      isCue: boolean;
      delta: number;
    }

    // For each dash on the inner line (both cue and normal) we construct an
    // adjustment with zero delta and sort them.
    const adjustments: Adjustment[] = [];
    if (lines.length > 0) {
      for (const dash of lines[0].m_dashes) {
        adjustments.push({ left: dash.m_x1, right: dash.m_x2, isCue: false, delta: 0 });
      }
    }
    if (cueLines.length > 0) {
      for (const dash of cueLines[0].m_dashes) {
        adjustments.push({ left: dash.m_x1, right: dash.m_x2, isCue: true, delta: 0 });
      }
    }

    adjustments.sort((adj1, adj2) => {
      if (adj1.left < adj2.left) return -1;
      if (adj1.left === adj2.left && adj1.right < adj2.right) return -1;
      if (adj1.left === adj2.left && adj1.right === adj2.right) return 0;
      return 1;
    });

    const defaultGap = 100 * extension; // A large value which should not trigger any adjustments
    let leftGapProportion = defaultGap; // The proportion of the left gap belonging to the current dash
    let rightGapProportion = defaultGap; // The proportion of the right gap belonging to the current dash

    for (let i = 0; i < adjustments.length; ++i) {
      const adj = adjustments[i];
      // Calculate the right gap and whether the next dash is cue
      const next = i + 1 < adjustments.length ? adjustments[i + 1] : null;
      const rightGap = next ? next.left - adj.right : defaultGap;
      const nextIsCue = next ? next.isCue : false;

      // Calculate the proportion of the right gap belonging to the current dash
      // and the proportion belonging to the next dash.
      // C++ narrows the double products to int at assignment; Math.trunc preserves it.
      const currentCueScale = adj.isCue ? cueScaling : 1.0;
      const nextCueScale = nextIsCue ? cueScaling : 1.0;
      rightGapProportion = Math.trunc(currentCueScale / (currentCueScale + nextCueScale) * rightGap);
      const nextLeftGapProportion = Math.trunc(nextCueScale / (currentCueScale + nextCueScale) * rightGap);

      // The gap between successive dashes should be at least one extension
      const minGapProportion = Math.min(leftGapProportion, rightGapProportion);
      if (minGapProportion < currentCueScale * extension / 2.0) {
        // C++ narrows each intermediate to int: minTotal truncates the double sum,
        // newExtension takes max of truncated operands, delta truncates the difference.
        const minTotal = Math.trunc(minGapProportion + currentCueScale * extension);
        const newExtension = Math.max(Math.trunc(2 * minTotal / 3), Math.trunc(currentCueScale * minExtension));
        adj.delta = Math.trunc(currentCueScale * extension - newExtension);
        assertInvariant(adj.delta >= 0, 'delta >= 0');
      }

      leftGapProportion = nextLeftGapProportion;
    }

    // Finally, we transfer the adjustments to all ledger lines.
    // We thus ensure that all dashes on the same note/chord obtain the same ledger line extension.
    for (const adjustment of adjustments) {
      if (adjustment.delta > 0) {
        const linesToAdjust = adjustment.isCue ? cueLines : lines;
        for (const line of linesToAdjust) {
          const dash = line.m_dashes.find(
            (d) => d.m_x1 >= adjustment.left && d.m_x2 <= adjustment.right);
          if (dash) {
            dash.m_x1 += adjustment.delta;
            dash.m_x2 -= adjustment.delta;
          }
        }
      }
    }
  }
}
