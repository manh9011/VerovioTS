import { ClassId, FunctorCode, VisibilityType } from './vrvdef.js';
import { Functor } from './functor.js';
import { VrvObject } from './object.js';
import { Cursor } from './cursor.js';
import type { Layer } from './layer.js';
import type { LayerElement } from './layerelement.js';
import type { Note } from './note.js';

function createCursor(): Cursor { return new Cursor(); }
function cloneCursor(cursor: Cursor): Cursor {
  const cloned = cursor.Clone() as Cursor;
  cloned.CloneReset();
  return cloned;
}

export class EditorTreeObject extends VrvObject {
  public m_className = '';
  public readonly m_object: VrvObject;
  private m_visibility: VisibilityType = VisibilityType.Hidden;
  public constructor(object: VrvObject, _ownChildren: boolean) {
    super(object.GetClassId());
    this.m_object = object;
    this.m_className = object.GetClassName();
  }
  public override GetClassName(): string { return this.m_className; }
  public SetVisibility(value: VisibilityType): void { this.m_visibility = value; }
  public GetVisibility(): VisibilityType { return this.m_visibility; }
  public IsSupportedChild(_classId: ClassId): boolean { return true; }
  public GetChildObjects(): VrvObject[] {
    const childObjects: VrvObject[] = [];
    for (const child of this.GetChildren()) {
      const editorTreeChild = child as EditorTreeObject;
      if (editorTreeChild.Is(ClassId.MEASURE) && editorTreeChild.m_object) {
        const measure = editorTreeChild.m_object as any;
        if (typeof measure.IsMeasuredMusic === 'function' && !measure.IsMeasuredMusic()) {
          childObjects.push(...editorTreeChild.m_object.GetChildren());
          return childObjects;
        }
      }
      childObjects.push(editorTreeChild.m_object ?? editorTreeChild);
    }
    return childObjects;
  }
  public ClearChildrenTree(): void { super.ClearChildren(); }
}

export class CursorFunctor extends Functor {
  private readonly m_layer: Layer;
  private readonly m_position: LayerElement | null;
  private m_cursor: Cursor | null = null;
  private m_previous: Cursor | null = null;

