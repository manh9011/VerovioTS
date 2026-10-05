/**
 * Pure TypeScript translation of Verovio's ExpansionMap
 * (`src-cpp/src/expansionmap.cpp` + `src-cpp/include/vrv/expansionmap.h`).
 *
 * Preserves: map reset/processed state, recursive `Expand()` with container
 * creation (SECTION/ENDING/LEM/RDG), predictable `-rendN` ID generation,
 * expanded-ID map bookkeeping, `UpdateIDs()` interface rewiring
 * (time-point/spanning, plist, linking), `GenerateExpansionFor()` repeat
 * analysis, and the `IsRepeatStart/End/Next/Previous` barline predicates.
 *
 * C++ `std::map` iteration order becomes `Map` insertion order; `delete`
 * of the empty generated expansion is GC-owned. C++ `assert` invariants
 * become explicit errors.
 */

import { ClassId, InterfaceId } from './vrvdef.js';
import { VrvObject } from './object.js';
import { Section } from './section.js';
import { Ending } from './ending.js';
import { Lem } from './lem.js';
import { Rdg } from './rdg.js';
import { Expansion } from './expansion.js';
import { LogDebug, LogWarning } from './vrv.js';

const BARRENDITION_rptboth = 12;
const BARRENDITION_rptend = 13;
const BARRENDITION_rptstart = 11;

function stripHash(id: string): string {
  return id.startsWith('#') ? id.slice(1) : id;
}

// Structural contracts for collaborators whose full classes are not imported
// here to avoid module cycles; only the consumed surface is modeled.
interface MeasureLike extends VrvObject {
  HasLeft(): boolean;
  GetLeft(): number;
  HasRight(): boolean;
  GetRight(): number;
}

interface ScoreLike extends VrvObject {
  HasEditorialContent(): boolean;
}

interface ExpansionLike extends VrvObject {
  GetPlist(): string[];
  GetPlistInterface(): { AddRefAllowDuplicate(ref: string): void };
}

export class ExpansionMap {
  /** The expansion map indicates which xmlId has been repeated (expanded) elsewhere. */
  public m_map = new Map<string, string[]>();

  /** A flag indicating that the generation process has run even if the map is empty. */
  private m_isProcessed = false;

  public constructor() {
    this.Reset();
  }

  /** Clear the content of the expansion map. */
  public Reset(): void {
    this.m_map.clear();
    this.m_isProcessed = false;
  }

  /** Check if m_expansionMap has been filled. */
  public HasExpansionMap(): boolean {
    return this.m_map.size > 0;
  }

