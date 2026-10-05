import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { ControlElement } from './controlelement.js';
import { PlistInterface, PlistObjectLike } from './plistinterface.js';
import { TimePointInterface } from './timeinterface.js';
import { LogWarning } from './vrv.js';
import { InstEnclosingChars } from './atts_shared.js';
import { InstArpegLog } from './atts_cmn.js';
import { InstArpegVis } from './atts_visual.js';
import type { Note } from './note.js';
import type { Chord } from './chord.js';

const ATT_ARPEGLOG = 10;
const ATT_ARPEGVIS = 249;
const ATT_ENCLOSINGCHARS = 129;

/** Pure TypeScript translation of Verovio's src/arpeg.cpp. */
export class Arpeg extends ControlElement {
  private plistInterface: PlistInterface | null = null;
  private timePointInterface: TimePointInterface | null = null;
  private enclosingChars: InstEnclosingChars | null = null;
  private arpegLog: InstArpegLog | null = null;
  private arpegVis: InstArpegVis | null = null;
  private drawingXRel = 0;
  private cachedXRel = VRV_UNSET;

  public constructor() {
    super(ClassId.ARPEG);
    this.plistInterface = new PlistInterface();
    this.timePointInterface = new TimePointInterface();
    this.enclosingChars = new InstEnclosingChars();
    this.arpegLog = new InstArpegLog();
    this.arpegVis = new InstArpegVis();
    this.RegisterInterface(this.plistInterface.GetAttClasses(), this.plistInterface.IsInterface());
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_ARPEGLOG);
    this.RegisterAttClass(ATT_ARPEGVIS);
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.plistInterface ??= new PlistInterface();
    this.timePointInterface ??= new TimePointInterface();
    this.enclosingChars ??= new InstEnclosingChars();
    this.arpegLog ??= new InstArpegLog();
    this.arpegVis ??= new InstArpegVis();
    this.enclosingChars.ResetEnclosingChars();
    this.arpegLog.ResetArpegLog();
    this.arpegVis.ResetArpegVis();
    this.plistInterface.Reset();
    this.timePointInterface.Reset();
    this.drawingXRel = 0;
    this.cachedXRel = VRV_UNSET;
  }

  public GetOrder(): number { return this.arpegLog!.GetOrder(); }
  public SetOrder(v: number): void { this.arpegLog!.SetOrder(v); }
  public HasOrder(): boolean { return this.arpegLog!.HasOrder(); }
  public GetArrow(): number { return this.arpegVis!.GetArrow(); }
  public SetArrow(v: number): void { this.arpegVis!.SetArrow(v); }
  public HasArrow(): boolean { return this.arpegVis!.HasArrow(); }
  public GetArrowShape(): number { return this.arpegVis!.GetArrowShape(); }
  public SetArrowShape(v: number): void { this.arpegVis!.SetArrowShape(v); }
  public HasArrowShape(): boolean { return this.arpegVis!.HasArrowShape(); }
  public GetArrowSize(): number { return this.arpegVis!.GetArrowSize(); }
  public SetArrowSize(v: number): void { this.arpegVis!.SetArrowSize(v); }
  public HasArrowSize(): boolean { return this.arpegVis!.HasArrowSize(); }
  public GetArrowColor(): string { return this.arpegVis!.GetArrowColor(); }
  public SetArrowColor(v: string): void { this.arpegVis!.SetArrowColor(v); }
  public HasArrowColor(): boolean { return this.arpegVis!.HasArrowColor(); }
  public GetArrowFillcolor(): string { return this.arpegVis!.GetArrowFillcolor(); }
  public SetArrowFillcolor(v: string): void { this.arpegVis!.SetArrowFillcolor(v); }
  public HasArrowFillcolor(): boolean { return this.arpegVis!.HasArrowFillcolor(); }

  public GetEnclose(): number { return this.enclosingChars!.GetEnclose(); }
  public SetEnclose(value: number): void { this.enclosingChars!.SetEnclose(value); }
  public HasEnclose(): boolean { return this.enclosingChars!.HasEnclose(); }

  public override GetClassName(): string { return 'arpeg'; }

  public GetPlistInterface(): PlistInterface { this.plistInterface ??= new PlistInterface(); return this.plistInterface; }
  public AddRef(ref: string): void { this.GetPlistInterface().AddRef(ref); }
  public GetTimePointInterface(): TimePointInterface { this.timePointInterface ??= new TimePointInterface(); return this.timePointInterface; }
  public SetStaff(v: number[]): void { this.GetTimePointInterface().SetStaff(v); }
  public SetStartid(v: string): void { this.GetTimePointInterface().SetStartid(v); }
  public SetTstamp(v: number): void { this.GetTimePointInterface().SetTstamp(v); }
  public GetStart(): VrvObject | null { return this.GetTimePointInterface().GetStart() as VrvObject | null; }
  public GetRefs(): readonly PlistObjectLike[] { return this.GetPlistInterface().GetConstRefs(); }
  public SetStart(start: any): void { this.GetTimePointInterface().SetStart(start); }
  public SetRef(ref: PlistObjectLike): void { this.GetPlistInterface().SetRef(ref); }

  public override GetDrawingX(): number {
    const positioner = this.GetCurrentFloatingPositioner();
    if (positioner) return positioner.GetDrawingX();
    const measure = this.GetFirstAncestor(ClassId.MEASURE);
    if (!measure) throw new Error('Arpeg::GetDrawingX requires a measure ancestor when no positioner is set');
    return measure.GetDrawingX() + this.GetDrawingXRel();
  }

  public IsValidRef(ref: VrvObject): boolean {
    if (!ref.IsAnyOf?.([ClassId.CHORD, ClassId.NOTE] as ClassId[])) {
      LogWarning('%s is not supported as @plist target for %s', ref.GetClassName(), this.GetClassName());
      return false;
    }
    return true;
  }

  public SetDrawingXRel(value: number): void {
    this.ResetCachedDrawingX();
    this.drawingXRel = value;
    const positioner = this.GetCurrentFloatingPositioner();
    positioner?.SetDrawingXRel(this.drawingXRel);
  }

  public GetDrawingXRel(): number { return this.drawingXRel; }
  public CacheXRel(restore: boolean): void {
    if (restore) this.drawingXRel = this.cachedXRel;
    else this.cachedXRel = this.drawingXRel;
  }

  private collectNotes(object: any, result: Set<Note>): void {
    if (!object) return;
    if (object.Is?.(ClassId.NOTE)) {
      result.add(object as Note);
    } else if (object.Is?.(ClassId.CHORD)) {
      const chord = object as Chord;
      for (const note of chord.GetList()) result.add(note as Note);
    }
  }

  public GetNotes(): Set<Note> {
    const result = new Set<Note>();
    this.collectNotes(this.GetStart(), result);
    for (const ref of this.GetRefs()) this.collectNotes(ref, result);
    return result;
  }

  public GetDrawingTopBottomNotes(): { top: Note | null; bottom: Note | null } {
    const notes = [...this.GetNotes()];
    if (notes.length <= 1) return { top: null, bottom: null };
    notes.sort((a, b) => b.GetDrawingY() - a.GetDrawingY());
    return { top: notes[0], bottom: notes[notes.length - 1] };
  }

  public GetCrossStaff(): any | null {
    const refs = [...this.GetRefs()] as any[];
    if (refs.length === 0) return null;
    const nonCross = refs.find((obj) => !obj.m_crossStaff);
    if (nonCross) return null;
    return refs[0].m_crossStaff ?? null;
  }

  public override Accept(functor: any): FunctorCode { return functor.VisitArpeg(this); }
  public AcceptConst(functor: any): FunctorCode { return functor.VisitArpeg(this); }
  public override AcceptEnd(functor: any): FunctorCode { return functor.VisitArpegEnd(this); }
  public AcceptEndConst(functor: any): FunctorCode { return functor.VisitArpegEnd(this); }

  public override Clone(): Arpeg {
    const clone = new Arpeg();
    clone.SetDrawingXRel(this.GetDrawingXRel());
    return clone;
  }

}

ObjectFactory.GetInstance().Register('arpeg', ClassId.ARPEG, () => new Arpeg());
