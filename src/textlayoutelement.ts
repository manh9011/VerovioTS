/**
 * Pure TypeScript translation of Verovio's `src/textlayoutelement.cpp` /
 * `include/vrv/textlayoutelement.h`.
 *
 * C++ multiple inheritance (Object + ObjectListInterface + AttTyped) is
 * represented through a composed ObjectListInterface component whose
 * `GetInterfaceOwner()` resolves to `this`, plus a composed InstTyped
 * attribute component with a forwarding surface.
 */
import { VrvObject, ObjectListInterface } from './object.js';
import { InstTyped } from './atts_shared.js';
import { ClassId, FunctorCode, POSITION_CENTER, POSITION_LEFT, POSITION_MIDDLE, POSITION_RIGHT, POSITION_BOTTOM } from './vrvdef.js';
import { HorizontalAlignment, VerticalAlignment } from './areaposinterface.js';

const ATT_TYPED = 224;

// Structural contract for text elements stored in cells. The C++ header uses
// `TextElement *`; only the content-boundingbox and relative-position surface
// consumed by this unit is required.
export interface CellTextElementLike {
  HasContentBB(): boolean;
  GetContentY1(): number;
  GetContentY2(): number;
  GetContentX1(): number;
  GetContentX2(): number;
  GetDrawingYRel(): number;
  SetDrawingYRel(value: number): void;
}

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') {
    // C++ FunctorInterface forwards unknown Visit* methods to VisitObject as a
    // default; structural test functors rely on this fallback.
    const fallback = (functor as Record<string, unknown>)['VisitObject'];
    if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, self);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
  return (fn as (value: unknown) => FunctorCode).call(functor, self);
}

/**
 * ObjectListInterface specialization for TextLayoutElement. C++ has
 * `TextLayoutElement` inherit `ObjectListInterface` and override
 * `FilterList`; TypeScript models this with a subclass whose
 * `GetInterfaceOwner()` resolves back to the owning element, so the
 * shared list logic in `ObjectListInterface` keeps working.
 */
class TextLayoutElementListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    let i = 0;
    while (i < childList.length) {
      // remove nested rend elements
      if (childList[i].Is(ClassId.REND)) {
        if (childList[i].GetFirstAncestor(ClassId.REND)) {
          childList.splice(i, 1);
          continue;
        }
      }
      // Also remove anything that is not a fig
      else if (!childList[i].Is(ClassId.FIG)) {
        childList.splice(i, 1);
        continue;
      }
      ++i;
    }
  }

  protected override GetInterfaceOwner(): VrvObject {
    return (this as unknown as { __owner: VrvObject }).__owner;
  }
}

export abstract class TextLayoutElement extends VrvObject {
  // `ArrayOfTextElements m_cells[9]` — 9 positioning combinations from
  // top-left to bottom-right (going left to right first).
  private m_cells: CellTextElementLike[][];
  private m_drawingScalingPercent: number[];

  private readonly objectList: ObjectListInterface;
  private typed?: InstTyped;