  /** Expand expansion recursively. */
  public Expand(
    expansion: ExpansionLike,
    existingList: string[],
    prevSect: VrvObject,
    deletionList: string[],
    deleteList = false,
  ): VrvObject {
    if (!expansion) throw new Error('ExpansionMap::Expand: expansion required.');
    const parent = expansion.GetParent();
    if (!parent) throw new Error('ExpansionMap::Expand: expansion parent required.');
    if (!prevSect) throw new Error('ExpansionMap::Expand: prevSect required.');
    if (!prevSect.GetParent()) throw new Error('ExpansionMap::Expand: prevSect parent required.');

    const expansionPlist = expansion.GetPlist();
    if (expansionPlist.length === 0) {
      LogWarning(
        'ExpansionMap::Expand: Expansion element %s has empty @plist. Nothing expanded.',
        expansion.GetID(),
      );
      return prevSect;
    }

    let insertHere: VrvObject | null = null;

    // If expansion parent already exists, create a new empty such element
    if (existingList.includes(parent.GetID())) {
      let newContainer: VrvObject;
      if (parent.Is(ClassId.SECTION)) {
        newContainer = new Section() as unknown as VrvObject;
      } else if (parent.Is(ClassId.ENDING)) {
        newContainer = new Ending() as unknown as VrvObject;
      } else if (parent.Is(ClassId.LEM)) {
        newContainer = new Lem() as unknown as VrvObject;
      } else if (parent.Is(ClassId.RDG)) {
        newContainer = new Rdg() as unknown as VrvObject;
      } else {
        LogWarning(
          'ExpansionMap::Expand: Expansion element %s has unsupported parent type.',
          expansion.GetID(),
        );
        return prevSect;
      }

      if (!parent.GetParent()) throw new Error('ExpansionMap::Expand: parent parent required.');
      const referenceChild = parent.GetDirectChild(parent.GetParent()!, prevSect);
      if (!referenceChild) throw new Error('ExpansionMap::Expand: reference child required.');
      parent.GetParent()!.InsertAfter(referenceChild, newContainer);
      this.GeneratePredictableIDs(parent, newContainer);
      LogDebug(
        'Creating new container <%s> for expansion element %s',
        newContainer.GetClassName(),
        newContainer.GetID(),
      );
      insertHere = newContainer;
    } else {
      existingList.push(parent.GetID());
    }

    // find and add all relevant (and new) expansion sibling ids to deletionList
    for (const sibling of parent.GetChildren()) {
      if (
        sibling.IsAnyOf([ClassId.SECTION, ClassId.ENDING, ClassId.LEM, ClassId.RDG]) &&
        !deletionList.includes(sibling.GetID())
      ) {
        deletionList.push(sibling.GetID());
      }
    }

    // iterate over expansion plist
    for (let id of expansionPlist) {
      LogDebug('Looking for element in @plist: %s', id);
      id = stripHash(id);
      const currSect = parent.FindDescendantByID(id);
      if (currSect === null) {
        LogWarning('ExpansionMap::Expand: Element referenced in @plist not found: %s', id);
        continue;
      }
      if (currSect.Is(ClassId.EXPANSION)) {
        // if id is itself an expansion, resolve it recursively
        prevSect = this.Expand(currSect as unknown as ExpansionLike, existingList, prevSect, deletionList);
      } else {
        // id already in existingList or currSect is not in expansion parent: clone, update ids, insert it
        if (existingList.includes(id) || (insertHere !== null && currSect.GetParent() !== insertHere)) {
          const clonedObject = currSect.Clone();
          clonedObject.CloneReset();
          this.GeneratePredictableIDs(currSect, clonedObject);

          const oldIds: string[] = [currSect.GetID()];
          this.GetIDList(currSect, oldIds);
          const clonedIds: string[] = [clonedObject.GetID()];
          this.GetIDList(clonedObject, clonedIds);
          for (let i = 0; i < oldIds.length && i < clonedIds.length; ++i) {
            this.AddExpandedIDToExpansionMap(oldIds[i], clonedIds[i]);
          }

          this.UpdateIDs(clonedObject);
          LogDebug('Cloning element in @plist: %s', clonedObject.GetID());

          if (insertHere !== null) {
            insertHere.AddChild(clonedObject);
          } else {
            if (!prevSect.GetParent()) throw new Error('ExpansionMap::Expand: prevSect parent required.');
            prevSect.GetParent()!.InsertAfter(prevSect, clonedObject);
          }
          prevSect = clonedObject;
          existingList.push(clonedObject.GetID());
        } else {
          // add to existingList, remember previous element, re-order if necessary
          let moveCurrentElement = false;
          const prevIdx = prevSect.GetIdx();
          const childCount = prevSect.GetParent()!.GetChildren().length;
          const currIdx = currSect.GetIdx();

          if (currSect.GetParent()!.GetID() === prevSect.GetParent()!.GetID()) {
            if (prevIdx < childCount - 1) {
              const nextElement = prevSect.GetParent()!.GetChild(prevIdx + 1);
              if (!nextElement) throw new Error('ExpansionMap::Expand: next element required.');
              if (
                nextElement.IsAnyOf([ClassId.SECTION, ClassId.ENDING, ClassId.LEM, ClassId.RDG]) &&
                nextElement !== currSect
              ) {
                moveCurrentElement = true;
              }
            } else {
              moveCurrentElement = true;
            }
          }

          if (moveCurrentElement && currIdx < prevIdx && prevIdx < childCount) {
            LogDebug('Re-ordering element %s to after %s', currSect.GetID(), prevSect.GetID());
            currSect.GetParent()!.RotateChildren(currIdx, currIdx + 1, prevIdx + 1);
          } else {
            LogDebug('Leaving existing element %s', currSect.GetID());
          }
          prevSect = currSect;
          existingList.push(id);
        }
      }
    }

    // at the very end, remove unused sections from structure if not in existingList
    if (deleteList) {
      for (const del of deletionList) {
        if (!existingList.includes(del)) {
          const currSect = parent.FindDescendantByID(del);
          if (!currSect) throw new Error('ExpansionMap::Expand: deletion target required.');
          const idx = currSect.GetIdx();
          LogDebug('ExpansionMap::Expand: Removing unused section/ending/rdg/lem with id %s', del);
          currSect.GetParent()!.DetachChild(idx);
        }
      }
    }

    return prevSect;
  }

