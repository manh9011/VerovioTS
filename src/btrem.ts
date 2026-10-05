import { ObjectFactory, VrvObject } from './object.js';
import { LayerElement } from './layerelement.js';
import { ClassId, FunctorCode, DURATION_NONE, DURATION_long, DURATION_1024, DURATION_2, DURATION_4 } from './vrvdef.js';
import { InstNumbered, InstNumberPlacement, InstTremForm, InstTremMeasured } from './atts_cmn.js';

const ATT_NUMBERED = 29;
const ATT_NUMBERPLACEMENT = 28;
const ATT_TREMFORM = 37;
const ATT_TREMMEASURED = 38;

// data_STEMMODIFIER ordinals from the generated converter layer.
const STEMMODIFIER_NONE = 0;
const STEMMODIFIER_1slash = 2;
const STEMMODIFIER_2slash = 3;
const STEMMODIFIER_3slash = 4;
const STEMMODIFIER_4slash = 5;
const STEMMODIFIER_5slash = 6;
const STEMMODIFIER_6slash = 7;

/** Pure TypeScript translation of Verovio's src/btrem.cpp / include/vrv/btrem.h. */
export class BTrem extends LayerElement {
  private numbered!: InstNumbered;
  private numberPlacement!: InstNumberPlacement;
  private tremForm!: InstTremForm;
  private tremMeasured!: InstTremMeasured;

  public constructor() {
    super(ClassId.BTREM);
    this.numbered = new InstNumbered();
    this.numberPlacement = new InstNumberPlacement();
    this.tremForm = new InstTremForm();
    this.tremMeasured = new InstTremMeasured();
    this.RegisterAttClass(ATT_NUMBERED);
    this.RegisterAttClass(ATT_NUMBERPLACEMENT);
    this.RegisterAttClass(ATT_TREMFORM);
    this.RegisterAttClass(ATT_TREMMEASURED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.numbered ??= new InstNumbered();
    this.numberPlacement ??= new InstNumberPlacement();
    this.tremForm ??= new InstTremForm();
    this.tremMeasured ??= new InstTremMeasured();
    this.numbered.ResetNumbered();
    this.numberPlacement.ResetNumberPlacement();
    this.tremForm.ResetTremForm();
    this.tremMeasured.ResetTremMeasured();
  }

  public override GetClassName(): string { return 'bTrem'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.CHORD || classId === ClassId.CLEF || classId === ClassId.NOTE) return true;
    return VrvObject.IsEditorialElement(classId);
  }

  /** Calculate the duration of an individual note in a measured tremolo. */
  public CalcIndividualNoteDuration(): number {
    if (this.HasUnitdur()) return this.GetUnitdur();

    let childDur = DURATION_NONE;
    let stemMod = STEMMODIFIER_NONE;
    const chord = this.FindDescendantByType(ClassId.CHORD) as any;
    if (chord) {
      childDur = chord.GetDur();
      stemMod = chord.GetStemMod();
    } else {
      const note = this.FindDescendantByType(ClassId.NOTE) as any;
      if (note) {
        childDur = note.GetDur();
        stemMod = note.GetStemMod();
      }
    }

    if (stemMod >= STEMMODIFIER_1slash && stemMod <= STEMMODIFIER_6slash) {
      if (childDur >= DURATION_long && childDur <= DURATION_1024) {
        let value = Math.max(childDur, DURATION_4);
        value += stemMod - STEMMODIFIER_1slash + 1;
        value = Math.min(value, DURATION_1024);
        return value;
      }
    }
    return DURATION_NONE;
  }

  public override GetDrawingStemMod(): number {
    let child = this.FindDescendantByType(ClassId.CHORD) as any;
    if (!child) {
      child = this.FindDescendantByType(ClassId.NOTE) as any;
      if (!child) return STEMMODIFIER_NONE;
    }

    const stemMod = (child as LayerElement).GetDrawingStemMod();
    if (stemMod !== STEMMODIFIER_NONE) return stemMod;

    const duration = (child as any).GetDurationInterface?.() as { GetActualDur(): number } | null;
    if (!duration) return STEMMODIFIER_NONE;
    const drawingDur = duration.GetActualDur();

    if (!this.HasUnitdur()) {
      if (drawingDur < DURATION_2) return STEMMODIFIER_3slash;
      return STEMMODIFIER_NONE;
    }
    let slashDur = this.GetUnitdur() - drawingDur;
    if (drawingDur < DURATION_4) slashDur = this.GetUnitdur() - DURATION_4;
    switch (slashDur) {
      case 0: return STEMMODIFIER_NONE;
      case 1: return STEMMODIFIER_1slash;
      case 2: return STEMMODIFIER_2slash;
      case 3: return STEMMODIFIER_3slash;
      case 4: return STEMMODIFIER_4slash;
      case 5: return STEMMODIFIER_5slash;
      case 6: return STEMMODIFIER_6slash;
      default: break;
    }
    return STEMMODIFIER_NONE;
  }

  // AttNumbered forwarding
  public SetNum(value: number): void { this.numbered.SetNum(value); }
  public GetNum(): number { return this.numbered.GetNum(); }
  public HasNum(): boolean { return this.numbered.HasNum(); }
  public ResetNumbered(): void { this.numbered.ResetNumbered(); }

  // AttNumberPlacement forwarding
  public SetNumPlace(value: any): void { this.numberPlacement.SetNumPlace(value); }
  public GetNumPlace(): any { return this.numberPlacement.GetNumPlace(); }
  public HasNumPlace(): boolean { return this.numberPlacement.HasNumPlace(); }
  public SetNumVisible(value: any): void { this.numberPlacement.SetNumVisible(value); }
  public GetNumVisible(): any { return this.numberPlacement.GetNumVisible(); }
  public HasNumVisible(): boolean { return this.numberPlacement.HasNumVisible(); }
  public ResetNumberPlacement(): void { this.numberPlacement.ResetNumberPlacement(); }

  // AttTremForm forwarding
  public SetForm(value: any): void { this.tremForm.SetForm(value); }
  public GetForm(): any { return this.tremForm.GetForm(); }
  public HasForm(): boolean { return this.tremForm.HasForm(); }
  public ResetTremForm(): void { this.tremForm.ResetTremForm(); }

  // AttTremMeasured forwarding
  public SetUnitdur(value: any): void { this.tremMeasured.SetUnitdur(value); }
  public GetUnitdur(): any { return this.tremMeasured.GetUnitdur(); }
  public HasUnitdur(): boolean { return this.tremMeasured.HasUnitdur(); }
  public ResetTremMeasured(): void { this.tremMeasured.ResetTremMeasured(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBTrem');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBTrem');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBTremEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBTremEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): BTrem {
    const clone = new BTrem();
    clone.AssignFrom(this);
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumPlace()) clone.SetNumPlace(this.GetNumPlace());
    if (this.HasNumVisible()) clone.SetNumVisible(this.GetNumVisible());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasUnitdur()) clone.SetUnitdur(this.GetUnitdur());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('btrem', ClassId.BTREM, () => new BTrem());