  public constructor(layer: Layer, position: LayerElement | null) {
    super();
    this.m_layer = layer;
    this.m_position = position;
    this.m_cursor = null;
    this.m_previous = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitLayer(layer: Layer): FunctorCode {
    if (layer.HasCursor?.()) {
      const cursor = layer.GetCursor?.() ?? null;
      if (cursor) this.m_previous = cloneCursor(cursor);
    }

    if (layer !== this.m_layer) {
      layer.ResetCursor?.();
    } else {
      if (this.m_previous) {
        this.m_cursor = cloneCursor(this.m_previous);
      } else {
        this.m_cursor = createCursor();
      }
      if (!this.m_cursor) throw new Error('CursorFunctor cursor invariant violated.');
      if (this.m_position) {
        this.m_cursor.SetPosition(this.m_position as any);
        if (this.m_position.Is(ClassId.NOTE)) {
          const note = this.m_position as unknown as Note;
          this.m_cursor.SetPname(note.GetPname());
          this.m_cursor.SetOct(note.GetOct());
          this.m_cursor.SetAccidValue(note.GetDrawingAccid());
        }
      }
      layer.SetCursor?.(this.m_cursor);
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public GetCursor(): Cursor | null {
    return this.m_cursor;
  }
}

export class SectionContextFunctor extends Functor {
  private m_current: VrvObject;

  public constructor(object: VrvObject) {
    super();
    this.m_current = object;
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  public VisitObject(object: VrvObject): FunctorCode {
    const parent = object.GetParent();
    if (parent && parent.IsAnyOf([ClassId.DIV, ClassId.MEASURE, ClassId.SCOREDEF])) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    if (object.IsAnyOf([
      ClassId.DOC,
      ClassId.PAGE,
      ClassId.PAGES,
      ClassId.PAGE_MILESTONE_END,
      ClassId.SYSTEM,
      ClassId.SYSTEM_MILESTONE_END,
    ])) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let ownChildren = false;
    if (object.IsAnyOf([ClassId.DIV, ClassId.MEASURE, ClassId.SCOREDEF])) ownChildren = true;

    const treeObject = new EditorTreeObject(object, ownChildren);
    this.m_current.AddChild(treeObject);
    this.m_current = treeObject;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitObjectEnd(object: VrvObject): FunctorCode {
    if ((object as VrvObject & { IsMilestoneElement?: () => boolean }).IsMilestoneElement?.()) return FunctorCode.FUNCTOR_CONTINUE;

    if (object.IsAnyOf([ClassId.PAGE_MILESTONE_END, ClassId.SYSTEM_MILESTONE_END])) {
      this.m_current = this.m_current.GetParent() ?? this.m_current;
    }
    if (object.IsAnyOf([
      ClassId.DOC,
      ClassId.PAGE,
      ClassId.PAGES,
      ClassId.PAGE_MILESTONE_END,
      ClassId.SYSTEM,
      ClassId.SYSTEM_MILESTONE_END,
    ])) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    this.m_current = this.m_current.GetParent() ?? this.m_current;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

export class ScoreContextFunctor extends Functor {
  private enumLevel = { NOT_IN_SCORE: 0, TO_INCLUDE: 1, INCLUDED: 2 } as const;
  private m_current: VrvObject;
  private m_inScoreLevel: number;

  public constructor(object: VrvObject) {
    super();
    this.m_current = object;
    this.m_inScoreLevel = this.enumLevel.NOT_IN_SCORE;
    this.SetVisibleOnly(false);
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  public VisitObject(object: VrvObject): FunctorCode {
    const parent = object.GetParent();
    if (parent && parent.IsAnyOf([ClassId.DIV, ClassId.MEASURE, ClassId.SCOREDEF])) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (this.m_inScoreLevel === this.enumLevel.INCLUDED) return FunctorCode.FUNCTOR_SIBLINGS;

    if (this.m_inScoreLevel === this.enumLevel.NOT_IN_SCORE && !object.IsAnyOf([ClassId.MDIV, ClassId.SCORE])) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let ownChildren = false;
    if (this.m_inScoreLevel === this.enumLevel.TO_INCLUDE) ownChildren = true;

    const treeObject = new EditorTreeObject(object, ownChildren);
    treeObject.SetVisibility(VisibilityType.Visible);
    this.m_current.AddChild(treeObject);
    this.m_current = treeObject;

    if (object.Is(ClassId.SCORE)) {
      const score = object as VrvObject & { GetScoreDef?: () => VrvObject | null };
      const scoreDef = score.GetScoreDef?.() ?? null;
      if (scoreDef) {
        this.m_inScoreLevel = this.enumLevel.TO_INCLUDE;
        (scoreDef as any).Process(this);
        this.m_inScoreLevel = this.enumLevel.NOT_IN_SCORE;
      }
    }

    if (this.m_inScoreLevel === this.enumLevel.TO_INCLUDE) this.m_inScoreLevel = this.enumLevel.INCLUDED;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitObjectEnd(object: VrvObject): FunctorCode {
    if ((object as VrvObject & { IsMilestoneElement?: () => boolean }).IsMilestoneElement?.()) return FunctorCode.FUNCTOR_CONTINUE;
    if (object.Is(ClassId.PAGE_MILESTONE_END)) {
      this.m_current = this.m_current.GetParent() ?? this.m_current;
    }
    if (this.m_inScoreLevel === this.enumLevel.NOT_IN_SCORE && !object.IsAnyOf([ClassId.MDIV, ClassId.SCORE])) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    this.m_current = this.m_current.GetParent() ?? this.m_current;
    if (this.m_inScoreLevel === this.enumLevel.INCLUDED) this.m_inScoreLevel = this.enumLevel.NOT_IN_SCORE;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