  public GetExpansionIDsForElement(xmlId: string): string[] {
    const found = this.m_map.get(xmlId);
    if (found) return [...found];
    return [xmlId];
  }

  /** Write the current expansionMap to a JSON string. */
  public ToJson(output: { value: string } | string): void {
    const obj: Record<string, string[]> = {};
    for (const [id, ids] of this.m_map) obj[id] = [...ids];
    const json = JSON.stringify(obj);
    if (typeof output === 'string') return;
    output.value = json;
  }

  /** Generate an expansion for the score analysing the repeats and endings. */
  public GenerateExpansionFor(score: ScoreLike): void {
    this.m_isProcessed = true;

    if (score.HasEditorialContent()) {
      LogWarning('An expansion cannot be generated with editorial content');
      return;
    }
    if (score.FindAllDescendantsByType(ClassId.SECTION).length > 1) {
      LogWarning('An expansion cannot be generated with more than one section');
      return;
    }
    const section = score.FindDescendantByType(ClassId.SECTION, 1);
    if (!section) throw new Error('ExpansionMap::GenerateExpansionFor: section required.');

    const childrenArray = section.GetChildrenForModification();
    const children = [...childrenArray];
    const expansion = new Expansion() as unknown as ExpansionLike;

    let first = 0;
    let last = 0;
    let isStartFromPrevious = false;

    for (let current = 0; current < children.length; ++current) {
      if (children[current].Is(ClassId.MEASURE)) {
        const measure = children[current] as unknown as MeasureLike;
        if (ExpansionMap.IsPreviousRepeatEnd(measure)) {
          const ref = '#' + this.CreateSection(section, children, first, last);
          expansion.GetPlistInterface().AddRefAllowDuplicate(ref);
        }
        if (isStartFromPrevious || ExpansionMap.IsRepeatStart(measure)) {
          first = current;
        }
        isStartFromPrevious = ExpansionMap.IsNextRepeatStart(measure);
        last = current;
        if (ExpansionMap.IsRepeatEnd(measure)) {
          const ref = '#' + this.CreateSection(section, children, first, last);
          expansion.GetPlistInterface().AddRefAllowDuplicate(ref);
        }
      }
    }

    if (expansion.GetPlist().length === 0) {
      // GC owns the discarded expansion (C++ `delete`).
    } else {
      section.InsertChild(expansion as unknown as VrvObject, 0);
    }
  }

  /** @name Setter and getter for the generating attempt flag */
  public SetProcessed(isProcessed: boolean): void {
    this.m_isProcessed = isProcessed;
  }
  public IsProcessed(): boolean {
    return this.m_isProcessed;
  }

  public static IsRepeatStart(measure: MeasureLike): boolean {
    if (!measure.HasLeft()) return false;
    const left = measure.GetLeft();
    return left === BARRENDITION_rptboth || left === BARRENDITION_rptstart;
  }

  public static IsRepeatEnd(measure: MeasureLike): boolean {
    if (!measure.HasRight()) return false;
    const right = measure.GetRight();
    return right === BARRENDITION_rptboth || right === BARRENDITION_rptend;
  }

  public static IsNextRepeatStart(measure: MeasureLike): boolean {
    if (!measure.HasRight()) return false;
    const right = measure.GetRight();
    return right === BARRENDITION_rptboth || right === BARRENDITION_rptstart;
  }

  public static IsPreviousRepeatEnd(measure: MeasureLike): boolean {
    if (!measure.HasLeft()) return false;
    const left = measure.GetLeft();
    return left === BARRENDITION_rptboth || left === BARRENDITION_rptend;
  }

