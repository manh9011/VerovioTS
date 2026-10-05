import { ClassId, ClassIdLike } from './core-types.js';
import { ObjectFactory, VrvObject } from './object.js';
import type { Doc } from './doc.js';
import type { Page } from './page.js';
import type { Cursor } from './cursor.js';
import { JsonxxObject, type JsonObjectLike } from './jsonxx.js';
import { assertInvariant } from './object.js';
type ViewLike = any;
import { LogError, LogWarning } from './vrv.js';

const CHAINED_ID = '[chained-id]';
const SELECTION_ID = '[selection-id]';
const SELECTION_SECONDARY_ID = '[selection-secondary-id]';

/**
 * Pure-TypeScript translation of `src/editortoolkit.cpp`.
 *
 * Native/editor-only dependencies that are not yet fully migrated are represented
 * by structural contracts. No insertion or lookup algorithm is delegated to a mock.
 */
export abstract class EditorToolkit {
  protected m_chainedId = '';
  protected m_selectionId = '';
  protected m_selectionClassId: ClassIdLike = ClassId.UNSPECIFIED;
  protected m_selectionSecondaryId = '';
  protected m_cursor: Cursor | null = null;

  protected readonly m_doc: Doc;
  protected readonly m_view: ViewLike;
  protected readonly m_editStatus: JsonObjectLike;
  protected readonly m_editResponse: JsonObjectLike;
  protected m_options = 0;

  public constructor(doc: Doc, view: ViewLike) {
    this.m_doc = doc;
    this.m_view = view;
    this.m_editStatus = new JsonxxObject();
    this.m_editResponse = new JsonxxObject();

    this.ResetSelect();
    this.m_cursor = null;
    this.m_options = 0;
  }

  /** Child classes parse the editor action and execute it. */
  public abstract ParseEditorAction(jsonEditorAction: string): boolean;

  public EditStatus(): string {
    return this.m_editStatus.json();
  }

  public EditResponse(): string {
    return this.m_editResponse.json();
  }

  public OptionsChanged(): void {
    this.m_options++;
  }

  protected ResetSelect(): void {
    this.m_selectionId = '';
    this.m_selectionClassId = ClassId.UNSPECIFIED;
    this.m_selectionSecondaryId = '';
  }

  protected AppendChild(elementId: string, elementName: string, noDuplicate: boolean): boolean {
    const element = this.ResolveElement(elementId);
    if (!element) return false;

    if (noDuplicate) {
      const classId = ObjectFactory.GetInstance().GetClassId(elementName);
      const existingChildElement = element.FindDescendantByType(classId, 1);
      if (existingChildElement) {
        existingChildElement.Reset();
        this.m_chainedId = existingChildElement.GetID();
        return true;
      }
    }

    const childElement = this.PrepareInsertion(element, elementName);
    if (!childElement) return false;

    if (!element.AddChild(childElement)) {
      // C++ deletes the newly-created child on failure. JS GC handles the object,
      // but the object is deliberately not attached anywhere else here.
      return false;
    }

    return true;
  }

  protected InsertBefore(elementId: string, elementName: string): boolean {
    const element = this.ResolveElement(elementId);
    if (!element) return false;

    const parent = element.GetParent();
    assertInvariant(parent !== null, 'Parent required for EditorToolkit::InsertBefore.');

    const childElement = this.PrepareInsertion(parent, elementName);
    if (!childElement) return false;

    parent.InsertBefore(element, childElement);
    return true;
  }

  protected InsertAfter(elementId: string, elementName: string): boolean {
    const element = this.ResolveElement(elementId);
    if (!element) return false;

    const parent = element.GetParent();
    assertInvariant(parent !== null, 'Parent required for EditorToolkit::InsertAfter.');

    const childElement = this.PrepareInsertion(parent, elementName);
    if (!childElement) return false;

    parent.InsertAfter(element, childElement);
    return true;
  }

  protected GetElement(elementId: string): VrvObject | null {
    let element: VrvObject | null = null;

    // Try the current drawing page first, exactly as in C++.
    const drawingPage = this.m_doc.GetDrawingPage() as Page | null;
    if (drawingPage && typeof (drawingPage as any).FindDescendantByID === 'function') {
      element = (drawingPage as any).FindDescendantByID(elementId) as VrvObject | null;
    }

    // Fall back to the whole document.
    if (!element) {
      element = this.m_doc.FindDescendantByID(elementId);
    }

    if (!element) {
      LogError("Element '%s' could not be found", elementId);
    }

    return element;
  }

  protected PrepareInsertion(parent: VrvObject, elementName: string): VrvObject | null {
    assertInvariant(parent !== null, 'Parent required for EditorToolkit::PrepareInsertion.');

    const classId = ObjectFactory.GetInstance().GetClassId(elementName);
    if (!parent.IsSupportedChild(classId)) {
      LogError("Element '%s' is not supported as child of '%s'", elementName, parent.GetClassName());
      return null;
    }

    const childElement = ObjectFactory.GetInstance().Create(elementName);
    if (!childElement) {
      LogError("Creating a '%s' object failed", elementName);
    } else {
      this.m_chainedId = childElement.GetID();
    }

    return childElement;
  }

  protected ResolveElement(elementId: string, chain = true): VrvObject | null {
    if (elementId === CHAINED_ID) {
      if (this.m_chainedId.length === 0) LogWarning('Chained id not set');
      elementId = this.m_chainedId;
    } else if (elementId === SELECTION_ID) {
      if (this.m_selectionId.length === 0) LogWarning('Selection id not set');
      elementId = this.m_selectionId;
      if (chain) this.m_chainedId = elementId;
    } else if (elementId === SELECTION_SECONDARY_ID) {
      if (this.m_selectionSecondaryId.length === 0) LogWarning('Selection secondary id not set');
      elementId = this.m_selectionSecondaryId;
      if (chain) this.m_chainedId = elementId;
    } else {
      this.m_chainedId = elementId;
    }

    return this.GetElement(elementId);
  }

  protected InsertMode(): boolean {
    return this.m_cursor !== null;
  }
}

export {
  CHAINED_ID,
  SELECTION_ID,
  SELECTION_SECONDARY_ID,
};