  protected constructor(classId: ClassId) {
    super(classId);
    this.m_cells = [];
    for (let i = 0; i < 9; ++i) this.m_cells.push([]);
    this.m_drawingScalingPercent = [100, 100, 100];
    // The list component must be created after `super(classId)` so the virtual
    // Reset() run by the VrvObject constructor sees fully initialized state.
    this.objectList = new TextLayoutElementListInterface();
    (this.objectList as unknown as { __owner: VrvObject }).__owner = this;
    this.typed = new InstTyped();
    this.RegisterAttClass(ATT_TYPED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.typed?.ResetTyped();
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (VrvObject.IsTextElement(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  // AttTyped forwarding surface.
  public ResetTyped(): void { this.typed!.ResetTyped(); }
  public SetType(value: string): void { this.typed!.SetType(value); }
  public GetType(): string { return this.typed!.GetType() as string; }
  public HasType(): boolean { return this.typed!.HasType(); }

  // ObjectListInterface adaptation: methods run with `this` bound to the list
  // component so internal calls (ResetList/GetListIndex) resolve on it, while
  // GetInterfaceOwner() resolves back to `this` element.
  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }
  public GetListFirst(startFrom: VrvObject, classId?: ClassId): VrvObject | null {
    return this.objectList.GetListFirst(startFrom, classId ?? ClassId.UNSPECIFIED);
  }
  public GetListFirstBackward(startFrom: VrvObject, classId?: ClassId): VrvObject | null {
    return this.objectList.GetListFirstBackward(startFrom, classId ?? ClassId.UNSPECIFIED);
  }
  public GetListPrevious(element: VrvObject): VrvObject | null { return this.objectList.GetListPrevious(element); }
  public GetListNext(element: VrvObject): VrvObject | null { return this.objectList.GetListNext(element); }

  public ResetCells(): void {
    for (let i = 0; i < 9; ++i) this.m_cells[i] = [];
  }

  public AppendTextToCell(index: number, text: CellTextElementLike): void {
    if (!(index >= 0 && index < 9)) throw new Error('AppendTextToCell: index out of range.');
    this.m_cells[index].push(text);
  }

  public GetContentHeight(): number {
    let height = 0;
    for (let i = 0; i < 3; ++i) height += this.GetRowHeight(i);
    return height;
  }

  public GetContentWidth(): number {
    let width = 0;
    for (let i = 0; i < 3; ++i) width = Math.max(width, this.GetRowWidth(i));
    return width;
  }

  public GetRowHeight(row: number): number {
    if (!(row >= 0 && row < 3)) throw new Error('GetRowHeight: row out of range.');
    let height = 0;
    for (let i = 0; i < 3; ++i) height = Math.max(height, this.GetCellHeight(row * 3 + i));
    return height;
  }

  public GetColHeight(col: number): number {
    if (!(col >= 0 && col < 3)) throw new Error('GetColHeight: col out of range.');
    let height = 0;
    for (let i = 0; i < 3; ++i) height += this.GetCellHeight(i * 3 + col);
    return height;
  }

  public GetCellHeight(cell: number): number {
    if (!(cell >= 0 && cell < 9)) throw new Error('GetCellHeight: cell out of range.');
    let columnHeight = 0;
    for (const element of this.m_cells[cell]) {
      if (element.HasContentBB()) columnHeight += element.GetContentY2() - element.GetContentY1();
    }
    return columnHeight;
  }

  public GetRowWidth(row: number): number {
    if (!(row >= 0 && row < 3)) throw new Error('GetRowWidth: row out of range.');
    const col0 = this.GetCellWidth(row * 3) > 0 ? 1 : 0;
    const col1 = this.GetCellWidth(row * 3 + 1) > 0 ? 1 : 0;
    const col2 = this.GetCellWidth(row * 3 + 2) > 0 ? 1 : 0;
    let width = 0;
    for (let i = 0; i < 3; ++i) width = Math.max(width, this.GetCellWidth(row * 3 + i));
    // If we have something in the middle column, ensure 3 times the max col width.
    // Otherwise the maximum width for the number of columns.
    return col1 > 0 && (col0 > 0 || col2 > 0) ? width * 3 : width * (col0 + col1 + col2);
  }

  public GetColWidth(col: number): number {
    if (!(col >= 0 && col < 3)) throw new Error('GetColWidth: col out of range.');
    let width = 0;
    for (let i = 0; i < 3; ++i) width = Math.max(width, this.GetCellWidth(i * 3 + col));
    return width;
  }

  public GetCellWidth(cell: number): number {
    if (!(cell >= 0 && cell < 9)) throw new Error('GetCellWidth: cell out of range.');
    let columnWidth = 0;
    for (const element of this.m_cells[cell]) {
      if (element.HasContentBB()) columnWidth = Math.max(columnWidth, element.GetContentX2() - element.GetContentX1());
    }
    return columnWidth;
  }

  public AdjustDrawingScaling(width: number): boolean {
    let scale = false;
    // For each row
    for (let i = 0; i < 3; ++i) {
      let rowWidth = 0;
      // For each column
      for (let j = 0; j < 3; ++j) {
        const textElements = this.m_cells[i * 3 + j];
        let columnWidth = 0;
        // For each object
        for (const element of textElements) {
          if (element.HasContentBB()) {
            const iterWidth = element.GetContentX2() - element.GetContentX1();
            columnWidth = Math.max(columnWidth, iterWidth);
          }
        }
        rowWidth += columnWidth;
      }
      if (rowWidth !== 0 && rowWidth > width) {
        this.m_drawingScalingPercent[i] = Math.trunc(width * 100 / rowWidth);
        scale = true;
      }
    }
    return scale;
  }

  public ResetDrawingScaling(): void {
    for (let i = 0; i < 3; ++i) this.m_drawingScalingPercent[i] = 100;
  }

  public AdjustRunningElementYPos(): boolean {
    // First adjust the content of each cell
    for (let i = 0; i < 9; ++i) {
      let cumulatedYRel = 0;
      const textElements = this.m_cells[i];
      // For each object
      for (const element of textElements) {
        if (!element.HasContentBB()) continue;
        const yShift = element.GetContentY2();
        element.SetDrawingYRel(cumulatedYRel - yShift);
        cumulatedYRel += element.GetContentY1() - element.GetContentY2();
      }
    }

    let rowYRel = 0;
    // For each row
    for (let i = 0; i < 3; ++i) {
      const currentRowHeight = this.GetRowHeight(i);
      // For each column
      for (let j = 0; j < 3; ++j) {
        const cell = i * 3 + j;
        let colYShift = 0;
        // middle row - it needs to be middle-aligned so calculate the colYShift accordingly
        if (i === 1) colYShift = Math.trunc((currentRowHeight - this.GetCellHeight(cell)) / 2);
        // bottom row - it needs to be bottom-aligned so calculate the colYShift accordingly
        else if (i === 2) colYShift = currentRowHeight - this.GetCellHeight(cell);

        const textElements = this.m_cells[cell];
        // For each object - adjust the yRel according to the rowYRel and the colYShift
        for (const element of textElements) {
          if (!element.HasContentBB()) continue;
          element.SetDrawingYRel(element.GetDrawingYRel() + rowYRel - colYShift);
        }
      }
      rowYRel -= currentRowHeight;
    }

    return true;
  }

  public GetAlignmentPos(h: HorizontalAlignment, v: VerticalAlignment): number {
    let pos = 0;
    switch (h) {
      case HorizontalAlignment.left: break;
      case HorizontalAlignment.center: pos += POSITION_CENTER; break;
      case HorizontalAlignment.right: pos += POSITION_RIGHT; break;
      default: pos += POSITION_LEFT; break;
    }
    switch (v) {
      case VerticalAlignment.top: break;
      case VerticalAlignment.middle: pos += POSITION_MIDDLE; break;
      case VerticalAlignment.bottom: pos += POSITION_BOTTOM; break;
      default: pos += POSITION_MIDDLE; break;
    }
    return pos;
  }

  // C++ pure virtual: `virtual int GetTotalHeight(const Doc *doc) const = 0;`
  // Doc is a type-only import (no runtime cycle).
  public abstract GetTotalHeight(doc: unknown): number;

  // C++ pure virtual: `virtual int GetTotalWidth(const Doc *doc) const = 0;`
  public abstract GetTotalWidth(doc: unknown): number;

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextLayoutElement', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextLayoutElement', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextLayoutElementEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitTextLayoutElementEnd', this);
  }
}