  private UpdateIDs(object: VrvObject): boolean {
    for (const o of object.GetChildren()) {
      o.SetExpansion(true);
      if (o.HasInterface(InterfaceId.INTERFACE_TIME_POINT)) {
        const iface = o.GetTimePointInterface() as unknown as {
          GetStartid(): string;
          SetStartid(v: string): void;
        } | null;
        if (!iface) throw new Error('ExpansionMap::UpdateIDs: time-point interface required.');
        const newStartId = this.GetExpansionIDsForElement(stripHash(iface.GetStartid())).at(-1) ?? '';
        if (newStartId !== '') iface.SetStartid('#' + newStartId);
      }
      if (o.HasInterface(InterfaceId.INTERFACE_TIME_SPANNING)) {
        const iface = o.GetTimeSpanningInterface() as unknown as {
          GetStartid(): string;
          SetStartid(v: string): void;
          GetEndid(): string;
          SetEndid(v: string): void;
        } | null;
        if (!iface) throw new Error('ExpansionMap::UpdateIDs: time-spanning interface required.');
        const newStartId = this.GetExpansionIDsForElement(stripHash(iface.GetStartid())).at(-1) ?? '';
        if (newStartId !== '') iface.SetStartid('#' + newStartId);
        const newEndId = this.GetExpansionIDsForElement(stripHash(iface.GetEndid())).at(-1) ?? '';
        if (newEndId !== '') iface.SetEndid('#' + newEndId);
      }
      if (o.HasInterface(InterfaceId.INTERFACE_PLIST)) {
        const iface = o.GetPlistInterface() as unknown as {
          GetPlist(): string[];
          SetPlist(v: string[]): void;
        } | null;
        if (!iface) throw new Error('ExpansionMap::UpdateIDs: plist interface required.');
        const oldList = iface.GetPlist();
        const newList: string[] = [];
        for (const oldRef of oldList) {
          newList.push('#' + (this.GetExpansionIDsForElement(stripHash(oldRef)).at(-1) ?? ''));
        }
        iface.SetPlist(newList);
      } else if (o.HasInterface(InterfaceId.INTERFACE_LINKING)) {
        const iface = o.GetLinkingInterface() as unknown as {
          GetSameas(): string;
          SetSameas(v: string): void;
          GetNext(): string;
          SetNext(v: string): void;
          GetPrev(): string;
          SetPrev(v: string): void;
          GetCopyof(): string;
          SetCopyof(v: string): void;
          GetSynch(): string;
          SetSynch(v: string): void;
        } | null;
        if (!iface) throw new Error('ExpansionMap::UpdateIDs: linking interface required.');
        const rewire = (get: () => string, set: (v: string) => void): void => {
          const stripped = stripHash(get());
          const mapped = this.GetExpansionIDsForElement(stripped).at(-1) ?? '';
          if (mapped !== '') set('#' + mapped);
        };
        rewire(() => iface.GetSameas(), (v) => iface.SetSameas(v));
        rewire(() => iface.GetNext(), (v) => iface.SetNext(v));
        rewire(() => iface.GetPrev(), (v) => iface.SetPrev(v));
        rewire(() => iface.GetCopyof(), (v) => iface.SetCopyof(v));
        rewire(() => iface.GetSynch(), (v) => iface.SetSynch(v));
        // @corresp is already handled by Object::Clone and LinkingInterface::AddBackLink
      }
      this.UpdateIDs(o);
    }
    return true;
  }

  private GetIDList(object: VrvObject, idList: string[]): void {
    for (const o of object.GetChildren()) {
      idList.push(o.GetID());
      this.GetIDList(o, idList);
    }
  }

  private GeneratePredictableIDs(source: VrvObject, target: VrvObject): void {
    target.SetID(
      source.GetID() + '-rend' + String(this.GetExpansionIDsForElement(source.GetID()).length + 1),
    );
    const sourceObjects = source.GetChildren();
    const targetObjects = target.GetChildren();
    if (sourceObjects.length <= 0 || sourceObjects.length !== targetObjects.length) return;
    let i = 0;
    for (const s of sourceObjects) {
      this.GeneratePredictableIDs(s, targetObjects[i++]);
    }
  }

  /** Adds an id string to an original/notated id. */
  private AddExpandedIDToExpansionMap(origXmlId: string, newXmlId: string): boolean {
    const list = this.m_map.get(origXmlId);
    if (list) {
      list.push(newXmlId);
      for (const s of [...list]) {
        if (s !== list[0] && s !== list[list.length - 1]) {
          this.m_map.get(s)!.push(newXmlId);
        }
      }
      this.m_map.set(newXmlId, this.m_map.get(origXmlId)!);
    } else {
      const s = [origXmlId, newXmlId];
      this.m_map.set(origXmlId, s);
      this.m_map.set(newXmlId, s);
    }
    return true;
  }

  private CreateSection(section: VrvObject, children: VrvObject[], first: number, last: number): string {
    // Canonical C++ takes (section, firstIter, lastIter) over the live child
    // list; indices over a snapshot resolve to the same detach/attach window.
    const subSection = new Section() as unknown as VrvObject;
    section.InsertBefore(children[first], subSection);
    for (let i = first; i <= last; ++i) {
      const current = children[i];
      section.DetachChild(current.GetIdx());
      subSection.AddChild(current);
    }
    return subSection.GetID();
  }
}
