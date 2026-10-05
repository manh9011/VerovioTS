/**
 * Pure TypeScript translation of Verovio's `TabGrp`
 * (`src-cpp/src/tabgrp.cpp` + `src-cpp/include/vrv/tabgrp.h`).
 *
 * C++ has `TabGrp` inherit `LayerElement` + `ObjectListInterface` +
 * `DurationInterface` + `OffsetInterface`. TypeScript models the multiple
 * inheritance with composition: `ObjectListInterface` becomes a composed
 * component whose `FilterList` override keeps only `NOTE` children and sorts
 * them by staff type (DiatonicSort on tab-like staffs, TabCourseSort
 * otherwise), and the duration/offset interfaces are forwarded facades.
 */
import { ClassId, FunctorCode, data_DURATION } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { DurationInterface } from './durationinterface.js';
import { OffsetInterface } from './offsetinterface.js';
import { ObjectFactory, ObjectListInterface, VrvObject } from './object.js';
import { Note, DiatonicSort, TabCourseSort } from './note.js';

/** Note contract used by the sorted list (pointer identity from `Note`). */
export interface TabGrpNoteLike {
  GetDrawingY(): number;
}

/**
 * ObjectListInterface specialization for TabGrp. C++ has `TabGrp` inherit
 * `ObjectListInterface` and override `FilterList`; TypeScript models this with
 * a subclass whose interface owner resolves back to the tab group.
 */
class TabGrpListInterface extends ObjectListInterface {
  protected override FilterList(childList: VrvObject[]): void {
    // Retain only note children of tab groups
    for (let i = 0; i < childList.length;) {
      if (childList[i].Is(ClassId.NOTE)) ++i;
      else childList.splice(i, 1);
    }

    const staff = (this.GetInterfaceOwner() as unknown as { GetAncestorStaff(): unknown }).GetAncestorStaff();
    if (!staff) throw new Error('TabGrp::FilterList: staff ancestor required.');
    const tabLike = (staff as { IsTabStaffLike?(): boolean }).IsTabStaffLike?.() === true;
    if (tabLike) {
      childList.sort((a, b) => (new DiatonicSort().call(a, b) ? -1 : new DiatonicSort().call(b, a) ? 1 : 0));
    } else {
      childList.sort((a, b) => (new TabCourseSort().call(a, b) ? -1 : new TabCourseSort().call(b, a) ? 1 : 0));
    }
  }
}

/** Pure TypeScript translation of Verovio's `TabGrp`. */
export class TabGrp extends LayerElement {
  private readonly objectList: TabGrpListInterface;
  private durationInterface: DurationInterface | null = null;
  private offsetInterface: OffsetInterface | null = null;

  public constructor() {
    super(ClassId.TABGRP);
    // Components must be created after `super(classId)` so the virtual
    // Reset() run by the VrvObject constructor sees initialized state.
    this.objectList = new TabGrpListInterface();
    this.objectList.SetInterfaceOwner(this as unknown as VrvObject);
    this.ensureInterfaces();
    this.RegisterInterface(this.durationInterface!.GetAttClasses(), this.durationInterface!.IsInterface());
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.durationInterface?.Reset();
    this.offsetInterface?.Reset();
  }

  public override GetClassName(): string { return 'tabGrp'; }

  public override GetDurationInterface(): DurationInterface | null { return this.durationInterface; }
  public override GetOffsetInterface(): OffsetInterface | null { return this.offsetInterface; }

  private ensureInterfaces(): void {
    this.durationInterface ??= new DurationInterface();
    this.offsetInterface ??= new OffsetInterface();
  }

  //---------//
  // Children //
  //---------//

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.NOTE, ClassId.REST, ClassId.TABDURSYM];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  //-------------//
  // List facade //
  //-------------//

  public GetList(): VrvObject[] { return this.objectList.GetList(); }
  public HasEmptyList(): boolean { return this.objectList.HasEmptyList(); }
  public GetListSize(): number { return this.objectList.GetListSize(); }
  public GetListFront(): VrvObject { return this.objectList.GetListFront(); }
  public GetListBack(): VrvObject { return this.objectList.GetListBack(); }
  public GetListIndex(element: VrvObject): number { return this.objectList.GetListIndex(element); }

  //--------------------------//
  // DurationInterface facade //
  //--------------------------//
  public SetDur(v: data_DURATION): void { this.durationInterface!.SetDur(v); }
  public SetDurPpq(v: number): void { this.durationInterface!.SetDurPpq(v); }
  public GetDurPpq(): number { return this.durationInterface!.GetDurPpq(); }
  public SetDots(v: number): void { this.durationInterface!.SetDots(v); }
  public GetDots(): number { return this.durationInterface!.GetDots(); }
  public HasDots(): boolean { return this.durationInterface!.HasDots(); }
  public GetDur(): data_DURATION { return this.durationInterface!.GetDur(); }
  public HasDur(): boolean { return this.durationInterface!.HasDur(); }
  public SetDurGes(v: data_DURATION): void { this.durationInterface!.SetDurGes(v); }
  public GetDurGes(): data_DURATION { return this.durationInterface!.GetDurGes(); }
  public HasDurGes(): boolean { return this.durationInterface!.HasDurGes(); }
  public GetActualDur(): data_DURATION { return this.durationInterface!.GetActualDur(); }

  public IsMensuralDur(): boolean { return this.durationInterface!.IsMensuralDur(); }

  //-------------------------//
  // OffsetInterface facade  //
  //-------------------------//
  public SetHo(v: number): void { this.offsetInterface!.SetHo(v); }
  public GetHo(): number { return this.offsetInterface!.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface!.HasHo(); }
  public SetVo(v: number): void { this.offsetInterface!.SetVo(v); }
  public GetVo(): number { return this.offsetInterface!.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface!.HasVo(); }

  //-------------//
  // Note access //
  //-------------//

  public GetYTop(): number {
    // The last note is the top
    return (this.GetListBack() as unknown as TabGrpNoteLike).GetDrawingY();
  }

  public GetYBottom(): number {
    // The first note is the bottom
    return (this.GetListFront() as unknown as TabGrpNoteLike).GetDrawingY();
  }

  public GetTopNote(): Note {
    return this.GetListBack() as Note;
  }

  public GetBottomNote(): Note {
    // The first note is the bottom
    return this.GetListFront() as Note;
  }

  //---------//
  // Functors //
  //---------//

  public override Accept(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitTabGrp', this);
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return visitor(functor, 'VisitTabGrpEnd', this);
  }

  public override Clone(): VrvObject {
    const clone = new TabGrp();
    clone.AssignFrom(this as unknown as VrvObject);
    // Composed interface state is not copied by AssignFrom (object-tree only).
    clone.durationInterface ??= new DurationInterface();
    clone.offsetInterface ??= new OffsetInterface();
    if (this.durationInterface!.GetDur() !== undefined) clone.durationInterface!.SetDur(this.durationInterface!.GetDur());
    return clone;
  }
}

/** C++ FunctorInterface default forwarding helper (VisitTabGrp -> VisitObject). */
function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('tabGrp', ClassId.TABGRP, () => new TabGrp());
