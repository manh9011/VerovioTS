// EditorToolkitNeume - pure TS translation of src-cpp/src/editortoolkit_neume.cpp.
// Covers: class state, ParseEditorAction dispatcher, Chain, AddSyl, Parse* helpers,
// ClosestBB/ClosestNeume/StaffSort comparators and all editor action bodies.
import { EditorToolkit } from './editortoolkit.js';
import { JsonxxArray, JsonxxObject } from './jsonxx.js';
import { VrvObject } from './object.js';
import { Syllable } from './syllable.js';
import { Syl } from './syl.js';
import { Text } from './text.js';
import { Zone } from './zone.js';
import { LogError, LogWarning } from './vrv.js';
import { UTF8to32 } from './vrv.js';
import { ClassIdComparison, InterfaceComparison } from './comparison.js';
import { Att } from './att.js';
import { AttModule } from './attmodule.js';
import { Staff } from './staff.js';
import { Layer } from './layer.js';
import { Measure } from './measure.js';
import { System } from './system.js';
import { Sb } from './sb.js';
import { Neume } from './neume.js';
import { Nc } from './nc.js';
import { Clef } from './clef.js';
import { Custos } from './custos.js';
import { Accid } from './accid.js';
import { DivLine } from './divline.js';
import { Quilisma } from './quilisma.js';
import { Oriscus } from './oriscus.js';
import { Liquescent } from './liquescent.js';
import { Surface } from './surface.js';
import { BOOLEAN_true } from './linkinginterface.js';
import { ClassId, InterfaceId, MeasureType, NOTE_HEIGHT_TO_STAFF_SIZE_RATIO, NOTE_WIDTH_TO_STAFF_SIZE_RATIO } from './vrvdef.js';
import { ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_n } from './accid.js';
import { divLineLog_FORM_NONE, divLineLog_FORM_maxima, divLineLog_FORM_maior, divLineLog_FORM_minima, divLineLog_FORM_finalis, divLineLog_FORM_caesura, divLineLog_FORM_virgula } from './atts_neumes.js';
import { ncForm_CON_NONE, ncForm_CON_e } from './atts_neumes.js';

function getZoneAny(obj: AnyObj): AnyObj | null {
  const fi = obj.GetFacsimileInterface() as unknown as { GetZone(): unknown } | null;
  if (!fi) return null;
  return (fi.GetZone() as AnyObj | null) ?? null;
}

function getPitchAny(obj: AnyObj): AnyObj | null {
  const pi = (obj.GetPitchInterface ? obj.GetPitchInterface() : null) as AnyObj | null;
  return pi ?? null;
}

/** C++ std::set_difference on pointer identity. */
function setDiff(a: VrvObject[], b: VrvObject[]): VrvObject[] {
  const bs = new Set<VrvObject>(b);
  return a.filter((x) => !bs.has(x));
}

function lastOf(page: AnyObj): VrvObject {
  const l = page.GetLast() as VrvObject | null;
  if (!l) throw new Error('EditorToolkitNeume: page has no last object.');
  return l;
}

function docOf(self: unknown): AnyObj {
  return (self as unknown as { m_doc: unknown }).m_doc as AnyObj;
}

function statusOf(self: unknown): AnyObj {
  return (self as unknown as { m_editStatus: unknown }).m_editStatus as AnyObj;
}

function viewOf(self: unknown): AnyObj {
  return (self as unknown as { m_view: unknown }).m_view as AnyObj;
}

function staffSizeOf(staff: AnyObj): number {
  return staff.GetDrawingStaffSize ? staff.GetDrawingStaffSize() : staff.m_drawingStaffSize;
}

const NOTATIONTYPE_neume = 5;

const COMPASSDIRECTION_s = 3, COMPASSDIRECTION_se = 7, COMPASSDIRECTION_n = 1;
const curvatureDirection_CURVE_a = 1, curvatureDirection_CURVE_c = 2;
const CLEFSHAPE_NONE = 0, CLEFSHAPE_G = 1, CLEFSHAPE_F = 3, CLEFSHAPE_C = 4;

type AnyObj = VrvObject & Record<string, any>;

// Canonical MEI ordinals shared with clef.ts module-local consts.
const OCTAVE_DIS_NONE = 0, OCTAVE_DIS_8 = 8, OCTAVE_DIS_15 = 15, OCTAVE_DIS_22 = 22;
const STAFFREL_basic_NONE = 0, STAFFREL_basic_above = 1, STAFFREL_basic_below = 2;

function pitchedBetween(page: AnyObj, start: VrvObject, end: VrvObject | null): VrvObject[] {
  const out: VrvObject[] = [];
  const fin = (end ?? page.GetLast()) as VrvObject;
  page.FindAllDescendantsBetween(out, new InterfaceComparison(InterfaceId.INTERFACE_PITCH), start, fin);
  return out;
}

function adjustRange(page: AnyObj, prev: AnyObj | null, cur: AnyObj, targets: VrvObject[]): void {
  for (const o of targets) {
    const pi = (o as AnyObj).GetPitchInterface ? (o as AnyObj).GetPitchInterface() as AnyObj | null : null;
    if (!pi) throw new Error('EditorToolkitNeume: pitched element without PitchInterface.');
    pi.AdjustPitchForNewClef(prev, cur);
  }
}

function currentClefOf(layer: AnyObj): AnyObj | null {
  return (typeof layer.GetCurrentClef === 'function' ? layer.GetCurrentClef() : null) as AnyObj | null;
}

// Canonical libMEI ordinals (atttypes.h / clef.ts locals): NONE=0, F=3, C=4.

// Canonical curvatureDirection_CURVE ordinals (atttypes.h): NONE=0, a=1, c=2.
const CURVE_NONE = 0;
const CURVE_a = 1;
const CURVE_c = 2;

/** Shared Att converter fallback (same ponytail as part 6). */
function asAttElement(element: AnyObj): Parameters<typeof AttModule.SetShared>[0] {
  const sharedAtt = new Att();
  return new Proxy(element as unknown as Record<string, unknown>, {
    get: (t, p, r) => {
      const v = Reflect.get(t, p, r);
      if (typeof v === 'function') return (v as (...a: never[]) => unknown).bind(t);
      if (v !== undefined) return v;
      const c = (sharedAtt as unknown as Record<string, unknown>)[p as string];
      return typeof c === 'function' ? (c as (...a: never[]) => unknown).bind(sharedAtt) : c;
    },
  }) as unknown as Parameters<typeof AttModule.SetShared>[0];
}

/** C++ Syllable inherits precedes/follows via LayerElement::LinkingInterface. */
function linkOf(obj: AnyObj): { HasPrecedes(): boolean; GetPrecedes(): string; SetPrecedes(v: string): void; HasFollows(): boolean; GetFollows(): string; SetFollows(v: string): void } {
  const li = obj.GetLinkingInterface() as unknown as {
    HasPrecedes(): boolean; GetPrecedes(): string; SetPrecedes(v: string): void;
    HasFollows(): boolean; GetFollows(): string; SetFollows(v: string): void;
  } | null;
  if (!li) throw new Error('EditorToolkitNeume: linking interface required.');
  return li;
}

function facsZoneOf(obj: AnyObj, what: string): AnyObj | null {
  const fi = obj.GetFacsimileInterface() as unknown as { GetZone(): unknown } | null;
  if (!fi) throw new Error(`EditorToolkitNeume.Group: ${what} facsimile required.`);
  return fi.GetZone() as AnyObj | null;
}

function zoneNum(z: AnyObj, method: string): number {
  return (z[method] as () => number).call(z);
}

/** C++ GetChildCount(NC, 2) depth-2 semantic: sum of per-NEUME direct NC counts. */
function ncCountDepth2(container: AnyObj): number {
  let total = 0;
  let neume = container.GetFirst(ClassId.NEUME) as unknown as AnyObj | null;
  while (neume) {
    total += neume.GetChildCount(ClassId.NC);
    const next = container.GetNextOf(neume as unknown as VrvObject, ClassId.NEUME) as unknown as AnyObj | null;
    if (!next || next === neume) break;
    neume = next;
  }
  return total;
}

const BOOLEAN_false = 2;

/** Facsimile-zone accessor with C++-assert parity (throws on missing contract). */
function zoneOf(obj: AnyObj, what: string): AnyObj {
  const fi = obj.GetFacsimileInterface() as unknown as { GetZone(): unknown } | null;
  if (!fi) throw new Error();
  const zone = fi.GetZone() as AnyObj | null;
  if (!zone) throw new Error();
  return zone;
}

function zoneGet(z: AnyObj, method: string): number {
  return (z[method] as () => number).call(z);
}

function zoneSet(z: AnyObj, method: string, v: number): void {
  (z[method] as (v: number) => void).call(z, v);
}

/** C++ GetChildCount(NC, 2) depth-2 semantic: sum of per-NEUME direct NC counts. */
function ncDepth2(container: AnyObj): number {
  let total = 0;
  let neume = container.GetFirst(ClassId.NEUME) as unknown as AnyObj | null;
  while (neume) {
    total += neume.GetChildCount(ClassId.NC);
    const next = container.GetNextOf(neume as unknown as VrvObject, ClassId.NEUME) as unknown as AnyObj | null;
    if (!next || next === neume) break;
    neume = next;
  }
  return total;
}

/** Facsimile-zone accessor with C++-assert parity (throws on missing contract). */

// atttypes.h order: NONE=0, cmn=1, mensural=2, mensural_black=3,
// mensural_white=4, neume=5, neume_square=6, neume_hufnagel=7.
const NOTATIONTYPE_neume_hufnagel = 7;

function zoneField(z: AnyObj, method: string): number {
  return (z[method] as () => number).call(z);
}

function zonePut(z: AnyObj, method: string, v: number): void {
  (z[method] as (v: number) => void).call(z, v);
}

/** Facsimile-zone accessor with C++ Nc::GetZone() parity (throws on missing contract). */
function ligZone(nc: AnyObj): AnyObj {
  const fi = nc.GetFacsimileInterface() as unknown as { GetZone(): unknown } | null;
  if (!fi) throw new Error('EditorToolkitNeume.part15: nc facsimile required.');
  const zone = fi.GetZone() as AnyObj | null;
  if (!zone) throw new Error('EditorToolkitNeume.part15: nc zone required.');
  return zone;
}

type _AnyObjAny = any;

function getStatus(tk: AnyObj): AnyObj {
  return (tk as unknown as { m_editStatus: AnyObj }).m_editStatus;
}

// C++: bool EditorToolkitNeume::ChangeStaffTo(std::string elementId, std::string staffId)

export type NeumeAttrPair = [string, string];

function strVal(v: unknown): string | null { return typeof v === 'string' ? v : null; }
function numVal(v: unknown): number | null { return typeof v === 'number' ? v : null; }
function objVal(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function getZoneOf(obj: VrvObject): { GetUlx(): number; GetUly(): number; GetLrx(): number; GetLry(): number; HasRotate(): boolean; GetRotate(): number } | null {
  const fi = obj.GetFacsimileInterface() as unknown as { GetZone(): unknown } | null;
  if (!fi) return null;
  const z = fi.GetZone() as unknown as {
    GetUlx(): number; GetUly(): number; GetLrx(): number; GetLry(): number; HasRotate(): boolean; GetRotate(): number;
  } | null;
  return z ?? null;
}

/** C++ ClosestBB comparator struct. */
export class ClosestBB {
  public x = 0;
  public y = 0;
  public distanceToBB(ulx: number, uly: number, lrx: number, lry: number, rotate = 0): number {
    const offset = (this.x - ulx) * Math.tan((rotate * Math.PI) / 180.0);
    uly += offset;
    lry += offset;
    const xDiff = Math.max(ulx > this.x ? ulx - this.x : 0, this.x > lrx ? this.x - lrx : 0);
    const yDiff = Math.max(uly > this.y ? uly - this.y : 0, this.y > lry ? this.y - lry : 0);
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  }
  public compare(a: VrvObject, b: VrvObject): boolean {
    const za = getZoneOf(a);
    const zb = getZoneOf(b);
    if (!za || !zb) return true;
    const distA = this.distanceToBB(za.GetUlx(), za.GetUly(), za.GetLrx(), za.GetLry(), za.HasRotate() ? za.GetRotate() : 0);
    const distB = this.distanceToBB(zb.GetUlx(), zb.GetUly(), zb.GetLrx(), zb.GetLry(), zb.HasRotate() ? zb.GetRotate() : 0);
    return distA < distB;
  }
}

/** C++ ClosestNeume comparator struct. */
export class ClosestNeume {
  public x = 0;
  public y = 0;
  public compare(a: VrvObject, b: VrvObject): boolean {
    const aNc = a.GetFirst(ClassId.NC);
    if (!aNc) { LogError('Neume %s doesn\'t have neume components.'); return true; }
    const bNc = b.GetFirst(ClassId.NC);
    if (!bNc) { LogError('Neume %s doesn\'t have neume components.'); return true; }
    const za = getZoneOf(aNc);
    if (!za) { LogError('Neume component %s doesn\'t have facsimile.'); return true; }
    const zb = getZoneOf(bNc);
    if (!zb) { LogError('Neume component %s doesn\'t have facsimile.'); return true; }
    return Math.abs(this.x - za.GetUlx()) < Math.abs(this.x - zb.GetUlx());
  }
}

/** C++ StaffSort comparator struct (neume lines only). */
export class StaffSort {
  public compare(a: VrvObject, b: VrvObject): boolean {
    if (!a.Is(ClassId.SYSTEM) || !b.Is(ClassId.SYSTEM)) return false;
    const mA = a.FindDescendantByType(ClassId.MEASURE) as unknown as { IsNeumeLine(): boolean } | null;
    const mB = b.FindDescendantByType(ClassId.MEASURE) as unknown as { IsNeumeLine(): boolean } | null;
    if (!mA || !mB) return false;
    if (!mA.IsNeumeLine() || !mB.IsNeumeLine()) return true;
    const sA = a.FindDescendantByType(ClassId.STAFF) as unknown as {
      HasType(): boolean; GetType(): string | null; GetFacsimileInterface(): { GetZone(): unknown };
    } | null;
    const sB = b.FindDescendantByType(ClassId.STAFF) as unknown as {
      HasType(): boolean; GetType(): string | null; GetFacsimileInterface(): { GetZone(): unknown };
    } | null;
    if (!sA || !sB) return false;
    if (sA.HasType() && sB.HasType()) {
      const typeA = String(sA.GetType() ?? '');
      const typeB = String(sB.GetType() ?? '');
      if (typeA.startsWith('column') && typeB.startsWith('column')) {
        const columnA = parseInt(typeA.substring(6), 10);
        const columnB = parseInt(typeB.substring(6), 10);
        if (columnA !== columnB) return columnA < columnB;
      }
    }
    const zoneA = sA.GetFacsimileInterface().GetZone() as unknown as {
      GetUlx(): number; GetUly(): number; GetLrx(): number; GetLry(): number; GetRotate(): number;
    } | null;
    const zoneB = sB.GetFacsimileInterface().GetZone() as unknown as {
      GetUlx(): number; GetUly(): number; GetLrx(): number; GetLry(): number; GetRotate(): number;
    } | null;
    if (!zoneA || !zoneB) return false;
    const rotA = zoneA.GetRotate();
    const rotB = zoneB.GetRotate();
    const wA = zoneA.GetLrx() - zoneA.GetUlx();
    const aLowest = rotA < 0 ? zoneA.GetLry() : zoneA.GetLry() + wA * Math.tan((rotA * Math.PI) / 180.0);
    const aHighest = rotA < 0 ? zoneA.GetUly() : zoneA.GetUly() - wA * Math.tan((rotA * Math.PI) / 180.0);
    const bLowest = rotB < 0 ? zoneB.GetLry() : zoneB.GetLry() + (zoneB.GetLrx() - zoneB.GetUlx()) * Math.tan((rotB * Math.PI) / 180.0);
    const bHighest = rotB < 0 ? zoneB.GetUly() : zoneB.GetUly() - (zoneB.GetLrx() - zoneB.GetUlx()) * Math.tan((rotB * Math.PI) / 180.0);
    const yOverlap = (aLowest <= bLowest && aLowest >= bHighest) || (aHighest <= bLowest && aHighest >= bHighest)
      || (bLowest <= aLowest && bLowest >= aHighest) || (bHighest <= aLowest && bHighest >= aHighest);
    if (yOverlap && zoneA.GetLrx() - zoneB.GetUlx() <= 0.5 * wA) {
      return zoneA.GetUlx() < zoneB.GetUlx();
    }
    return zoneA.GetUly() < zoneB.GetUly();
  }
}

export class EditorToolkitNeume extends EditorToolkit {
  public constructor(doc: unknown, view: unknown) {
    super(doc as never, view as never);
  }

  private get doc(): any { return this.m_doc as any; }
  private get status(): any { return this.m_editStatus as any; }

  public override ParseEditorAction(jsonEditorAction: string): boolean {
    const json = new JsonxxObject();
    this.status.reset();
    if (!json.parse(jsonEditorAction)) {
      LogError('Cannot parse JSON std::string.');
      this.status.import('status', 'FAILURE');
      this.status.import('message', 'Cannot parse JSON from std::string ' + jsonEditorAction);
      return false;
    }
    const actionV = json.has('action') ? json.getValue('action') : undefined;
    const paramV = json.has('param') ? json.getValue('param') : undefined;
    if (typeof actionV !== 'string' || (paramV === undefined || paramV === null)) {
      LogWarning('Incorrectly formatted JSON action');
      this.status.import('status', 'FAILURE');
      this.status.import('message', 'JSON action incorrectly formatted.');
      return false;
    }
    const action = actionV;
    const param = paramV;
    if (action !== 'chain' && Array.isArray(param)) {
      LogWarning("Only 'chain' uses 'param' as an array.");
      this.status.import('status', 'FAILURE');
      this.status.import('message', "'param' can only be an array for a chain action.");
      return false;
    }
    const p = objVal(param);
    if (action === 'addSyl') {
      if (p) {
        const out = this.ParseAddSylAction(p);
        if (out) return this.AddSyl(out.elementId, out.sylText);
      }
      LogWarning('Could not parse the addSyl action');
    }
    else if (action === 'drag') {
      if (p) {
        const out = this.ParseDragAction(p);
        if (out) return this.Drag(out.elementId, out.x, out.y);
      }
      LogWarning('Could not parse the drag action');
    }
    else if (action === 'insert') {
      if (p) {
        const out = this.ParseInsertCoordsAction(p);
        if (out) return this.Insert(out.elementType, out.staffId, out.ulx, out.uly, out.lrx, out.lry, out.attributes);
      }
      LogWarning('Could not parse the insert action');
    }
    else if (action === 'insertToSyllable') {
      if (p) {
        const out = this.ParseIdAction(p);
        if (out) return this.InsertToSyllable(out);
      }
      LogWarning('Could not parse the insert action');
    }
    else if (action === 'moveOutsideSyllable') {
      if (p) {
        const out = this.ParseIdAction(p);
        if (out) return this.MoveOutsideSyllable(out);
      }
      LogWarning('Could not parse the insert action');
    }
    else if (action === 'displaceClefOctave') {
      if (p) {
        const out = this.ParseDisplaceClefAction(p);
        if (out) return this.DisplaceClefOctave(out.elementId, out.direction);
      }
      LogWarning('Could not parse the displace clef octave action');
    }
    else if (action === 'set') {
      if (p) {
        const out = this.ParseSetAction(p);
        if (out) return this.Set(out.elementId, out.attrType, out.attrValue);
      }
      LogWarning('Could not parse the set action');
    }
    else if (action === 'setText') {
      if (p) {
        const out = this.ParseSetTextAction(p);
        if (out) return this.SetText(out.elementId, out.text);
      }
      LogWarning('Could not parse the set text action');
    }
    else if (action === 'setClef') {
      if (p) {
        const out = this.ParseSetClefAction(p);
        if (out) return this.SetClef(out.elementId, out.shape);
      }
      LogWarning('Could not parse the set clef action');
    }
    else if (action === 'setLiquescent') {
      if (p) {
        const out = this.ParseSetLiquescentAction(p);
        if (out) return this.SetLiquescent(out.elementId, out.shape);
      }
      LogWarning('Could not parse the set liquescent action');
    }
    else if (action === 'setAquitanianElement') {
      if (p) {
        const out = this.ParseSetAquitanianElementAction(p);
        if (out) return this.SetAquitanianElement(out.elementId, out.shape);
      }
      LogWarning('Could not parse the set aquitanian element action');
    }
    else if (action === 'remove') {
      if (p) {
        const out = this.ParseIdAction(p);
        if (out) return this.Remove(out);
      }
      LogWarning('Could not parse the remove action');
    }
    else if (action === 'resize') {
      if (p) {
        const out = this.ParseResizeAction(p);
        if (out) return this.Resize(out.elementId, out.ulx, out.uly, out.lrx, out.lry);
      }
      LogWarning('Could not parse the resize action');
    }
    else if (action === 'resizeRotate') {
      if (p) {
        const out = this.ParseResizeRotateAction(p);
        if (out) return this.Resize(out.elementId, out.ulx, out.uly, out.lrx, out.lry, out.rotate);
      }
    }
    else if (action === 'chain') {
      if (!Array.isArray(param)) {
        LogError('Incorrectly formatted JSON action');
        return false;
      }
      return this.Chain(param as unknown[]);
    }
    else if (action === 'group') {
      if (p) {
        const out = this.ParseGroupAction(p);
        if (out) return this.Group(out.groupType, out.elementIds);
      }
    }
    else if (action === 'ungroup') {
      if (p) {
        const out = this.ParseGroupAction(p);
        if (out) return this.Ungroup(out.groupType, out.elementIds);
      }
    }
    else if (action === 'splitNeume') {
      if (p) {
        const out = this.ParseSplitNeumeAction(p);
        if (out) return this.SplitNeume(out.elementId, out.ncId);
      }
    }
    else if (action === 'matchHeight') {
      if (p) {
        const out = this.ParseIdAction(p);
        if (out) return this.MatchHeight(out);
      }
      LogWarning('Could not parse the insert action');
    }
    else if (action === 'merge') {
      if (p) {
        const out = this.ParseIdsAction(p);
        if (out) return this.Merge(out);
      }
      LogWarning('Could not parse merge action');
    }
    else if (action === 'split') {
      if (p) {
        const out = this.ParseSplitAction(p);
        if (out) return this.Split(out.elementId, out.x);
      }
      LogWarning('Could not parse split action');
    }
    else if (action === 'changeGroup') {
      if (p) {
        const out = this.ParseChangeGroupAction(p);
        if (out) return this.ChangeGroup(out.elementId, out.contour);
      }
      LogWarning('Could not parse change group action');
    }
    else if (action === 'toggleLigature') {
      if (p) {
        const out = this.ParseIdsAction(p);
        if (out) return this.ToggleLigature(out);
      }
      LogWarning('Could not parse toggle ligature action');
    }
    else if (action === 'toggleNeumeConnection') {
      if (p) {
        const out = this.ParseIdsAction(p);
        if (out) return this.ToggleNeumeConnection(out);
      }
      LogWarning('Could not parse toggle neume connection action');
    }
    else if (action === 'changeStaff') {
      if (p) {
        const out = this.ParseIdAction(p);
        if (out) return this.ChangeStaff(out);
      }
      LogWarning('Could not parse change staff action');
    }
    else if (action === 'changeStaffTo') {
      if (p) {
        const out = this.ParseChangeStaffToAction(p);
        if (out) return this.ChangeStaffTo(out.elementId, out.staffId);
      }
      LogWarning('Could not parse change staff action');
    }
    else {
      LogWarning("Unknown action type '%s'.");
    }
    this.status.import('status', 'FAILURE');
    this.status.import('message', 'Action ' + action + ' could not be parsed or is unknown.');
    return false;
  }

  public Chain(actions: unknown[]): boolean {
    let status = true;
    const results = new JsonxxObject();
    for (let i = 0; i < actions.length; ++i) {
      const item = objVal(actions[i]);
      if (!item) {
        LogError('Action %d was not an object');
        this.status.reset();
        this.status.import('status', 'FAILURE');
        this.status.import('message', 'Action ' + String(i) + ' was not an object.');
        return false;
      }
      status = this.ParseEditorAction(JSON.stringify(actions[i])) || status;
      // ponytail: C++ `results.import(i, m_editStatus)` nests status object by index;
      // JsonxxObject.import stores unknown — keep nested JSON string parse ceiling, upgrade with typed clone when needed.
      try {
        results.import(String(i), JSON.parse(this.status.json()));
      } catch { results.import(String(i), this.status.json()); }
    }
    // Replace status contents with collected results (C++ `m_editStatus = results`).
    this.status.reset();
    try {
      const parsed = JSON.parse(results.json()) as Record<string, unknown>;
      for (const k of Object.keys(parsed)) this.status.import(k, parsed[k]);
    } catch { /* keep empty on unexpected serialize failure */ }
    return status;
  }

  public AddSyl(elementId: string, sylText: string): boolean {
    const page = this.doc.GetDrawingPage() as VrvObject | null;
    if (!page) {
      LogError('Could not get the drawing page.');
      this.status.import('status', 'FAILURE');
      this.status.import('message', 'Could not get the drawing page.');
      return true;
    }
    const syllable = page.FindDescendantByID(elementId) as Syllable | null;
    if (!syllable) {
      LogError('Unable to find syllable with id %s');
      this.status.import('status', 'FAILURE');
      this.status.import('message', 'Unable to find neume with id ' + elementId + '.');
      return false;
    }
    const syl = new Syl();
    const text = new Text();
    text.SetText(UTF8to32(sylText));
    syl.AddChild(text as unknown as VrvObject);
    (syllable as unknown as VrvObject).AddChild(syl as unknown as VrvObject);

    if (this.doc.HasFacsimile()) {
      const zone = new Zone();
      const staff = (syllable as unknown as { GetAncestorStaff(): any }).GetAncestorStaff();
      const staffSize = this.doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
      const firstNc = (syllable as unknown as VrvObject).GetFirst(ClassId.NEUME)?.GetFirst(ClassId.NC) as VrvObject | null;
      const lastNc = (syllable as unknown as VrvObject).GetLast(ClassId.NEUME)?.GetLast(ClassId.NC) as VrvObject | null;
      const zFirst = firstNc ? getZoneOf(firstNc) : null;
      const zLast = lastNc ? getZoneOf(lastNc) : null;
      const zStaff = staff?.GetFacsimileInterface?.()?.GetZone?.() as unknown as {
        GetLry(): number;
      } | null;
      if (!zFirst || !zLast || !zStaff) {
        LogError('AddSyl: missing facsimile zone.');
        this.status.import('status', 'FAILURE');
        this.status.import('message', 'AddSyl: missing facsimile zone.');
        return false;
      }
      zone.SetUlx(zFirst.GetUlx());
      zone.SetUly(zStaff.GetLry());
      zone.SetLrx(zLast.GetLrx());
      zone.SetLry(zone.GetUly() + staffSize * 2);
      // C++ quirk: GetChildCount(NC, 2) threshold overload preserved as depth-limited count.
      if ((syllable as unknown as VrvObject).GetChildCount(ClassId.NC) <= 2) {
        zone.SetLrx(zone.GetLrx() + 50);
      }
      const facsimile = this.doc.GetFacsimile() as VrvObject | null;
      facsimile?.FindDescendantByType(ClassId.SURFACE)?.AddChild(zone as unknown as VrvObject);
      const fi = (syl as unknown as VrvObject).GetFacsimileInterface() as unknown as {
        AttachZone(z: unknown): void;
      } | null;
      if (fi) fi.AttachZone(zone);
      if (this.doc.IsTranscription() && this.doc.HasFacsimile()) this.doc.SyncFromFacsimileDoc();
    }

    this.status.import('uuid', elementId);
    this.status.import('status', 'OK');
    this.status.import('message', '');
    return true;
  }

  // --- Editor action bodies ---
  public DisplaceClefOctave(elementId: string, direction: string) {
  const self = this as AnyObj;
  const docOf = (self as unknown as { m_doc: AnyObj }).m_doc;
  const status = (self as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get the drawing page.');
    return false;
  }
  if (direction !== 'above' && direction !== 'below') {
    LogError('Direction can only be either "above" or "below".');
    status.import('status', 'FAILURE');
    status.import('message', 'Direction can only be either "above" or "below".');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const obj = page.FindDescendantByID(elementId) as AnyObj | null;
  if (!obj || !obj.Is(ClassId.CLEF)) {
    LogError('This action can only be done on clefs!');
    status.import('status', 'FAILURE');
    status.import('message', 'This action can only be done on clefs!');
    return false;
  }
  const clef = obj;
  const prevDirection = (clef.GetDisPlace() as number) === STAFFREL_basic_above ? 1 : -1;
  const move = direction === 'above' ? 1 : -1;
  const octaveDis = prevDirection * Math.trunc((clef.GetDis() as number) / 7) + move;
  if (octaveDis > 3 || octaveDis < -3) {
    LogError('Clefs can only be displaced 3 octaves.');
    status.import('status', 'FAILURE');
    status.import('message', 'Clefs can only be displaced 3 octaves.');
    return false;
  }
  if (octaveDis === 0) {
    clef.SetDis(OCTAVE_DIS_NONE);
    clef.SetDisPlace(STAFFREL_basic_NONE);
  } else {
    let displaced = OCTAVE_DIS_NONE;
    if (octaveDis === 1 || octaveDis === -1) displaced = OCTAVE_DIS_8;
    else if (octaveDis === 2 || octaveDis === -2) displaced = OCTAVE_DIS_15;
    else if (octaveDis === 3 || octaveDis === -3) displaced = OCTAVE_DIS_22;
    clef.SetDis(displaced);
    clef.SetDisPlace(octaveDis > 0 ? STAFFREL_basic_above : STAFFREL_basic_below);
  }
  const equalsClef = new ClassIdComparison(ClassId.CLEF);
  const nextClef = page.FindNextChild(equalsClef, clef) as AnyObj | null;
  const endBound = (nextClef ?? page.GetLast()) as VrvObject;
  const ncs: VrvObject[] = [];
  page.FindAllDescendantsBetween(ncs, new ClassIdComparison(ClassId.NC), clef, endBound);
  for (const ncObj of ncs) {
    const pi = (ncObj as AnyObj).GetPitchInterface ? (ncObj as AnyObj).GetPitchInterface() as { GetOct(): number; SetOct(v: number): void } | null : null;
    if (!pi) throw new Error('EditorToolkitNeume.DisplaceClefOctave: Nc without PitchInterface.');
    pi.SetOct(pi.GetOct() + move);
  }
  const custodes: VrvObject[] = [];
  page.FindAllDescendantsBetween(custodes, new ClassIdComparison(ClassId.CUSTOS), clef, endBound);
  for (const cObj of custodes) {
    const c = cObj as unknown as { GetOct(): number; SetOct(v: number): void };
    c.SetOct(c.GetOct() + move);
  }
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public Drag(elementId: string, x: number, y: number, topLevel = true) {
  const doc = docOf(this);
  const status = statusOf(this);
  let statusStr = 'OK';
  let message = '';
  const page0 = doc.GetDrawingPage() as AnyObj | null;
  if (!page0) {
    LogError('Could not get drawing page.');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get drawing page.');
    return false;
  }
  let element = page0.FindDescendantByID(elementId) as AnyObj | null;
  if (!element) element = doc.FindDescendantByID(elementId) as AnyObj | null;
  if (!element) {
    LogWarning('element is null');
    statusStr = 'WARNING';
    message += 'Element is null. ';
    // C++ `assert(element)` — explicit invariant failure instead of UB.
    status.import('status', statusStr);
    status.import('message', message);
    return true;
  }

  if (element.Is(ClassId.CUSTOS)) {
    getZoneAny(element)?.ShiftByXY(x, -y);
    (this as any).AdjustPitchAfterDrag(element, y);
  }
  else if (element.Is(ClassId.SYLLABLE)) {
    const clefs: VrvObject[] = [];
    element.FindAllDescendantsByComparison(clefs, new ClassIdComparison(ClassId.CLEF));
    if (clefs.length !== 0) {
      for (const o of clefs) (this as any).Drag((o as AnyObj).GetID(), x, y, false);
    }
    const ncs: VrvObject[] = [];
    element.FindAllDescendantsByComparison(ncs, new ClassIdComparison(ClassId.NC));
    for (const o of ncs) (this as any).Drag((o as AnyObj).GetID(), x, y, false);
  }
  else if (element.Is(ClassId.NEUME)) {
    const ncs: VrvObject[] = [];
    element.FindAllDescendantsByComparison(ncs, new ClassIdComparison(ClassId.NC));
    for (const o of ncs) (this as any).Drag((o as AnyObj).GetID(), x, y, false);
  }
  else if (element.Is(ClassId.NC)) {
    let skipLigature = false;
    const nc = element as AnyObj;
    // Local ligated ordinal: BOOLEAN_true == 1 (linkinginterface.ts).
    if (nc.GetLigated && nc.GetLigated() === 1) {
      const neume = nc.GetFirstAncestor(ClassId.NEUME) as AnyObj | null;
      const nextNc = neume ? (neume.GetChild(1 + neume.GetChildIndex(element)) as AnyObj | null) : null;
      if (nextNc && nextNc.GetLigated && nextNc.GetLigated() === 1 && getZoneAny(nextNc) === getZoneAny(nc)) {
        skipLigature = true;
      }
    }
    if (!skipLigature) getZoneAny(element)?.ShiftByXY(x, -y);
    (this as any).AdjustPitchAfterDrag(nc, y);
  }
  else if (element.Is(ClassId.CLEF)) {
    const clef = element as AnyObj;
    if (!clef.HasFacs()) {
      LogError('Clef dragging is only supported for clefs with facsimiles!');
      status.import('status', 'FAILURE');
      status.import('message', 'Clef dragging is only supported for clefs with facsimiles.');
      return false;
    }
    const fi = clef.GetFacsimileInterface() as unknown as { GetZone(): AnyObj | null } | null;
    const parent = clef.GetParent() as AnyObj | null;
    if (parent && parent.Is(ClassId.SYLLABLE)) {
      const first = parent.GetFirst(ClassId.NEUME) as AnyObj | null;
      const lastNeume = parent.GetLast(ClassId.NEUME) as AnyObj | null;
      const lNc = (parent.GetChildCount(ClassId.NEUME) === 1 ? first?.GetLast() : lastNeume?.GetLast()) as AnyObj | null;
      const xRight = lNc ? getZoneAny(lNc)?.GetLrx() as number | undefined : undefined;
      const clefInitial = fi?.GetZone()?.GetLrx() as number | undefined;
      if (xRight === undefined || clefInitial === undefined) {
        LogError('Clef dragging failed: missing facsimile zones.');
        status.import('status', 'FAILURE');
        status.import('message', 'Clef dragging failed: missing facsimile zones.');
        return false;
      }
      const clefTarget = clefInitial + x;
      if (clefTarget < xRight) {
        (this as any).ClefMovementHandler(clef, x, y);
      }
      else {
        const distanceToSyllableEnd = xRight - clefInitial + 1;
        const distanceRemaining = clefTarget - xRight - 1;
        (this as any).ClefMovementHandler(clef, distanceToSyllableEnd, y);
        fi?.GetZone()?.ShiftByXY(distanceRemaining, 0);
      }
    }
    else {
      (this as any).ClefMovementHandler(clef, x, y);
    }
    doc.ScoreDefSetCurrentDoc(true);
  }
  else if (element.Is(ClassId.STAFF)) {
    const staff = element as AnyObj;
    if (!staff.HasFacs()) {
      LogError('Staff dragging is only supported for staves with facsimiles!');
      status.import('status', 'FAILURE');
      status.import('message', 'Staff dragging is only supported for staves with facsimiles.');
      return false;
    }
    getZoneAny(staff)?.ShiftByXY(x, -y);
    const children: VrvObject[] = [];
    staff.FindAllDescendantsByComparison(children, new InterfaceComparison(InterfaceId.INTERFACE_FACSIMILE));
    for (const o of children) getZoneAny(o as AnyObj)?.ShiftByXY(x, -y);
    (this as any).SortStaves();
    if (doc.IsTranscription() && doc.HasFacsimile()) doc.SyncFromFacsimileDoc();
    (doc.GetDrawingPage() as AnyObj)?.LayOutTranscription(true);
    return true;
  }
  else if (element.Is(ClassId.SYL)) {
    if (!element.HasFacs()) {
      LogError('Syl (boundingbox) dragging is only supported for syls with facsimiles!');
      status.import('status', 'FAILURE');
      status.import('message', 'Syl dragging is only supported for syls with facsimiles.');
      return false;
    }
    getZoneAny(element)?.ShiftByXY(x, -y);
  }
  else if (element.Is(ClassId.ACCID)) {
    if (!element.HasFacs()) {
      LogError('Accid dragging is only supported for accid with facsimiles!');
      status.import('status', 'FAILURE');
      status.import('message', 'Accid dragging is only supported for accid with facsimiles.');
      return false;
    }
    getZoneAny(element)?.ShiftByXY(x, -y);
  }
  else if (element.Is(ClassId.DIVLINE)) {
    if (!element.HasFacs()) {
      LogError('DivLine dragging is only supported for divLine with facsimiles!');
      status.import('status', 'FAILURE');
      status.import('message', 'DivLine dragging is only supported for divLine with facsimiles.');
      return false;
    }
    getZoneAny(element)?.ShiftByXY(x, -y);
    (this as any).ChangeStaff(elementId);
  }
  else {
    LogWarning('Unsupported element for dragging.');
    status.import('status', 'FAILURE');
    status.import('message', 'Unsupported element for dragging.');
    return false;
  }

  if (topLevel) {
    const layer = element.GetFirstAncestor(ClassId.LAYER) as AnyObj | null;
    layer?.ReorderByXPos();
    if (doc.IsTranscription() && doc.HasFacsimile()) doc.SyncFromFacsimileDoc();
    (doc.GetDrawingPage() as AnyObj)?.LayOutTranscription(true);
    status.import('status', statusStr);
    status.import('message', message);
  }
  return true;
}
  public Insert(elementType: string, staffId: string,
  ulx: number, uly: number, lrx: number, lry: number,
  attributes: NeumeAttrPair[],) {
  const doc = docOf(this);
  const status = statusOf(this);
  const page = doc.GetDrawingPage() as AnyObj | null;
  if (!page) {
    LogError('Could not get drawing page');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get drawing page.');
    return false;
  }
  if (!doc.HasFacsimile()) {
    LogError('Drawing page without facsimile');
    status.import('status', 'FAILURE');
    status.import('message', 'Drawing page without facsimile is unsupported.');
    return false;
  }

  const statusStr = 'OK';
  const message = '';

  let staff: AnyObj | null = null;
  if (staffId === 'auto') {
    const staves = doc.FindAllDescendantsByType(ClassId.STAFF, false) as VrvObject[];
    if (staves.length > 0) {
      const cmp = new ClosestBB();
      cmp.x = ulx; cmp.y = uly;
      const sorted = [...staves].sort((a, b) => (cmp.compare(a, b) ? -1 : 1));
      staff = sorted[0] as AnyObj;
    }
  }
  else {
    staff = doc.FindDescendantByID(staffId) as AnyObj | null;
  }

  const facsimile = doc.GetFacsimile() as AnyObj;
  const zone = new Zone();

  if (elementType === 'staff') {
    const newSystem = new System();
    const newSb = new Sb();
    const newMeasure = new Measure(MeasureType.NEUMELINE);
    const newLayer = new Layer();
    let columnValue = '';
    let newStaff: Staff;
    if (staff) {
      columnValue = staff.GetType();
      const n = page.GetChildCount(ClassId.SYSTEM) + 1;
      newStaff = new Staff(n);
      (newStaff as AnyObj).SetDrawingStaffDef(staff.GetDrawingStaffDef());
      (newStaff as AnyObj).SetDrawingNotationType(staff.GetDrawingNotationType());
      (newStaff as AnyObj).SetDrawingLines(staff.GetDrawingLines());
    }
    else {
      newStaff = new Staff(1);
      const score = doc.GetCorrespondingScore(page) as AnyObj;
      const scoreDef = score.GetScoreDef() as AnyObj;
      (newStaff as AnyObj).SetDrawingStaffDef(scoreDef.FindDescendantByType(ClassId.STAFFDEF));
      (newStaff as AnyObj).SetDrawingNotationType(NOTATIONTYPE_neume);
      (newStaff as AnyObj).SetDrawingLines(4);
    }
    const lines = (newStaff as AnyObj).GetDrawingLines() as number;
    (newStaff as AnyObj).SetDrawingStaffSize(Math.trunc((uly - lry) / (lines - 1)));
    zone.SetUlx(ulx); zone.SetUly(uly); zone.SetLrx(lrx); zone.SetLry(lry);
    const surface = (doc.GetFacsimile() as AnyObj).FindDescendantByType(ClassId.SURFACE) as AnyObj;
    if (!surface) throw new Error('EditorToolkitNeume.Insert: facsimile has no SURFACE.');
    surface.AddChild(zone);
    (newStaff as unknown as { AttachZone(z: Zone): void }).AttachZone(zone);
    if (columnValue.length) (newStaff as AnyObj).SetType(columnValue);
    newStaff.AddChild(newLayer);
    newMeasure.AddChild(newStaff);
    newSystem.AddChild(newSb);
    newSystem.AddChild(newMeasure);
    const score = doc.GetCorrespondingScore(page) as AnyObj;
    (newSystem as AnyObj).SetDrawingScoreDef(score.GetScoreDef());
    page.InsertAfter(page.GetFirst(ClassId.SCORE) as VrvObject, newSystem);
    (this as any).SortStaves();
    if (doc.IsTranscription() && doc.HasFacsimile()) doc.SyncFromFacsimileDoc();
    status.import('uuid', newStaff.GetID());
    status.import('status', statusStr);
    status.import('message', message);
    return true;
  }

  if (!staff) {
    LogError('A staff must exist in the page to add a non-staff element.');
    status.import('status', 'FAILURE');
    status.import('message', 'A staff must exist in the page to add a non-staff element.');
    return false;
  }
  const layer = staff.FindDescendantByType(ClassId.LAYER) as AnyObj;
  if (!layer) throw new Error('EditorToolkitNeume.Insert: staff has no LAYER.');

  if (elementType === 'nc' || elementType === 'grouping') {
    const syllable = new Syllable();
    const syl = new Syl();
    const neume = new Neume();
    const nc = new Nc() as AnyObj;
    let sylZone: Zone | null = null;
    let contour = '';
    (nc.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void }).AttachZone(zone);
    const surface = facsimile.FindDescendantByType(ClassId.SURFACE) as AnyObj;
    surface.AddChild(zone);
    const text = new Text();
    text.SetText([]);
    syl.AddChild(text);
    neume.AddChild(nc);
    syllable.AddChild(neume);
    syllable.AddChild(syl);
    layer.AddChild(syllable);

    const staffSize = doc.GetDrawingDoubleUnit((staff as AnyObj).GetDrawingStaffSize());
    const noteHeight = Math.trunc(staffSize / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
    const noteWidth = Math.trunc(staffSize / NOTE_WIDTH_TO_STAFF_SIZE_RATIO);
    const offsetX = Math.trunc(noteWidth / 2);
    const offsetY = Math.trunc(noteHeight / 2);
    zone.SetUlx(ulx - offsetX); zone.SetUly(uly - offsetY);
    zone.SetLrx(ulx + offsetX); zone.SetLry(uly + offsetY);

    if (doc.HasFacsimile()) {
      const fi = syl.GetFacsimileInterface() as unknown as { AttachZone(z: Zone): void };
      sylZone = new Zone();
      const staffLry = (staff.GetZone() as AnyObj).GetLry() as number;
      const bboxHeight = 175;
      const bboxOffsetX = 50;
      const theta = staff.GetDrawingRotation() as number;
      let yOff = 0;
      if (theta) yOff = Math.trunc(((ulx - (staff.GetZone() as AnyObj).GetUlx()) as number) * Math.tan(theta * Math.PI / 180.0) / 1.3);
      sylZone.SetUlx(ulx);
      sylZone.SetUly(staffLry + yOff);
      sylZone.SetLrx(ulx + noteWidth + bboxOffsetX);
      sylZone.SetLry(staffLry + yOff + bboxHeight);
      surface.AddChild(sylZone);
      fi.AttachZone(sylZone);
    }
    layer.ReorderByXPos();
    if (!(this as any).AdjustPitchFromPosition(syllable)) {
      status.import('status', 'FAILURE');
      status.import('message', 'Failed to set pitch.');
      return false;
    }
    for (const [key, value] of attributes) {
      if (key === 'tilt') {
        if (value === 's') (nc as unknown as Nc).SetTilt(COMPASSDIRECTION_s);
        else if (value === 'se') (nc as unknown as Nc).SetTilt(COMPASSDIRECTION_se);
        else if (value === 'n') (nc as unknown as Nc).SetTilt(COMPASSDIRECTION_n);
      }
      else if (key === 'contour') contour = value;
      else if (key === 'curve') {
        // C++ quirk: SetCurve only for 'a'/'c'; Liquescent child added for any 'curve' key.
        if (value === 'a') nc.SetCurve(curvatureDirection_CURVE_a);
        else if (value === 'c') nc.SetCurve(curvatureDirection_CURVE_c);
        nc.AddChild(new Liquescent());
      }
      else if (key === 'shape') {
        if (value === 'quilisma') nc.AddChild(new Quilisma());
        else if (value === 'oriscus') nc.AddChild(new Oriscus());
      }
    }
    if (contour !== '') {
      let prevNc = nc;
      let cx = ulx;
      let cy = uly;
      for (const ch of contour) {
        const newNc = new Nc() as AnyObj;
        const newZone = new Zone();
        const newUlx = cx + noteWidth;
        let newUly: number;
        const newPi = (newNc as unknown as { GetPitchInterface(): { GetPname(): number; GetOct(): number; SetPname(v: number): void; SetOct(v: number): void; AdjustPitchByOffset(v: number): void } | null }).GetPitchInterface();
        const prevPi = (prevNc as unknown as { GetPitchInterface(): { GetPname(): number; GetOct(): number } | null }).GetPitchInterface();
        if (!newPi || !prevPi) throw new Error('EditorToolkitNeume.Insert: Nc has no PitchInterface.');
        newPi.SetPname(prevPi.GetPname());
        newPi.SetOct(prevPi.GetOct());
        if (ch === 'u') { newUly = cy - noteHeight; newPi.AdjustPitchByOffset(1); }
        else if (ch === 'd') { newUly = cy + noteHeight; newPi.AdjustPitchByOffset(-1); }
        else if (ch === 's') { newUly = cy; }
        else {
          LogError('Unsupported character in contour.');
          status.import('status', 'FAILURE');
          status.import('message', 'Unsupported character in contour.');
          return false;
        }
        newUly += (newUlx - cx) * Math.tan(-(staff as AnyObj).GetDrawingRotation() * Math.PI / 180.0);
        newZone.SetUlx(newUlx - offsetX); newZone.SetUly(newUly);
        newZone.SetLrx(newUlx + offsetX); newZone.SetLry(newUly + noteHeight);
        (newNc.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void }).AttachZone(newZone);
        if (sylZone) sylZone.SetLrx(newUlx + noteWidth);
        surface.AddChild(newZone);
        neume.AddChild(newNc);
        cx = newUlx; cy = newUly; prevNc = newNc;
      }
    }
    status.import('uuid', elementType === 'nc' ? nc.GetID() : neume.GetID());
  }
  else if (elementType === 'clef') {
    const clef = new Clef() as AnyObj;
    let clefShape = CLEFSHAPE_NONE;
    const staffSize = doc.GetDrawingDoubleUnit((staff as AnyObj).GetDrawingStaffSize());
    let offsetR = 0, offsetL = 0;
    for (const [key, value] of attributes) {
      if (key === 'shape') {
        if (value === 'C') { clefShape = CLEFSHAPE_C; offsetR = Math.trunc(staffSize / NOTE_WIDTH_TO_STAFF_SIZE_RATIO / 2); offsetL = offsetR; break; }
        else if (value === 'F') { clefShape = CLEFSHAPE_F; offsetL = Math.trunc(staffSize / NOTE_WIDTH_TO_STAFF_SIZE_RATIO / 2); break; }
        else if (value === 'G') { clefShape = CLEFSHAPE_G; offsetR = Math.trunc(staffSize / NOTE_WIDTH_TO_STAFF_SIZE_RATIO); break; }
      }
    }
    if (clefShape === CLEFSHAPE_NONE) {
      LogError('A clef shape must be specified.');
      status.import('status', 'FAILURE');
      status.import('message', 'A clef shape must be specified.');
      return false;
    }
    clef.SetShape(clefShape);
    let yDiff = -((staff.GetZone() as AnyObj).GetUly() as number) + uly;
    yDiff += ((ulx - ((staff.GetZone() as AnyObj).GetUlx() as number)) as number)
      * Math.tan(-(staff as AnyObj).GetDrawingRotation() * Math.PI / 180.0);
    clef.SetLine((staff as AnyObj).GetDrawingLines() - Math.round(yDiff / staffSize));
    const czone = new Zone();
    czone.SetUlx(ulx - offsetR); czone.SetUly(uly);
    czone.SetLrx(ulx + offsetL); czone.SetLry(uly + staffSize / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
    (clef.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void }).AttachZone(czone);
    const surface = facsimile.FindDescendantByType(ClassId.SURFACE) as AnyObj;
    surface.AddChild(czone);
    layer.AddChild(clef);
    status.import('uuid', clef.GetID());
    layer.ReorderByXPos();
    doc.ScoreDefSetCurrentDoc(true);
    const ac = new ClassIdComparison(ClassId.CLEF);
    let previousClef = page.FindPreviousChild(ac, clef) as AnyObj | null;
    const nextClef = page.FindNextChild(ac, clef) as AnyObj | null;
    if (!previousClef) previousClef = (layer as AnyObj).GetCurrentClef() as AnyObj | null;
    const elements: VrvObject[] = [];
    const ic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
    page.FindAllDescendantsBetween(elements, ic, clef,
      nextClef ? (nextClef as unknown as VrvObject) : (page.GetLast() as VrvObject));
    for (const o of elements) {
      const pi = (o as AnyObj).GetPitchInterface ? (o as AnyObj).GetPitchInterface() as AnyObj | null : null;
      if (!pi) throw new Error('EditorToolkitNeume.Insert: pitched element without PitchInterface.');
      pi.AdjustPitchForNewClef(previousClef, clef);
    }
  }
  else if (elementType === 'custos') {
    const custos = new Custos() as AnyObj;
    zone.SetUlx(ulx);
    const surface = facsimile.FindDescendantByType(ClassId.SURFACE) as AnyObj;
    surface.AddChild(zone);
    (custos.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void }).AttachZone(zone);
    layer.AddChild(custos);
    const staffSize = doc.GetDrawingDoubleUnit((staff as AnyObj).GetDrawingStaffSize());
    const noteHeight = Math.trunc(staffSize / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
    const noteWidth = Math.trunc(staffSize / NOTE_WIDTH_TO_STAFF_SIZE_RATIO);
    zone.SetUlx(ulx - noteWidth * 0.25); zone.SetUly(uly);
    zone.SetLrx(ulx + noteWidth * 0.75); zone.SetLry(uly + noteHeight);
    layer.ReorderByXPos();
    if (!(this as any).AdjustPitchFromPosition(custos)) {
      LogError('Failed to set pitch.');
      status.import('status', 'FAILURE');
      status.import('message', 'Failed to set pitch.');
      return false;
    }
    status.import('uuid', custos.GetID());
  }
  else if (elementType === 'accid') {
    const accid = new Accid() as AnyObj;
    let accidTypeW = ACCIDENTAL_WRITTEN_NONE;
    for (const [key, value] of attributes) {
      if (key === 'accid') {
        if (value === 'f') { accidTypeW = ACCIDENTAL_WRITTEN_f; break; }
        else if (value === 'n') { accidTypeW = ACCIDENTAL_WRITTEN_n; }
      }
    }
    if (accidTypeW === ACCIDENTAL_WRITTEN_NONE) {
      LogError('A accid type must be specified.');
      status.import('status', 'FAILURE');
      status.import('message', 'A accid type must be specified.');
      return false;
    }
    accid.SetAccid(accidTypeW);
    zone.SetUlx(ulx);
    const surface = facsimile.FindDescendantByType(ClassId.SURFACE) as AnyObj;
    surface.AddChild(zone);
    (accid.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void }).AttachZone(zone);
    layer.AddChild(accid);
    const staffSize = doc.GetDrawingDoubleUnit((staff as AnyObj).GetDrawingStaffSize());
    const noteHeight = Math.trunc(staffSize / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
    const noteWidth = Math.trunc(staffSize / NOTE_WIDTH_TO_STAFF_SIZE_RATIO);
    const offsetX = Math.trunc(noteWidth / 2);
    const nx = ulx - noteWidth / 2;
    const ny = uly - noteHeight / 2;
    zone.SetUlx(nx + offsetX); zone.SetUly(ny);
    zone.SetLrx(nx + noteWidth + offsetX); zone.SetLry(ny + noteHeight);
    layer.ReorderByXPos();
    status.import('uuid', accid.GetID());
  }
  else if (elementType === 'divLine') {
    const divLine = new DivLine() as AnyObj;
    let divLineTypeW = divLineLog_FORM_NONE;
    for (const [key, value] of attributes) {
      if (key === 'form') {
        if (value === 'maxima') { divLineTypeW = divLineLog_FORM_maxima; break; }
        else if (value === 'maior') { divLineTypeW = divLineLog_FORM_maior; break; }
        else if (value === 'minima') { divLineTypeW = divLineLog_FORM_minima; break; }
        else if (value === 'finalis') { divLineTypeW = divLineLog_FORM_finalis; break; }
        else if (value === 'caesura') { divLineTypeW = divLineLog_FORM_caesura; break; }
        else if (value === 'virgula') { divLineTypeW = divLineLog_FORM_virgula; break; }
      }
    }
    if (divLineTypeW === divLineLog_FORM_NONE) {
      LogError('A divLine type must be specified.');
      status.import('status', 'FAILURE');
      status.import('message', 'A divLine type must be specified.');
      return false;
    }
    divLine.SetForm(divLineTypeW);
    zone.SetUlx(ulx);
    const surface = facsimile.FindDescendantByType(ClassId.SURFACE) as AnyObj;
    surface.AddChild(zone);
    (divLine.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void }).AttachZone(zone);
    layer.AddChild(divLine);
    const staffSize = doc.GetDrawingDoubleUnit((staff as AnyObj).GetDrawingStaffSize());
    const noteHeight = Math.trunc(staffSize / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
    const noteWidth = Math.trunc(staffSize / NOTE_WIDTH_TO_STAFF_SIZE_RATIO);
    const offsetX = Math.trunc(noteWidth / 2);
    const nx = ulx - noteWidth / 2;
    const ny = uly - noteHeight / 2;
    zone.SetUlx(nx + offsetX); zone.SetUly(ny);
    zone.SetLrx(nx + noteWidth + offsetX); zone.SetLry(ny + noteHeight);
    layer.ReorderByXPos();
    status.import('uuid', divLine.GetID());
  }
  else {
    LogError(`Unsupported type '${elementType}' for insertion`);
    status.import('status', 'FAILURE');
    status.import('message', `Unsupported type '${elementType}' for insertion.`);
    return false;
  }
  layer.ReorderByXPos();
  if (doc.IsTranscription() && doc.HasFacsimile()) doc.SyncFromFacsimileDoc();
  (doc.GetDrawingPage() as AnyObj)?.LayOutTranscription(true);
  status.import('status', statusStr);
  status.import('message', message);
  return true;
}
  public InsertToSyllable(elementId: string) {
  const self = this as AnyObj;
  const docOf = (self as unknown as { m_doc: AnyObj }).m_doc;
  const status = (self as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get drawing page');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get drawing page.');
    return false;
  }
  if (!docOf.HasFacsimile()) {
    LogError('Drawing page without facsimile');
    status.import('status', 'FAILURE');
    status.import('message', 'Drawing page without facsimile is unsupported.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const element = page.FindDescendantByID(elementId) as AnyObj | null;
  LogWarning('element found: %s', String(element !== null));
  if (!element) {
    LogError("No element exists with ID '%s'.");
    status.import('status', 'FAILURE');
    status.import('message', 'No element exists with ID' + elementId + '.');
    return false;
  }
  const parent = element.GetParent() as AnyObj | null;
  if (!parent) throw new Error('EditorToolkitNeume.InsertToSyllable: element has no parent.');
  if (!(element.Is(ClassId.DIVLINE) || element.Is(ClassId.ACCID) || element.Is(ClassId.CLEF))) {
    LogError('Element is of type %s, but only Divlines and Accids can be inserted into syllables.');
    status.import('status', 'FAILURE');
    status.import('message',
      'Element is of type ' + element.GetClassName()
        + ', but only DivLines, Accids, and Clefs can be inserted into syllables.');
    return false;
  }
  if (!parent.Is(ClassId.LAYER)) {
    LogError('The selected %s is not a child of layer.');
    status.import('status', 'FAILURE');
    status.import('message', 'The selected ' + element.GetClassName() + 'is not a child of layer.');
    return false;
  }
  const fi = element.GetFacsimileInterface() as unknown as { HasFacs(): boolean } | null;
  if (!fi || !fi.HasFacs()) {
    LogError("Selected '%s' without facsimile");
    status.import('status', 'FAILURE');
    status.import('message', "Selected '" + element.GetClassName() + "' without facsimile is unsupported.");
    return false;
  }
  const zone = getZoneAny(element);
  if (!zone) throw new Error('EditorToolkitNeume.InsertToSyllable: zone missing.');
  const staff = element.GetFirstAncestor(ClassId.STAFF) as AnyObj | null;
  if (!staff) throw new Error('EditorToolkitNeume.InsertToSyllable: staff ancestor required.');
  const neumes = staff.FindAllDescendantsByType(ClassId.NEUME);
  if (neumes.length === 0) {
    LogError("A syllable must exist in the staff to insert a '%s' into.");
    status.import('status', 'FAILURE');
    status.import('message', "A syllable must exist in the staff to insert a '" + element.GetClassName() + "' into.");
    return false;
  }
  const cmp = new ClosestNeume();
  cmp.x = zone.GetUlx(); cmp.y = zone.GetUly();
  const sorted = [...neumes].sort((a, b) => (cmp.compare(a, b) ? -1 : 1));
  const neume = sorted[0] as AnyObj;
  const syllable = neume.GetParent() as AnyObj;
  if (!syllable) throw new Error('EditorToolkitNeume.InsertToSyllable: neume has no parent.');
  const cc = new ClassIdComparison(ClassId.CLEF);
  const sc = new ClassIdComparison(ClassId.SYLLABLE);
  const nextSyllable = page.FindNextChild(sc, syllable) as AnyObj | null;
  const clefBefore = (nextSyllable ? page.FindPreviousChild(cc, nextSyllable) : null) as AnyObj | null;
  element.MoveItselfTo(syllable);
  syllable.ReorderByXPos();
  parent.ClearRelinquishedChildren();
  parent.ReorderByXPos();
  if (element.Is(ClassId.CLEF)) {
    const layer = element.GetFirstAncestor(ClassId.LAYER) as AnyObj | null;
    if (!layer) throw new Error('EditorToolkitNeume.InsertToSyllable: clef has no layer.');
    const nextClef = page.FindNextChild(cc, element) as AnyObj | null;
    const endElement = (nextClef && nextClef.GetParent() === (syllable as unknown as VrvObject))
      ? nextClef
      : ((nextSyllable ?? page.GetLast()) as AnyObj);
    const targeted = pitchedBetween(page, element, endElement);
    const preceding = (page.FindPreviousChild(cc, element) as AnyObj | null) ?? currentClefOf(layer);
    adjustRange(page, preceding, element, targeted);
    if (nextSyllable) {
      const clefAfter = page.FindPreviousChild(cc, nextSyllable) as AnyObj | null;
      if (clefBefore !== clefAfter && clefAfter) {
        const followingClef = page.FindNextChild(cc, clefAfter) as AnyObj | null;
        const end2 = (followingClef ?? page.GetLast()) as AnyObj;
        const out: VrvObject[] = [];
        page.FindAllDescendantsBetween(out, new InterfaceComparison(InterfaceId.INTERFACE_PITCH), nextSyllable, end2);
        adjustRange(page, clefBefore, clefAfter, out);
      }
    }
  }
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public MatchHeight(elementId: string) {
  const self = this as AnyObj;
  const docOf = (self as unknown as { m_doc: AnyObj }).m_doc;
  const status = (self as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get drawing page');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get drawing page.');
    return false;
  }
  if (!docOf.HasFacsimile()) {
    LogError('Drawing page without facsimile');
    status.import('status', 'FAILURE');
    status.import('message', 'Drawing page without facsimile is unsupported.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const element = page.FindDescendantByID(elementId) as AnyObj | null;
  const staffParent = element ? (element.GetFirstAncestor(ClassId.STAFF) as AnyObj | null) : null;
  if (!element) {
    LogError("No element exists with ID '%s'.", elementId);
    status.import('status', 'FAILURE');
    status.import('message', 'No element exists with ID' + elementId + '.');
    return false;
  }
  if (!element.Is(ClassId.SYL)) {
    LogError('Element is of type %s, but only <syl> element can match height.', element.GetClassName());
    status.import('status', 'FAILURE');
    status.import('message',
      'Element is of type ' + element.GetClassName() + ', but only <syl> element can match height.');
    return false;
  }
  const fi = element.GetFacsimileInterface() as unknown as { HasFacs(): boolean } | null;
  if (!fi || !fi.HasFacs()) {
    LogError("Selected '%s' without facsimile", element.GetClassName());
    status.import('status', 'FAILURE');
    status.import('message', "Selected '" + element.GetClassName() + "' without facsimile is unsupported.");
    return false;
  }
  const srcZone = getZoneAny(element);
  if (!srcZone) throw new Error('EditorToolkitNeume.MatchHeight: zone missing.');
  const ulx = srcZone.GetUlx() as number;
  const uly = srcZone.GetUly() as number;
  const height = (srcZone.GetLry() as number) - uly;
  if (!staffParent) throw new Error('EditorToolkitNeume.MatchHeight: staff ancestor required.');
  const syls: VrvObject[] = [];
  staffParent.FindAllDescendantsByComparison(syls, new ClassIdComparison(ClassId.SYL));
  // C++ keeps the commented-out x-axis block out of the build; only Y matching applies.
  const theta = (staffParent.GetDrawingRotation ? staffParent.GetDrawingRotation() : 0) as number;
  for (const sObj of syls) {
    const zone = getZoneAny(sObj as AnyObj);
    if (!zone) throw new Error('EditorToolkitNeume.MatchHeight: syl zone missing.');
    let offsetY = 0;
    const itUlx = zone.GetUlx() as number;
    if (theta) {
      const factor = 1.3;
      offsetY = Math.trunc((itUlx - ulx) * Math.tan(theta * Math.PI / 180.0) / factor);
    }
    zone.SetUly(uly + offsetY);
    zone.SetLry(uly + offsetY + height);
  }
  if (docOf.IsTranscription() && docOf.HasFacsimile()) docOf.SyncFromFacsimileDoc();
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public Merge(elementIds: string[]) {
  const self = this as AnyObj;
  const docOf = (self as unknown as { m_doc: AnyObj }).m_doc;
  const status = (self as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) return false;
  const page = docOf.GetDrawingPage() as AnyObj;
  const staves: AnyObj[] = [];
  for (const id of elementIds) {
    const obj = page.FindDescendantByID(id) as AnyObj | null;
    if (obj && obj.Is(ClassId.STAFF)) {
      staves.push(obj);
    } else {
      LogError("Staff with ID '%s' does not exist!", id);
      status.import('status', 'FAILURE');
      status.import('message', "Staff with ID '" + id + "' does not exist.");
      return false;
    }
  }
  if (staves.length < 2) {
    LogError('At least two staves must be provided.');
    status.import('status', 'FAILURE');
    status.import('message', 'At least two staves must be provided.');
    return false;
  }
  const zoneOf = (s: AnyObj): AnyObj => {
    const z = getZoneAny(s);
    if (!z) throw new Error('EditorToolkitNeume.Merge: staff zone missing.');
    return z;
  };
  const minBy = (fn: (s: AnyObj) => number): number =>
    Math.min(...staves.map((s) => fn(s)));
  const maxBy = (fn: (s: AnyObj) => number): number =>
    Math.max(...staves.map((s) => fn(s)));
  const ulx = minBy((s) => zoneOf(s).GetUlx() as number);
  const uly = minBy((s) => zoneOf(s).GetUly() as number);
  const lrx = maxBy((s) => zoneOf(s).GetLrx() as number);
  const lry = maxBy((s) => zoneOf(s).GetLry() as number);
  const fillStaff = staves[0];
  const fillLayer = fillStaff.GetFirst(ClassId.LAYER) as AnyObj | null;
  if (!fillLayer) throw new Error('EditorToolkitNeume.Merge: fill staff has no LAYER.');
  for (let i = 1; i < staves.length; i++) {
    const sourceStaff = staves[i];
    const sourceLayer = sourceStaff.GetFirst(ClassId.LAYER) as AnyObj | null;
    if (!sourceLayer) throw new Error('EditorToolkitNeume.Merge: source staff has no LAYER.');
    fillLayer.MoveChildrenFrom(sourceLayer);
    // C++ Relinquish leaves stale pointers in the source array; the source
    // system is deleted right after, but clear explicitly so the tree stays
    // consistent and the emptiness assert below is meaningful (C++ asserts
    // GetChildCount() == 0, compiled out in release builds).
    sourceLayer.ClearRelinquishedChildren();
    if (sourceLayer.GetChildCount(ClassId.UNSPECIFIED) !== 0) {
      throw new Error('EditorToolkitNeume.Merge: source layer not empty after move.');
    }
    const system = sourceStaff.GetFirstAncestor(ClassId.SYSTEM) as AnyObj | null;
    if (!system) throw new Error('EditorToolkitNeume.Merge: source staff has no SYSTEM ancestor.');
    if (system.FindDescendantByType(ClassId.SECTION)) {
      const section = system.FindDescendantByType(ClassId.SECTION) as unknown as VrvObject;
      const nextSystem = page.GetNextOf(system, ClassId.SYSTEM) as AnyObj | null;
      if (nextSystem) {
        system.DetachChild(section.GetIdx());
        nextSystem.InsertChild(section, 0);
      }
    }
    if (system.FindDescendantByType(ClassId.PB)) {
      const pb = system.FindDescendantByType(ClassId.PB) as unknown as VrvObject;
      const nextSystem = page.GetNextOf(system, ClassId.SYSTEM) as AnyObj | null;
      if (nextSystem) {
        system.DetachChild(pb.GetIdx());
        nextSystem.InsertChild(pb, 1);
      }
    }
    if (system.FindDescendantByType(ClassId.SYSTEM_MILESTONE_END)) {
      const milestoneEnd = system.FindDescendantByType(ClassId.SYSTEM_MILESTONE_END) as unknown as VrvObject;
      const previousSystem = page.GetPrevious(system, ClassId.SYSTEM) as AnyObj | null;
      if (previousSystem) {
        system.DetachChild(milestoneEnd.GetIdx());
        previousSystem.InsertChild(milestoneEnd, previousSystem.GetChildCount(ClassId.UNSPECIFIED));
      }
    }
    page.DeleteChild(system);
  }
  const staffZone = zoneOf(fillStaff);
  staffZone.SetUlx(ulx);
  staffZone.SetUly(uly);
  staffZone.SetLrx(lrx);
  staffZone.SetLry(lry);
  staffZone.SetRotate(0);
  fillLayer.ReorderByXPos();
  if (docOf.IsTranscription() && docOf.HasFacsimile()) docOf.SyncFromFacsimileDoc();
  status.import('uuid', fillStaff.GetID());
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public MoveOutsideSyllable(elementId: string) {
  const self = this as AnyObj;
  const docOf = (self as unknown as { m_doc: AnyObj }).m_doc;
  const status = (self as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get drawing page');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get drawing page.');
    return false;
  }
  if (!docOf.HasFacsimile()) {
    LogError('Drawing page without facsimile');
    status.import('status', 'FAILURE');
    status.import('message', 'Drawing page without facsimile is unsupported.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const element = page.FindDescendantByID(elementId) as AnyObj | null;
  LogWarning('element found: %s', String(element !== null));
  if (!element) {
    LogError("No element exists with ID '%s'.");
    status.import('status', 'FAILURE');
    status.import('message', 'No element exists with ID' + elementId + '.');
    return false;
  }
  const parent = element.GetParent() as AnyObj | null;
  if (!parent) throw new Error('EditorToolkitNeume.MoveOutsideSyllable: element has no parent.');
  if (!(element.Is(ClassId.DIVLINE) || element.Is(ClassId.ACCID) || element.Is(ClassId.CLEF))) {
    LogError('Element is of type %s, but only Divlines, Accids, and Clefs can be moved out of syllables.');
    status.import('status', 'FAILURE');
    status.import('message',
      'Element is of type ' + element.GetClassName()
        + ', but only DivLines and Accids can be inserted into syllables.');
    return false;
  }
  if (!parent.Is(ClassId.SYLLABLE)) {
    LogError('The selected %s is not a child of syllable.');
    status.import('status', 'FAILURE');
    status.import('message', 'The selected ' + element.GetClassName() + 'is not a child of syllable.');
    return false;
  }
  const secondParent = parent.GetParent() as AnyObj | null;
  if (!secondParent) throw new Error('EditorToolkitNeume.MoveOutsideSyllable: syllable has no parent.');
  const firstNeume = parent.GetFirst(ClassId.NEUME) as AnyObj | null;
  if (!firstNeume) throw new Error('EditorToolkitNeume.MoveOutsideSyllable: syllable has no NEUME.');
  const fNc = firstNeume.GetFirst(ClassId.NC) as AnyObj;
  const lNc = (parent.GetChildCount(ClassId.NEUME) === 1
    ? firstNeume.GetLast()
    : (parent.GetLast(ClassId.NEUME) as AnyObj).GetLast()) as AnyObj;
  const xLeft = getZoneAny(fNc)!.GetUlx() as number;
  const xRight = getZoneAny(lNc)!.GetLrx() as number;
  const xElement = getZoneAny(element)!.GetLrx() as number;
  if (element.Is(ClassId.CLEF)) {
    if (xElement < xLeft) {
      (self.ClefMovementHandler as (c: unknown, x: number, y: number) => void)(element, xLeft - xElement, 0);
    } else if (xRight < xElement) {
      getZoneAny(element)!.ShiftByXY(xRight - xElement + 1, 0);
    }
    const syllable = parent;
    const layer = element.GetFirstAncestor(ClassId.LAYER) as AnyObj | null;
    if (!layer) throw new Error('EditorToolkitNeume.MoveOutsideSyllable: clef has no layer.');
    const cc = new ClassIdComparison(ClassId.CLEF);
    const ic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
    const sc = new ClassIdComparison(ClassId.SYLLABLE);
    const nextSyllable = page.FindNextChild(sc, syllable) as AnyObj | null;
    const nextClef = page.FindNextChild(cc, element) as AnyObj | null;
    const endElement = (nextClef && nextClef.GetParent() === (syllable as unknown as VrvObject))
      ? nextClef
      : ((nextSyllable ?? page.GetLast()) as AnyObj);
    const targeted: VrvObject[] = [];
    page.FindAllDescendantsBetween(targeted, ic, element, endElement);
    const preceding = (page.FindPreviousChild(cc, element) as AnyObj | null) ?? currentClefOf(layer);
    void ic;
    // C++ restores pitches: AdjustPitchForNewClef(clef, precedingClef) — reversed arg order.
    for (const o of targeted) {
      const pi = (o as AnyObj).GetPitchInterface ? (o as AnyObj).GetPitchInterface() as AnyObj | null : null;
      if (!pi) throw new Error('EditorToolkitNeume.MoveOutsideSyllable: pitched element without PitchInterface.');
      pi.AdjustPitchForNewClef(element, preceding);
    }
  }
  element.MoveItselfTo(secondParent);
  secondParent.ReorderByXPos();
  parent.ClearRelinquishedChildren();
  parent.ReorderByXPos();
  if (element.Is(ClassId.CLEF)) {
    if (xElement < xLeft) {
      (self.ClefMovementHandler as (c: unknown, x: number, y: number) => void)(element, xElement - xLeft, 0);
    } else if (xRight < xElement) {
      (self.ClefMovementHandler as (c: unknown, x: number, y: number) => void)(element, xElement - xRight - 1, 0);
    }
  }
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public Set(elementId: string, attrType: string, attrValue: string) {
  const self = this as AnyObj;
  const docOf = (self as unknown as { m_doc: AnyObj }).m_doc;
  const status = (self as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) return false;
  const page = docOf.GetDrawingPage() as AnyObj;
  const element = page.FindDescendantByID(elementId) as AnyObj | null;
  let success = false;
  // C++ tries exactly these 13 modules in this order (later modules with
  // other Set* names exist in AttModule but are not consulted by Set).
  // C++ elements inherit Att's StrTo* converters via multiple inheritance;
  // TS composes attribute state so the bare element lacks them. Fall back to
  // a shared Att converter instance for any missing StrTo*/DblToStr/IntToStr
  // method (ponytail: reconcile AttModule.Set* with the shared libMEI
  // converter layer instead of per-call fallback when attmodule is touched).
  const sharedAtt = new Att();
  const asAtt = new Proxy(element as unknown as Record<string, unknown>, {
    get: (t, p, r) => {
      const v = Reflect.get(t, p, r);
      if (typeof v === 'function') return (v as (...a: never[]) => unknown).bind(t);
      if (v !== undefined) return v;
      const c = (sharedAtt as unknown as Record<string, unknown>)[p as string];
      return typeof c === 'function' ? (c as (...a: never[]) => unknown).bind(sharedAtt) : c;
    },
    // AttModule only reads methods off the element; no set trap needed.
  }) as unknown as Parameters<typeof AttModule.SetAnalytical>[0];
  if (AttModule.SetAnalytical(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetCmn(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetCmnornaments(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetCritapp(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetExternalsymbols(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetGestural(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetMei(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetMensural(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetMidi(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetNeumes(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetPagebased(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetShared(asAtt, attrType, attrValue)) success = true;
  else if (AttModule.SetVisual(asAtt, attrType, attrValue)) success = true;
  if (typeof page.LayOutTranscription === 'function') page.LayOutTranscription(true);
  status.import('status', success ? 'OK' : 'FAILURE');
  status.import('message', success ? '' : "Could not set attribute '" + attrType + "' to '" + attrValue + "'.");
  return success;
}
  public SetText(elementId: string, text: string) {
  const self = this as AnyObj;
  const docOf = (self as unknown as { m_doc: AnyObj }).m_doc;
  const status = (self as unknown as { m_editStatus: AnyObj }).m_editStatus;
  let msgStatus = 'OK';
  let message = '';
  const wtext = UTF8to32(text);
  if (!docOf.GetDrawingPage()) {
    status.import('status', 'FAILURE');
    status.import('message', 'Could not find drawing page.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const element = page.FindDescendantByID(elementId) as AnyObj | null;
  if (!element) {
    LogWarning("No element with ID '%s' exists", elementId);
    status.import('status', 'FAILURE');
    status.import('message', "No element with ID '" + elementId + "' exists.");
    return false;
  }
  let success = false;
  if (element.Is(ClassId.SYL)) {
    const syl = element as unknown as Syl;
    if (!syl) throw new Error('EditorToolkitNeume.SetText: syl cast failed.');
    let child = syl.GetFirst() as AnyObj | null;
    if (!child) {
      const t = new Text();
      syl.AddChild(t as unknown as VrvObject);
      t.SetText(wtext);
      success = true;
    } else {
      while (child) {
        if (child.Is(ClassId.TEXT)) {
          (child as unknown as Text).SetText(wtext);
          success = true;
          break;
        } else if (child.Is(ClassId.REND)) {
          // C++ dereferences rendChild without a null check (rend always has
          // a TEXT child in practice); preserve the direct access.
          const rendChild = (child as unknown as { GetFirst(): AnyObj | null }).GetFirst() as AnyObj;
          if (rendChild.Is(ClassId.TEXT)) {
            (rendChild as unknown as Text).SetText(wtext);
            success = true;
          }
        }
        // TS GetNext() is the C++ Object::GetNext() iterator step.
        child = syl.GetNext() as AnyObj | null;
      }
    }
  } else if (element.Is(ClassId.SYLLABLE)) {
    const syllable = element as unknown as Syllable;
    if (!syllable) throw new Error('EditorToolkitNeume.SetText: syllable cast failed.');
    let syl = syllable.GetFirst(ClassId.SYL) as unknown as Syl | null;
    if (!syl) {
      syl = new Syl();
      const t = new Text();
      t.SetText([]);
      syl.AddChild(t as unknown as VrvObject);
      syllable.AddChild(syl as unknown as VrvObject);
      if (docOf.HasFacsimile()) {
        const zone = new Zone();
        const ulx = { value: 0 };
        const uly = { value: 0 };
        const lrx = { value: 0 };
        const lry = { value: 0 };
        if ((syllable as unknown as {
          GenerateZoneBounds(a: { value: number }, b: { value: number }, c: { value: number }, d: { value: number }): boolean;
        }).GenerateZoneBounds(ulx, uly, lrx, lry)) {
          // C++ keeps offSetUlx commented out; only Uly/Lrx/Lry offsets apply.
          const offSetUly = 50;
          const offSetLrx = 50;
          const offSetLry = 150;
          zone.SetUlx(ulx.value);
          zone.SetUly(uly.value + offSetUly);
          zone.SetLrx(lrx.value + offSetLrx);
          zone.SetLry(lry.value + offSetLry);
          const surface = docOf.GetFacsimile().FindDescendantByType(ClassId.SURFACE) as unknown as Surface;
          surface.AddChild(zone as unknown as VrvObject);
          (syl as unknown as { AttachZone(z: Zone): void }).AttachZone(zone);
        } else {
          LogWarning('Could not create bounding box for syl.');
          message += 'Could not create bounding box for syl. ';
          msgStatus = 'WARNING';
          // C++ `delete zone`; GC handles it here (zone never attached).
        }
        if (!(syl as unknown as { HasFacs(): boolean }).HasFacs()) {
          throw new Error('EditorToolkitNeume.SetText: new syl has no facs.');
        }
      }
      success = true;
    } else {
      success = (self.SetText as (id: string, t: string) => boolean).call(self, syl.GetID(), text);
    }
  } else {
    LogError("Element type '%s' is unsupported for SetText", element.GetClassName());
    status.import('status', 'FAILURE');
    status.import('message', "Element type '" + element.GetClassName() + "' is unsupported for SetText.");
    return false;
  }
  if (docOf.IsTranscription() && docOf.HasFacsimile()) docOf.SyncFromFacsimileDoc();
  status.import('status', success ? msgStatus : 'FAILURE');
  status.import('message', success ? message : 'SetText method failed.');
  return success;
}
  public SetClef(elementId: string, shape: string) {
  const docOf = (this as unknown as { m_doc: AnyObj }).m_doc;
  const status = (this as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const objects: VrvObject[] = [];
  let success = false;
  let clefShape = CLEFSHAPE_NONE;
  let shift = 0;
  const clef = page.FindDescendantByID(elementId) as AnyObj | null;
  if (!clef) throw new Error('EditorToolkitNeume.SetClef: clef cast failed.');
  if (shape === 'C') {
    clefShape = CLEFSHAPE_C;
    shift = 4;
  } else if (shape === 'F') {
    clefShape = CLEFSHAPE_F;
    shift = -4;
  }
  if (clef.GetShape() !== clefShape) {
    success = AttModule.SetShared(asAttElement(clef), 'shape', shape);
    if (!success) {
      LogError('Unable to set clef shape');
      status.import('status', 'FAILURE');
      status.import('message', 'Unable to set clef shape.');
      return false;
    }
    const layer = clef.GetFirstAncestor(ClassId.LAYER) as AnyObj | null;
    if (!layer) throw new Error('EditorToolkitNeume.SetClef: layer ancestor required.');
    // C++ GetNext(child, classId) is sibling-next; TS GetNextOf is the equivalent.
    // C++ asserts nextClef yet still falls back to GetLast() when null — keep the fallback.
    const nextClef = (typeof page.GetNext === 'function'
      ? (page.GetNext as (c: VrvObject, id: number) => VrvObject | null).call(page, clef, ClassId.CLEF)
      : page.GetNextOf(clef, ClassId.CLEF)) as AnyObj | null;
    const ic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
    const endBound = (nextClef ?? page.GetLast()) as VrvObject;
    if (!endBound) throw new Error('EditorToolkitNeume.SetClef: end bound required.');
    page.FindAllDescendantsBetween(objects, ic, clef, endBound);
    for (const obj of objects) {
      const child = obj as AnyObj | null;
      if (!child) continue;
      const childClef = (layer.GetClef as (t: unknown) => unknown).call(layer, child);
      if (childClef !== (clef as unknown)) continue;
      const pi = (child.GetPitchInterface as () => { AdjustPitchByOffset(n: number): void } | null).call(child);
      if (!pi) throw new Error('EditorToolkitNeume.SetClef: pitch interface required.');
      pi.AdjustPitchByOffset(shift);
    }
  }
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public SetLiquescent(elementId: string, curve: string) {
  const docOf = (this as unknown as { m_doc: AnyObj }).m_doc;
  const status = (this as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const nc = page.FindDescendantByID(elementId) as AnyObj | null;
  if (!nc) throw new Error('EditorToolkitNeume.SetLiquescent: nc cast failed.');
  const hasLiquescent = nc.GetChildCount(ClassId.LIQUESCENT) > 0;
  if (curve === 'a') {
    (nc.SetCurve as (v: number) => void).call(nc, CURVE_a);
    if (!hasLiquescent) {
      const liquescent = new Liquescent();
      nc.AddChild(liquescent as unknown as VrvObject);
    }
  } else if (curve === 'c') {
    (nc.SetCurve as (v: number) => void).call(nc, CURVE_c);
    if (!hasLiquescent) {
      const liquescent = new Liquescent();
      nc.AddChild(liquescent as unknown as VrvObject);
    }
  } else {
    // Unset curve.
    (nc.SetCurve as (v: number) => void).call(nc, CURVE_NONE);
    if (hasLiquescent) {
      const liquescent = nc.FindDescendantByType(ClassId.LIQUESCENT);
      if (!liquescent) throw new Error('EditorToolkitNeume.SetLiquescent: liquescent required.');
      nc.DeleteChild(liquescent);
    }
  }
  if (typeof page.LayOutTranscription === 'function') page.LayOutTranscription(true);
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public SetAquitanianElement(elementId: string, shape: string) {
  const docOf = (this as unknown as { m_doc: AnyObj }).m_doc;
  const status = (this as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  const nc = page.FindDescendantByID(elementId) as AnyObj | null;
  if (!nc) throw new Error('EditorToolkitNeume.SetAquitanianElement: nc cast failed.');
  const hasQuilisma = nc.GetChildCount(ClassId.QUILISMA) > 0;
  const hasOriscus = nc.GetChildCount(ClassId.ORISCUS) > 0;
  if (shape === 'quilisma') {
    if (!hasQuilisma && !hasOriscus) {
      const quilisma = new Quilisma();
      nc.AddChild(quilisma as unknown as VrvObject);
    }
  } else if (shape === 'oriscus') {
    if (!hasQuilisma && !hasOriscus) {
      const oriscus = new Oriscus();
      nc.AddChild(oriscus as unknown as VrvObject);
    }
  } else {
    // Unset: C++ deletes the first child (whatever it is) when either is present.
    if (hasQuilisma || hasOriscus) {
      nc.DeleteChild(nc.GetFirst() as VrvObject);
    }
  }
  if (typeof page.LayOutTranscription === 'function') page.LayOutTranscription(true);
  status.import('status', 'OK');
  status.import('message', '');
  return true;
}
  public SortStaves(this: unknown) {
  const docOf = (this as unknown as { m_doc: AnyObj }).m_doc;
  const status = (this as unknown as { m_editStatus: AnyObj }).m_editStatus;
  if (!docOf.GetDrawingPage()) {
    LogError('Could not get drawing page.');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get drawing page.');
    return false;
  }
  const page = docOf.GetDrawingPage() as AnyObj;
  if (page.GetChildCount(ClassId.SYSTEM) <= 1) return true;
  // C++ Object::StableSort<StaffSort> over direct children. TS VrvObject has
  // no StableSort port, so apply the same comparator through the public
  // child accessors (ponytail: port StableSort into object.ts when it lands).
  const sorter = new StaffSort();
  const kids: VrvObject[] = [];
  for (let i = 0; ; ++i) {
    const k = page.GetChild(i) as VrvObject | null;
    if (!k) break;
    kids.push(k);
  }
  const decorated = kids.map((k, i) => ({ k, i }));
  decorated.sort((x, y) => {
    if (sorter.compare(x.k, y.k)) return -1;
    if (sorter.compare(y.k, x.k)) return 1;
    return x.i - y.i;
  });
  for (const { k } of decorated) {
    page.DeleteChild(k);
    page.AddChild(k);
  }
  const pb = page.FindDescendantByType(ClassId.PB) as AnyObj | null;
  const milestoneEnd = page.FindDescendantByType(ClassId.SYSTEM_MILESTONE_END) as AnyObj | null;
  const section = page.FindDescendantByType(ClassId.SECTION) as AnyObj | null;
  if (!pb || !milestoneEnd || !section) {
    throw new Error('EditorToolkitNeume.SortStaves: pb/milestoneEnd/section required.');
  }
  const pbParent = pb.GetParent() as unknown as AnyObj;
  const milestoneEndParent = milestoneEnd.GetParent() as unknown as AnyObj;
  const sectionParent = section.GetParent() as unknown as AnyObj;
  const pbDetached = pbParent.DetachChild(pb.GetIdx()) as AnyObj;
  const endDetached = milestoneEndParent.DetachChild(milestoneEnd.GetIdx()) as AnyObj;
  const sectionDetached = sectionParent.DetachChild(section.GetIdx()) as AnyObj;
  const firstSystem = page.GetFirst(ClassId.SYSTEM) as unknown as AnyObj;
  const lastSystem = page.GetLast(ClassId.SYSTEM) as unknown as AnyObj;
  if (!firstSystem || !lastSystem) {
    throw new Error('EditorToolkitNeume.SortStaves: first/last system required.');
  }
  firstSystem.InsertChild(sectionDetached, 0);
  firstSystem.InsertChild(pbDetached, 1);
  lastSystem.InsertChild(endDetached, lastSystem.GetChildCount(ClassId.UNSPECIFIED));
  return true;
}
  public Split(elementId: string, x: number) {
  const self = this as unknown as {
    m_doc: AnyObj; m_editStatus: AnyObj;
    Insert(a: string, b: string, ulx: number, uly: number, lrx: number, lry: number, attrs: string[][]): boolean;
  };
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const found = page.FindDescendantByID(elementId) as unknown as VrvObject | null;
  // C++ dynamic_cast<Staff*> null-check doubles as the missing-id guard.
  if (!found || !found.Is(ClassId.STAFF)) {
    LogError("Either no element exists with ID '%s' or it is not a staff.", elementId);
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import(
      'message', `Either no element exists with ID '${elementId}' or it is not a staff.`);
    return false;
  }
  const staff = found as AnyObj;
  const zone = staff.GetZone() as AnyObj;
  if (zone.GetUlx() > x || zone.GetLrx() < x) {
    LogError("The 'x' parameter is not within the bounds of the original staff.");
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', "The 'x' parameter is not within bounds of the original staff.");
    return false;
  }
  // Resize current staff, insert a new one filling the remaining area.
  const theta = staff.GetDrawingRotation() as number;
  const newUlx = x;
  const newLrx = zone.GetLrx() as number;
  const newUly = Math.trunc(zone.GetUly() - (x - zone.GetUlx()) * Math.tan((theta * Math.PI) / 180.0));
  const newLry = zone.GetLry() as number;
  // C++ passes an empty attr vector; Insert reads shape/form from params only.
  if (!self.Insert('staff', 'auto', newUlx, newUly, newLrx, newLry, [])) {
    LogError('Failed to create a second staff.');
    self.m_editStatus.reset();
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Failed to create a second staff.');
    return false;
  }
  const splitStaff = page.FindDescendantByID(
    String(self.m_editStatus.getValue('uuid'))) as unknown as AnyObj | null;
  if (!splitStaff) {
    // C++ asserts non-null then null-checks (unreachable in practice); the
    // null branch resets the status before FAILURE. TS keeps the explicit throw first.
    LogError('Split staff is null');
    self.m_editStatus.reset();
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Split staff is null.');
    return false;
  }
  (splitStaff.GetZone() as AnyObj).SetRotate(theta);
  zone.SetLrx(x);
  if (theta) {
    zone.SetLry(zone.GetLry() + (newLrx - x) * Math.tan((theta * Math.PI) / 180.0));
  }
  const layer = staff.GetFirst(ClassId.LAYER) as unknown as AnyObj;
  const splitLayer = splitStaff.GetFirst(ClassId.LAYER) as unknown as AnyObj;

  // Move elements right of x onto the second staff. C++ iterates by pointer
  // with GetNext() while moving; MoveItselfTo re-parents but the TS GetNext
  // sibling scan tolerates removal (index-based), so preserve source order: snapshot first.
  const kids: AnyObj[] = [];
  for (let child = layer.GetFirst() as unknown as AnyObj | null; child; child = layer.GetNext() as unknown as AnyObj | null) {
    kids.push(child);
  }
  for (const child of kids) {
    let fi = child.GetFacsimileInterface() as unknown as AnyObj | null;
    if (!fi || !fi.HasFacs()) {
      fi = null;
      const facsimileInterfaces: VrvObject[] = [];
      const ic = new InterfaceComparison(InterfaceId.INTERFACE_FACSIMILE);
      (child as unknown as VrvObject).FindAllDescendantsByComparison(facsimileInterfaces, ic);
      for (const candidate of facsimileInterfaces) {
        const temp = (candidate as unknown as AnyObj).GetFacsimileInterface() as unknown as AnyObj;
        if (!temp) throw new Error('EditorToolkitNeume.Split: facsimile interface required.');
        if (temp.HasFacs() && (!fi || (temp.GetZone() as AnyObj).GetUlx() < (fi.GetZone() as AnyObj).GetUlx())) {
          fi = temp;
        }
      }
    }
    if (!fi) continue;
    if ((fi.GetZone() as AnyObj).GetUlx() > x) {
      (child as unknown as VrvObject).MoveItselfTo(splitLayer as unknown as VrvObject);
    }
  }
  layer.ClearRelinquishedChildren();
  if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  self.m_editStatus.import('uuid', splitStaff.GetID());
  return true;
}
  public SplitNeume(neumeId: string, ncId: string) {
  const self = this as unknown as { m_doc: AnyObj; m_editStatus: AnyObj };
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const uuidArray: string[] = [];

  const elNc = page.FindDescendantByID(ncId) as unknown as AnyObj | null;
  const fparent = page.FindDescendantByID(neumeId) as unknown as AnyObj | null;
  if (!fparent) throw new Error('EditorToolkitNeume.SplitNeume: neume required.');
  uuidArray.push(fparent.GetID());

  const sparent = fparent.GetFirstAncestor(ClassId.SYLLABLE) as unknown as AnyObj | null;
  if (!sparent) throw new Error('EditorToolkitNeume.SplitNeume: syllable ancestor required.');

  const nLen = fparent.GetChildCount(ClassId.UNSPECIFIED);
  if (nLen === 0) {
    LogError('The selected neume has no children.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'The selected neume has no children.');
    return false;
  }

  let fIdx = fparent.GetChildIndex(elNc as unknown as VrvObject);
  if (fIdx === -1) {
    LogError('The selected neume component is not a child of the selected neume.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'The selected neume component is not a child of the selected neume.');
    return false;
  }
  // Clicking a ligature targets its second nc, so the split starts one earlier.
  if (elNc && elNc.HasAttribute('ligated', 'true')) fIdx -= 1;

  const newParent = fparent.Clone() as unknown as AnyObj;
  newParent.CloneReset();
  if (!newParent) throw new Error('EditorToolkitNeume.SplitNeume: clone required.');
  newParent.ClearChildren();

  // Move [fIdx, end) into the clone; the index stays fixed as children drain.
  let it = fparent.GetChild(fIdx) as unknown as AnyObj | null;
  while (it) {
    it.MoveItselfTo(newParent as unknown as VrvObject);
    fparent.ClearRelinquishedChildren();
    it = fparent.GetChild(fIdx) as unknown as AnyObj | null;
  }

  sparent.InsertAfter(fparent as unknown as VrvObject, newParent as unknown as VrvObject);

  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  self.m_editStatus.import('uuid', uuidArray);
  return true;
}
  public Remove(elementId: string) {
  const self = this as unknown as {
    m_doc: AnyObj; m_editStatus: AnyObj; UnlinkSyllable(s: unknown): void;
  };
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const element = page.FindDescendantByID(elementId) as unknown as AnyObj | null;
  if (!element) throw new Error('EditorToolkitNeume.Remove: element cast failed.');
  const parent = element.GetParent() as unknown as AnyObj | null;
  if (!parent) throw new Error('EditorToolkitNeume.Remove: parent required.');

  let result = false;
  const isNc = element.Is(ClassId.NC);
  const isNeumeOrNc = element.Is(ClassId.NEUME) || element.Is(ClassId.NC);

  // Detach zones for the element and every facsimile-bearing descendant.
  const ic = new InterfaceComparison(InterfaceId.INTERFACE_FACSIMILE);
  const fiChildren: VrvObject[] = [];
  element.FindAllDescendantsByComparison(fiChildren, ic);
  const ownFi = element.GetFacsimileInterface() as unknown as { HasFacs(): boolean; AttachZone(z: null): void } | null;
  if (ownFi && ownFi.HasFacs()) ownFi.AttachZone(null);
  for (const candidate of fiChildren) {
    const fi = (candidate as unknown as AnyObj).GetFacsimileInterface() as unknown as {
      HasFacs(): boolean; AttachZone(z: null): void;
    } | null;
    if (fi && fi.HasFacs()) fi.AttachZone(null);
  }

  if (element.Is(ClassId.CLEF)) {
    // Pitches are clef-relative, so re-resolve every pitched element in the
    // clef's span against the surviving (previous) clef before deleting.
    const clef = element as AnyObj;
    const ac = new ClassIdComparison(ClassId.CLEF);
    let previousClef = page.FindPreviousChild(ac, clef) as unknown as AnyObj | null;
    const nextClef = page.FindNextChild(ac, clef) as unknown as AnyObj | null;
    if (!previousClef) {
      // No previous clef: fall back to the layer's current (staffDef) clef.
      const layer = clef.GetFirstAncestor(ClassId.LAYER) as unknown as AnyObj;
      if (!layer) throw new Error('EditorToolkitNeume.Remove: layer ancestor required.');
      previousClef = layer.GetCurrentClef() as unknown as AnyObj | null;
    }
    const elements: VrvObject[] = [];
    const pic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
    const endBound = (nextClef ?? page.GetLast()) as VrvObject;
    if (!endBound) throw new Error('EditorToolkitNeume.Remove: end bound required.');
    page.FindAllDescendantsBetween(elements, pic, clef, endBound);
    result = parent.DeleteChild(element);
    if (!result) {
      LogError('Failed to delete the desired element (%s)', elementId);
      self.m_editStatus.reset();
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', `Failed to delete the desired element (${elementId}).`);
      return false;
    }
    for (const target of elements) {
      const pi = (target as unknown as AnyObj).GetPitchInterface() as unknown as {
        AdjustPitchForNewClef(a: unknown, b: unknown): void;
      } | null;
      if (!pi) throw new Error('EditorToolkitNeume.Remove: pitch interface required.');
      pi.AdjustPitchForNewClef(clef, previousClef);
    }
    self.m_editStatus.import('uuid', elementId);
    self.m_editStatus.import('status', 'OK');
    self.m_editStatus.import('message', '');
    return true;
  } else if (element.Is(ClassId.STAFF)) {
    const system = element.GetFirstAncestor(ClassId.SYSTEM) as unknown as AnyObj;
    if (!system) throw new Error('EditorToolkitNeume.Remove: system ancestor required.');
    if (page.GetChildCount(ClassId.SYSTEM) > 1) {
      if (system === page.GetFirst(ClassId.SYSTEM)) {
        // Target in first system: push pb + section forward.
        const nextSystem = page.GetNextOf(system, ClassId.SYSTEM) as unknown as AnyObj;
        if (!nextSystem) throw new Error('EditorToolkitNeume.Remove: next system required.');
        let section = system.FindDescendantByType(ClassId.SECTION) as unknown as AnyObj | null;
        let pb = system.FindDescendantByType(ClassId.PB) as unknown as AnyObj | null;
        if (!pb || !section) throw new Error('EditorToolkitNeume.Remove: pb/section required.');
        section = system.DetachChild(section.GetIdx()) as unknown as AnyObj;
        pb = system.DetachChild(pb.GetIdx()) as unknown as AnyObj;
        nextSystem.InsertChild(section, 0);
        nextSystem.InsertChild(pb, 1);
      } else if (system === page.GetLast(ClassId.SYSTEM)) {
        // Target in last system: pull milestone-end back.
        const previousSystem = page.GetPrevious(system, ClassId.SYSTEM) as unknown as AnyObj;
        if (!previousSystem) throw new Error('EditorToolkitNeume.Remove: previous system required.');
        let milestoneEnd = system.FindDescendantByType(ClassId.SYSTEM_MILESTONE_END) as unknown as AnyObj | null;
        if (!milestoneEnd) throw new Error('EditorToolkitNeume.Remove: milestone end required.');
        const idx = system.GetChildIndex(milestoneEnd as unknown as VrvObject);
        milestoneEnd = system.DetachChild(idx) as unknown as AnyObj;
        previousSystem.InsertChild(milestoneEnd, previousSystem.GetChildCount(ClassId.UNSPECIFIED));
      }
    }
    // Deleting the system deletes the staff with it.
    result = page.DeleteChild(system);
    if (!result) {
      LogError('Failed to delete the desired element (%s)', elementId);
      self.m_editStatus.reset();
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', `Failed to delete the desired element (${elementId}).`);
      return false;
    }
    self.m_editStatus.import('uuid', elementId);
    self.m_editStatus.import('status', 'OK');
    self.m_editStatus.import('message', '');
    return true;
  }

  if (element.Is(ClassId.SYLLABLE)) {
    const syl = element as AnyObj;
    if (linkOf(syl).HasPrecedes() || linkOf(syl).HasFollows()) self.UnlinkSyllable(element);
  }

  if (!result) result = parent.DeleteChild(element);
  if (!result) {
    LogError('Failed to delete the desired element (%s)', elementId);
    self.m_editStatus.reset();
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', `Failed to delete the desired element (${elementId}).`);
    return false;
  }

  // Prune containers left empty: nc -> neume -> syllable. C++ rebinds the
  // local element/parent pointers, mirrored here with reassignable locals.
  let cur: AnyObj = element;
  let curParent: AnyObj = parent;
  if (isNc) {
    if (!curParent.Is(ClassId.NEUME)) throw new Error('EditorToolkitNeume.Remove: neume parent required.');
    cur = curParent;
    const grandParent = cur.GetParent() as unknown as AnyObj | null;
    if (!grandParent) throw new Error('EditorToolkitNeume.Remove: neume grandparent required.');
    curParent = grandParent;
    if (!cur.FindDescendantByType(ClassId.NC)) {
      const neumeId = cur.GetID();
      result = result && curParent.DeleteChild(cur);
      if (!result) {
        LogError('Failed to delete empty neume (%s)', neumeId);
        self.m_editStatus.reset();
        self.m_editStatus.import('status', 'FAILURE');
        self.m_editStatus.import('message', `Failed to delete empty neume (${neumeId}).`);
        return false;
      }
    }
  }
  if (isNeumeOrNc) {
    if (!curParent.Is(ClassId.SYLLABLE)) throw new Error('EditorToolkitNeume.Remove: syllable parent required.');
    cur = curParent;
    const grandParent = cur.GetParent() as unknown as AnyObj | null;
    if (!grandParent) throw new Error('EditorToolkitNeume.Remove: syllable grandparent required.');
    curParent = grandParent;
    if (!cur.FindDescendantByType(ClassId.NC)) {
      if (linkOf(cur).HasPrecedes() || linkOf(cur).HasFollows()) self.UnlinkSyllable(cur);
      const syllableId = cur.GetID();
      result = result && curParent.DeleteChild(cur);
      if (!result) {
        LogError('Failed to delete empty syllable (%s)', syllableId);
        self.m_editStatus.reset();
        self.m_editStatus.import('status', 'FAILURE');
        self.m_editStatus.import('message', `Failed to delete empty syllable (${syllableId}).`);
        return false;
      }
    }
  }

  self.m_editStatus.import('uuid', elementId);
  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  return true;
}
  public Resize(elementId: string, ulx: number, uly: number, lrx: number, lry: number, rotate: number = NaN) {
  const self = this as unknown as {
    m_doc: AnyObj; m_editStatus: AnyObj; SortStaves(): void;
  };
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  if (!self.m_doc.HasFacsimile()) {
    LogWarning('Resizing is only available in facsimile mode.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Resizing is only available in facsimile mode.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const obj = page.FindDescendantByID(elementId) as unknown as AnyObj | null;
  if (!obj) {
    LogError("Object with ID '%s' not found.", elementId);
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', `Object with ID '${elementId}' could not be found.`);
    return false;
  }
  if (obj.Is(ClassId.STAFF)) {
    const staff = obj;
    if (!staff.HasFacs()) {
      LogError('This staff does not have a facsimile.');
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', 'This staff does not have a facsimile.');
      return false;
    }
    const zone = staff.GetZone() as unknown as {
      SetUlx(v: number): void; SetUly(v: number): void; SetLrx(v: number): void; SetLry(v: number): void;
      SetRotate(v: number): void; GetUly(): number; GetLry(): number; Modify(m?: boolean): void;
    } | null;
    if (!zone) throw new Error('EditorToolkitNeume.Resize: staff zone required.');
    zone.SetUlx(ulx);
    zone.SetUly(uly);
    zone.SetLrx(lrx);
    zone.SetLry(lry);
    const orgRotate = staff.GetDrawingRotation() as number;
    if (!Number.isNaN(rotate)) zone.SetRotate(rotate);
    zone.Modify();
    self.SortStaves();
    if (staff.HasDrawingRotation()) {
      const accids = staff.FindAllDescendantsByType(ClassId.ACCID) as VrvObject[];
      for (const candidate of accids) {
        const accid = candidate as unknown as AnyObj;
        const fi = accid.GetFacsimileInterface() as unknown as {
          GetZone(): { SetUly(v: number): void; SetLry(v: number): void; GetUly(): number; GetLry(): number } | null;
        } | null;
        if (!fi) throw new Error('EditorToolkitNeume.Resize: accid facsimile required.');
        const accidZone = fi.GetZone();
        if (!accidZone) throw new Error('EditorToolkitNeume.Resize: accid zone required.');
        let rotationOffset = (accid.GetDrawingX() - staff.GetDrawingX()) * Math.tan(rotate * Math.PI / 180.0);
        if (orgRotate) {
          const orgOffset = (accid.GetDrawingX() - staff.GetDrawingX()) * Math.tan(orgRotate * Math.PI / 180.0);
          rotationOffset -= orgOffset;
        }
        // C++ int(rotationOffset) truncates toward zero at assignment.
        accidZone.SetUly(accidZone.GetUly() + Math.trunc(rotationOffset));
        accidZone.SetLry(accidZone.GetLry() + Math.trunc(rotationOffset));
      }
    }
    if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
    page.LayOutTranscription(true);
  } else if (obj.Is(ClassId.SYL)) {
    const syl = obj;
    if (!syl.HasFacs()) {
      // C++ quirk: the log string drops the closing parenthesis present in the
      // sibling staff message, while the status message differs entirely.
      LogError('This syl (bounding box) does not have a facsimile');
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', 'This syl does not have a facsimile.');
      return false;
    }
    const fi = syl.GetFacsimileInterface() as unknown as {
      GetZone(): {
        SetUlx(v: number): void; SetUly(v: number): void; SetLrx(v: number): void; SetLry(v: number): void;
        SetRotate(v: number): void; Modify(m?: boolean): void;
      } | null;
    } | null;
    if (!fi) throw new Error('EditorToolkitNeume.Resize: syl facsimile required.');
    const zone = fi.GetZone();
    if (!zone) throw new Error('EditorToolkitNeume.Resize: syl zone required.');
    // C++ swaps inverted pairs so ul <= lr on both axes.
    if (ulx < lrx) { zone.SetUlx(ulx); zone.SetLrx(lrx); }
    else { zone.SetUlx(lrx); zone.SetLrx(ulx); }
    if (uly < lry) { zone.SetUly(uly); zone.SetLry(lry); }
    else { zone.SetUly(lry); zone.SetLry(uly); }
    if (!Number.isNaN(rotate)) zone.SetRotate(rotate);
    zone.Modify();
    if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
  } else {
    LogError("Element of type '%s' is unsupported.", obj.GetClassName());
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', `Element of type '${obj.GetClassName()}' is unsupported.`);
    return false;
  }
  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  return true;
}
  public Group(groupType: string, elementIds: string[]) {
  const self = this as unknown as {
    m_doc: AnyObj; m_editStatus: AnyObj;
    Set(id: string, attr: string, value: string): boolean; Remove(id: string): boolean;
    Group(t: string, ids: string[]): boolean;
  };
  let parent: AnyObj | null = null;
  let secondParent: AnyObj | null = null;
  const parents = new Map<AnyObj, number>();
  const elements: AnyObj[] = [];
  const fullParents: AnyObj[] = [];
  const clefsBefore = new Map<AnyObj, AnyObj | null>();

  let status = 'OK';
  let message = '';

  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  if (elementIds.length === 0) {
    LogWarning('No element IDs to group!');
    status = 'WARNING';
    message = 'No element IDs to group!';
    self.m_editStatus.import('status', status);
    self.m_editStatus.import('message', message);
    return true;
  }
  let elementClass: ClassId;
  if (groupType === 'nc') elementClass = ClassId.NC;
  else if (groupType === 'neume') elementClass = ClassId.NEUME;
  else {
    LogError('Invalid groupType: %s', groupType);
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Invalid groupType: ' + groupType);
    return false;
  }

  // Collect elements, verifying uniform class, and count parents.
  for (let ii = 0; ii < elementIds.length; ++ii) {
    const id = elementIds[ii];
    const el = page.FindDescendantByID(id) as unknown as AnyObj | null;
    if (!el) {
      LogError('Could not get element with ID %s', id);
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', 'Could not get element with ID ' + id);
      return false;
    }
    if (el.GetClassId() !== elementClass) {
      LogError('Element %s was of class %s. Expected class %s', el.GetID(), el.GetClassName(), groupType);
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message',
        'Element ' + el.GetID() + ' was of class ' + el.GetClassName() + ' but expected class ' + groupType + '.');
      return false;
    }
    const par = el.GetParent() as unknown as AnyObj | null;
    if (!par) {
      LogError('Parent of %s is null!', el.GetID());
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', 'Parent of ' + el.GetID() + ' is null.');
      return false;
    }
    if (par.GetClassId() === ClassId.SYLLABLE) {
      // Linked/split syllable: unlink, group each side separately, relink results.
      if (linkOf(par).HasFollows()) {
        let linkedID = linkOf(par).GetFollows();
        if (linkedID.startsWith('#')) linkedID = linkedID.substring(1);
        self.Set(par.GetID(), 'follows', '');
        self.Set(linkedID, 'precedes', '');
        const idx = ii;
        let resultId0: string;
        let resultId1: string;
        self.Group('neume', elementIds.slice(0, idx));
        if (String(self.m_editStatus.getValue('status')) === 'FAILURE') resultId0 = linkedID;
        else resultId0 = String(self.m_editStatus.getValue('uuid'));
        self.Group('neume', elementIds.slice(idx));
        let regrouped = par;
        if (String(self.m_editStatus.getValue('status')) === 'FAILURE') {
          resultId1 = par.GetID();
        } else {
          resultId1 = String(self.m_editStatus.getValue('uuid'));
          const relookup = page.FindDescendantByID(resultId1) as unknown as AnyObj | null;
          if (relookup) regrouped = relookup;
        }
        self.Set(resultId0, 'precedes', '#' + resultId1);
        self.Set(resultId1, 'follows', '#' + resultId0);
        const resultSyl1 = regrouped.FindDescendantByType(ClassId.SYL) as unknown as AnyObj | null;
        if (resultSyl1) self.Remove(resultSyl1.GetID());
        // C++ jsonxx::Array uuid — the mock import stores the raw value.
        self.m_editStatus.import('uuid', [resultId0, resultId1]);
        self.m_editStatus.import('status', status);
        self.m_editStatus.import('message', message);
        return true;
      }
    }
    parents.set(par, (parents.get(par) ?? 0) + 1);
    elements.push(el);
  }

  if (parents.size === 0) {
    LogError('Could not get the parent.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the parent.');
    return false;
  } else if (parents.size === 1) {
    LogError('The selected elements are already grouped.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'The selected elements are already grouped.');
    return false;
  }

  const clefs: VrvObject[] = [];
  const syllables: AnyObj[] = [];
  const clefComp = new ClassIdComparison(ClassId.CLEF);
  const pitchComp = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
  let newClef: AnyObj | null = null;

  const firstSyl = elements[0].GetFirstAncestor(ClassId.SYLLABLE) as unknown as VrvObject;
  const lastSyl = elements[elements.length - 1].GetFirstAncestor(ClassId.SYLLABLE) as unknown as VrvObject;
  page.FindAllDescendantsBetween(clefs, clefComp, firstSyl, lastSyl);

  // Clefs between grouped elements force pitch reassociation after the move.
  if (clefs.length !== 0) {
    for (const el of elements) {
      if (el.Is(ClassId.SYLLABLE)) syllables.push(el);
      else syllables.push(el.GetFirstAncestor(ClassId.SYLLABLE) as unknown as AnyObj);
    }
    for (const syl of syllables) {
      let tempClef = page.FindPreviousChild(clefComp, syl) as unknown as AnyObj | null;
      if (!tempClef) {
        const layer = syl.GetFirstAncestor(ClassId.LAYER) as unknown as AnyObj;
        if (!layer) throw new Error('EditorToolkitNeume.Group: layer ancestor required.');
        tempClef = layer.GetCurrentClef() as unknown as AnyObj | null;
      }
      clefsBefore.set(syl, tempClef);
    }
    newClef = clefsBefore.get(syllables[0]) ?? null;
  }

  // All parents must share one second-level parent.
  secondParent = (Array.from(parents.keys())[0].GetParent() as unknown as AnyObj | null);
  if (!secondParent) {
    LogError('No second level parent!');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'No second level parent.');
    return false;
  }
  for (const [par, count] of parents) {
    if ((par.GetParent() as unknown as AnyObj | null) !== secondParent) {
      LogError('No shared second level parent!');
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', 'No shared second level parent.');
      return false;
    }
    let expected: number;
    if (par.GetClassId() === ClassId.SYLLABLE) expected = par.GetChildCount(ClassId.NEUME);
    else expected = par.GetChildCount(ClassId.UNSPECIFIED);
    if (count === expected) fullParents.push(par);
  }

  // No full parent: build a fresh container for everything.
  if (fullParents.length === 0) {
    if (elementClass === ClassId.NC) {
      parent = new Neume() as unknown as AnyObj;
    } else {
      parent = new Syllable() as unknown as AnyObj;
      const oldSyl = (elements[0].GetFirstAncestor(ClassId.SYLLABLE) as unknown as AnyObj)
        .GetFirst(ClassId.SYL) as unknown as AnyObj;
      for (const el of elements) {
        if (!el.Is(ClassId.SYL)) el.MoveItselfTo(parent);
      }
      const syl = new Syl() as unknown as AnyObj;
      const text = new Text() as unknown as AnyObj;
      text.SetText(UTF8to32(''));
      syl.AddChild(text as unknown as VrvObject);
      parent.AddChild(syl as unknown as VrvObject);
      if (self.m_doc.HasFacsimile()) {
        const zone = new Zone() as unknown as AnyObj;
        const firstNcZone = facsZoneOf(
          (parent.GetFirst(ClassId.NEUME) as unknown as AnyObj).GetFirst(ClassId.NC) as unknown as AnyObj,
          'first nc');
        const lastNcZone = facsZoneOf(
          (parent.GetLast(ClassId.NEUME) as unknown as AnyObj).GetLast(ClassId.NC) as unknown as AnyObj,
          'last nc');
        const oldSylZone = facsZoneOf(oldSyl, 'old syl');
        if (!firstNcZone || !lastNcZone || !oldSylZone) {
          throw new Error('EditorToolkitNeume.Group: group bbox zone required.');
        }
        (zone as unknown as { SetUlx(v: number): void }).SetUlx(zoneNum(firstNcZone, 'GetUlx'));
        (zone as unknown as { SetUly(v: number): void }).SetUly(zoneNum(oldSylZone, 'GetUly'));
        (zone as unknown as { SetLrx(v: number): void }).SetLrx(zoneNum(lastNcZone, 'GetLrx'));
        (zone as unknown as { SetLry(v: number): void }).SetLry(zoneNum(oldSylZone, 'GetLry'));
        // C++ GetChildCount(NC, 2) depth-2 semantic: per-NEUME sums via GetNext().
        if (ncCountDepth2(parent) <= 2) {
          (zone as unknown as { SetLrx(v: number): void; GetLrx(): number }).SetLrx(
            (zone as unknown as { GetLrx(): number }).GetLrx() + 50);
        }
        if (!self.m_doc.GetFacsimile()) throw new Error('EditorToolkitNeume.Group: facsimile required.');
        ((self.m_doc.GetFacsimile() as unknown as AnyObj)
          .FindDescendantByType(ClassId.SURFACE) as unknown as AnyObj)
          .AddChild(zone as unknown as VrvObject);
        const fi = syl.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void } | null;
        if (!fi) throw new Error('EditorToolkitNeume.Group: syl facsimile required.');
        fi.AttachZone(zone);
      }
    }
    secondParent.AddChild(parent as unknown as VrvObject);
  } else if (fullParents.length === 1) {
    // One full parent absorbs the rest (SYL tags stay put).
    parent = fullParents[0];
    for (const el of elements) {
      if ((el.GetParent() as unknown as AnyObj | null) !== parent && !el.Is(ClassId.SYL)) {
        el.MoveItselfTo(parent as unknown as VrvObject);
      }
    }
  } else {
    if (elementClass === ClassId.NC) {
      parent = new Neume() as unknown as AnyObj;
      for (const el of elements) {
        if ((el.GetParent() as unknown as AnyObj | null) !== parent && !el.Is(ClassId.SYL)) {
          el.MoveItselfTo(parent as unknown as VrvObject);
        }
      }
      secondParent.AddChild(parent as unknown as VrvObject);
    } else {
      parent = new Syllable() as unknown as AnyObj;
      let fullSyl: AnyObj | null = null;
      let ulx = 0; let uly = 0; let lrx = 0; let lry = 0;
      let fullString: number[] = [];
      for (const fp of fullParents) {
        const syl = fp.FindDescendantByType(ClassId.SYL) as unknown as AnyObj | null;
        if (syl && self.m_doc.HasFacsimile()) {
          const zone = facsZoneOf(syl, 'concat syl');
          if (!zone) throw new Error('EditorToolkitNeume.Group: concat zone required.');
          if (!fullSyl) {
            fullSyl = syl;
            ulx = zoneNum(zone, 'GetUlx'); uly = zoneNum(zone, 'GetUly');
            lrx = zoneNum(zone, 'GetLrx'); lry = zoneNum(zone, 'GetLry');
          }
          const text = syl.FindDescendantByType(ClassId.TEXT) as unknown as {
            GetText(): number[];
          } | null;
          if (text) fullString = fullString.concat(text.GetText());
          ulx = Math.min(ulx, zoneNum(zone, 'GetUlx'));
          uly = Math.min(uly, zoneNum(zone, 'GetUly'));
          lrx = Math.max(lrx, zoneNum(zone, 'GetLrx'));
          lry = Math.max(lry, zoneNum(zone, 'GetLry'));
        }
      }
      for (const el of elements) {
        if ((el.GetParent() as unknown as AnyObj | null) !== parent && !el.Is(ClassId.SYL)) {
          el.MoveItselfTo(parent as unknown as VrvObject);
        }
      }
      if (!fullSyl) throw new Error('EditorToolkitNeume.Group: full syl required.');
      (fullSyl.FindDescendantByType(ClassId.TEXT) as unknown as { SetText(t: number[]): void })
        .SetText(fullString);
      // C++ adaptation: AddChild on an owned child asserts; MoveItselfTo is the
      // TS reparent, matching every other move in this method.
      (fullSyl as unknown as AnyObj).MoveItselfTo(parent as unknown as VrvObject);
      if (self.m_doc.HasFacsimile()) {
        const zone = facsZoneOf(fullSyl, 'full syl');
        if (!zone) throw new Error('EditorToolkitNeume.Group: full syl zone required.');
        (zone as unknown as { SetUlx(v: number): void }).SetUlx(ulx);
        (zone as unknown as { SetUly(v: number): void }).SetUly(uly);
        (zone as unknown as { SetLrx(v: number): void }).SetLrx(lrx);
        (zone as unknown as { SetLry(v: number): void }).SetLry(lry);
      }
      secondParent.AddChild(parent as unknown as VrvObject);
    }
  }

  // Re-resolve pitches whose clef changed. C++ asserts newClef non-null, but
  // only reaches this block with syllables populated when clefs existed.
  if (syllables.length !== 0) {
    if (!newClef) throw new Error('EditorToolkitNeume.Group: new clef required.');
    for (const syllable of syllables) {
      if (clefsBefore.get(syllable) !== newClef) {
        const pitchedChildren: VrvObject[] = [];
        syllable.FindAllDescendantsByComparison(pitchedChildren, pitchComp);
        for (const child of pitchedChildren) {
          const pi = (child as unknown as AnyObj).GetPitchInterface() as unknown as {
            AdjustPitchForNewClef(a: unknown, b: unknown): void;
          } | null;
          if (!pi) throw new Error('EditorToolkitNeume.Group: pitch interface required.');
          pi.AdjustPitchForNewClef(clefsBefore.get(syllable), newClef);
        }
      }
    }
  }

  // Delete emptied parents; rescue divLine/accid/clef leftovers into the group.
  for (const [obj] of parents) {
    obj.ClearRelinquishedChildren();
    if (obj.GetChildCount(ClassId.UNSPECIFIED) === 0) {
      secondParent.DeleteChild(obj as unknown as VrvObject);
    } else if (obj.GetChildCount(ClassId.UNSPECIFIED)
      === (obj.GetChildCount(ClassId.SYL) + obj.GetChildCount(ClassId.DIVLINE)
        + obj.GetChildCount(ClassId.ACCID) + obj.GetChildCount(ClassId.CLEF))) {
      let leftover = obj.FindDescendantByType(ClassId.SYL) as unknown as AnyObj | null;
      while (leftover) {
        const zone = facsZoneOf(leftover, 'leftover syl');
        if (zone) {
          ((self.m_doc.GetFacsimile() as unknown as AnyObj)
            .FindDescendantByType(ClassId.SURFACE) as unknown as AnyObj)
            .DeleteChild(zone as unknown as VrvObject);
        }
        obj.DeleteChild(leftover as unknown as VrvObject);
        leftover = obj.FindDescendantByType(ClassId.SYL) as unknown as AnyObj | null;
      }
      if (!parent) throw new Error('EditorToolkitNeume.Group: parent required.');
      let divLeft = obj.FindDescendantByType(ClassId.DIVLINE) as unknown as AnyObj | null;
      while (divLeft) {
        divLeft.MoveItselfTo(parent as unknown as VrvObject);
        obj.ClearRelinquishedChildren();
        divLeft = obj.FindDescendantByType(ClassId.DIVLINE) as unknown as AnyObj | null;
      }
      let accLeft = obj.FindDescendantByType(ClassId.ACCID) as unknown as AnyObj | null;
      while (accLeft) {
        accLeft.MoveItselfTo(parent as unknown as VrvObject);
        obj.ClearRelinquishedChildren();
        accLeft = obj.FindDescendantByType(ClassId.ACCID) as unknown as AnyObj | null;
      }
      let clefLeft = obj.FindDescendantByType(ClassId.CLEF) as unknown as AnyObj | null;
      while (clefLeft) {
        clefLeft.MoveItselfTo(parent as unknown as VrvObject);
        obj.ClearRelinquishedChildren();
        clefLeft = obj.FindDescendantByType(ClassId.CLEF) as unknown as AnyObj | null;
      }
      secondParent.DeleteChild(obj as unknown as VrvObject);
    }
  }

  secondParent.ReorderByXPos();
  if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();

  if (!parent) throw new Error('EditorToolkitNeume.Group: parent required.');
  self.m_editStatus.import('uuid', parent.GetID());
  self.m_editStatus.import('status', status);
  self.m_editStatus.import('message', message);
  return true;
}
  public UnlinkSyllable(syllable: unknown) {
  const self = this as unknown as { m_doc: AnyObj; m_editStatus: AnyObj };
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return;
  }
  if (!syllable) throw new Error('EditorToolkitNeume.UnlinkSyllable: syllable required.');
  const syl = syllable as unknown as AnyObj;
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  let linkedID = String(linkOf(syl).HasPrecedes() ? linkOf(syl).GetPrecedes() : linkOf(syl).GetFollows());
  if (linkedID.startsWith('#')) linkedID = linkedID.substring(1);
  const linked = page.FindDescendantByID(linkedID) as unknown as AnyObj | null;
  // C++ dynamic_cast<Syllable*> null-check; TS uses the SYLLABLE class gate.
  if (linked && linked.Is(ClassId.SYLLABLE)) {
    if (linkOf(linked).HasPrecedes()) linkOf(linked).SetPrecedes('');
    if (linked.HasFollows()) {
      linkOf(linked).SetFollows('');
      // Empty syl for the second part.
      const sylEl = new Syl();
      const text = new Text();
      text.SetText(UTF8to32(''));
      sylEl.AddChild(text as unknown as VrvObject);
      linked.AddChild(sylEl as unknown as VrvObject);
      // Default bbox when the doc has a facsimile.
      if (self.m_doc.HasFacsimile()) {
        const zone = new Zone();
        const staff = linked.GetAncestorStaff() as unknown as AnyObj;
        const mUnit = self.m_doc.GetDrawingDoubleUnit
          ? self.m_doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize as number)
          : 0;
        const firstNc = (linked.GetFirst(ClassId.NEUME) as unknown as AnyObj).GetFirst(ClassId.NC) as unknown as AnyObj;
        const lastNc = (linked.GetLast(ClassId.NEUME) as unknown as AnyObj).GetLast(ClassId.NC) as unknown as AnyObj;
        zone.SetUlx((firstNc.GetFacsimileInterface() as unknown as AnyObj).GetZone().GetUlx());
        zone.SetUly((staff.GetFacsimileInterface() as unknown as AnyObj).GetZone().GetLry());
        zone.SetLrx((lastNc.GetFacsimileInterface() as unknown as AnyObj).GetZone().GetLrx());
        zone.SetLry(zone.GetUly() + mUnit * 2);
        // Widen when the syllable holds fewer than 2 ncs. C++ GetChildCount(NC, 2)
        // counts with depth 2 (neume -> nc); the TS port only counts direct
        // children, so replicate via per-NEUME child sums (ponytail: port the
        // depth overload into object.ts when the base migration reaches it).
        let ncCount = 0;
        for (let n = linked.GetFirst(ClassId.NEUME) as unknown as AnyObj | null;
          n; n = linked.GetNext() as unknown as AnyObj | null) {
          ncCount += n.GetChildCount(ClassId.NC);
        }
        if (ncCount <= 2) zone.SetLrx(zone.GetLrx() + 50);
        const facs = self.m_doc.GetFacsimile() as unknown as AnyObj;
        if (!facs) throw new Error('EditorToolkitNeume.UnlinkSyllable: facsimile required.');
        (facs.FindDescendantByType(ClassId.SURFACE) as unknown as AnyObj).AddChild(zone as unknown as VrvObject);
        const fi = (sylEl as unknown as AnyObj).GetFacsimileInterface() as unknown as AnyObj;
        if (!fi) throw new Error('EditorToolkitNeume.UnlinkSyllable: syl facsimile interface required.');
        fi.AttachZone(zone as unknown as never);
        if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
      }
    }
  }
}
  public Ungroup(groupType: string, elementIds: string[]) {
  const self = this as unknown as { m_doc: AnyObj; m_editStatus: AnyObj };
  let fparent: AnyObj | null = null;
  let sparent: AnyObj | null = null;
  let currentParent: AnyObj | null = null;
  let newParent: AnyObj | null = null;
  let firstNc: AnyObj | null = null;
  let secondNc: AnyObj | null = null;
  let success1 = false; let success2 = false;
  let ligCount = 0;
  let ligNum = 0;
  let firstIsLig = false;
  let firstIsSyl = false;
  let oldSylZone: AnyObj | null = null;
  let oldClef: AnyObj | null = null;
  const ac = new ClassIdComparison(ClassId.CLEF);
  const syllables: AnyObj[] = [];
  const uuidArray: string[] = [];
  let breakOnEnd = false;

  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;

  // C++ mutates the loop vector in place (erase); TS uses an index over a copy.
  const ids = elementIds.slice();
  for (let ii = 0; ii < ids.length; ++ii) {
    let el = page.FindDescendantByID(ids[ii]) as unknown as AnyObj | null;
    if (!el) throw new Error('EditorToolkitNeume.Ungroup: element required.');

    // Whole-selection ligature (exactly 2 ncs): toggle off before ungrouping.
    if (groupType === 'nc' && ids.length === 2) {
      const nc = el;
      if (nc.HasLigated && nc.HasLigated() && nc.GetLigated() === BOOLEAN_true) {
        nc.SetLigated(BOOLEAN_false);
        ligCount++;
        if (ligCount === 1) {
          firstNc = nc;
        } else if (ligCount === 2) {
          secondNc = nc;
          const zone = new Zone() as unknown as AnyObj;
          const staff = firstNc!.GetFirstAncestor(ClassId.STAFF) as unknown as AnyObj;
          if (!staff) throw new Error('EditorToolkitNeume.Ungroup: staff ancestor required.');
          if (!self.m_doc.GetFacsimile()) throw new Error('EditorToolkitNeume.Ungroup: facsimile required.');
          const surface = (self.m_doc.GetFacsimile() as unknown as AnyObj)
            .FindDescendantByType(ClassId.SURFACE) as unknown as AnyObj | null;
          if (!surface) throw new Error('EditorToolkitNeume.Ungroup: surface required.');
          const unit = self.m_doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize) as number;
          const noteHeight = Math.trunc(unit / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
          const noteWidth = Math.trunc(unit / NOTE_WIDTH_TO_STAFF_SIZE_RATIO);
          if (AttModule.SetNeumes(firstNc! as unknown as Parameters<typeof AttModule.SetNeumes>[0], 'ligated', 'false')) success1 = true;
          const ligUlx = zoneGet(zoneOf(firstNc!, 'first nc'), 'GetUlx');
          const ligUly = zoneGet(zoneOf(firstNc!, 'first nc'), 'GetUly');
          const ligLrx = zoneGet(zoneOf(firstNc!, 'first nc'), 'GetLrx');
          const ligLry = zoneGet(zoneOf(firstNc!, 'first nc'), 'GetLry');
          zoneSet(zone, 'SetUlx', ligUlx + noteWidth);
          zoneSet(zone, 'SetUly', ligUly + noteHeight);
          zoneSet(zone, 'SetLrx', ligLrx + noteWidth);
          zoneSet(zone, 'SetLry', ligLry + noteHeight);
          surface.DeleteChild(zoneOf(secondNc!, 'second nc') as unknown as VrvObject);
          (secondNc!.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void })
            .AttachZone(zone);
          if (AttModule.SetNeumes(secondNc! as unknown as Parameters<typeof AttModule.SetNeumes>[0], 'ligated', 'false')) success2 = true;
          if (success1 && success2) {
            ligCount = 0; firstNc = null; secondNc = null;
          } else {
            LogError('Unable to toggle ligature within ungroup ncs!');
            self.m_editStatus.import('status', 'FAILURE');
            self.m_editStatus.import('message', 'Unable to toggle ligature within ungroup ncs.');
            return false;
          }
        }
      }
    }

    // ACCID/DIVLINE/CLEF move straight to the layer, skipping the group flow.
    // `while` with index removal replaces the C++ iterator-erase dance.
    while (el.Is(ClassId.ACCID) || el.Is(ClassId.DIVLINE) || el.Is(ClassId.CLEF)) {
      fparent = el.GetFirstAncestor(ClassId.SYLLABLE) as unknown as AnyObj | null;
      sparent = el.GetFirstAncestor(ClassId.LAYER) as unknown as AnyObj | null;
      if (fparent && sparent) {
        el.MoveItselfTo(sparent as unknown as VrvObject);
        sparent.ReorderByXPos();
        fparent.ClearRelinquishedChildren();
        fparent.ReorderByXPos();
        uuidArray.push(ids[ii]);
        ids.splice(ii, 1);
        ii--;
        if (ii + 1 >= ids.length) { breakOnEnd = true; break; }
        el = page.FindDescendantByID(ids[ii + 1]) as unknown as AnyObj | null;
        if (!el) throw new Error('EditorToolkitNeume.Ungroup: element required.');
      } else break;
    }
    if (breakOnEnd) break;

    if (ii === 0 || firstIsSyl) {
      if (el.Is(ClassId.SYL)) {
        // SYL stays on the first group; collapse its box and defer parent init.
        firstIsSyl = true;
        const z = (el.GetFacsimileInterface() as unknown as { GetZone(): unknown } | null)?.GetZone() as AnyObj | null;
        oldSylZone = z;
        if (oldSylZone) zoneSet(oldSylZone, 'SetLrx', zoneGet(oldSylZone, 'GetUlx') + 100);
        continue;
      } else if (groupType === 'nc') {
        if (el.HasLigated && el.HasLigated() && el.GetLigated() === BOOLEAN_true) firstIsLig = true;
        fparent = el.GetFirstAncestor(ClassId.NEUME) as unknown as AnyObj | null;
        if (!fparent) throw new Error('EditorToolkitNeume.Ungroup: neume ancestor required.');
        uuidArray.push(fparent.GetID());
        sparent = fparent.GetFirstAncestor(ClassId.SYLLABLE) as unknown as AnyObj | null;
        if (!sparent) throw new Error('EditorToolkitNeume.Ungroup: syllable ancestor required.');
        currentParent = fparent;
        firstIsSyl = false;
      } else if (groupType === 'neume') {
        fparent = el.GetFirstAncestor(ClassId.SYLLABLE) as unknown as AnyObj | null;
        if (!fparent) throw new Error('EditorToolkitNeume.Ungroup: syllable ancestor required.');
        uuidArray.push(fparent.GetID());
        sparent = fparent.GetFirstAncestor(ClassId.LAYER) as unknown as AnyObj | null;
        if (!sparent) throw new Error('EditorToolkitNeume.Ungroup: layer ancestor required.');
        currentParent = fparent;
        firstIsSyl = false;
        oldClef = page.FindPreviousChild(ac, currentParent as unknown as VrvObject) as unknown as AnyObj | null;
        if (!oldClef) oldClef = (sparent as unknown as { GetCurrentClef(): unknown }).GetCurrentClef() as AnyObj | null;
        if (!oldSylZone) {
          oldSylZone = ((currentParent.GetFirst(ClassId.SYL) as unknown as AnyObj)
            .GetFacsimileInterface() as unknown as { GetZone(): unknown }).GetZone() as AnyObj | null;
        }
      } else {
        LogError('Invalid groupType for ungrouping');
        self.m_editStatus.import('status', 'FAILURE');
        self.m_editStatus.import('message', 'Invalid groupType for ungrouping.');
        return false;
      }
    } else if (currentParent) {
      if (el.Is(ClassId.SYL)) {
        if (oldSylZone) zoneSet(oldSylZone, 'SetLrx', zoneGet(oldSylZone, 'GetUlx') + 100);
        continue;
      }
      if (groupType === 'nc') {
        if (firstIsLig) { firstIsLig = false; continue; }
        if (el.HasLigated && el.HasLigated() && el.GetLigated() === BOOLEAN_true) ligNum++;
      }
      if (ligNum !== 2) {
        newParent = currentParent.Clone() as unknown as AnyObj;
        newParent.CloneReset();
        if (!newParent) throw new Error('EditorToolkitNeume.Ungroup: clone required.');
        newParent.ClearChildren();
      }
      if (!newParent) throw new Error('EditorToolkitNeume.Ungroup: new parent required.');
      el.MoveItselfTo(newParent as unknown as VrvObject);
      fparent!.ClearRelinquishedChildren();
      if (newParent.Is(ClassId.SYLLABLE)) {
        syllables.push(newParent);
        const syl = new Syl() as unknown as AnyObj;
        const text = new Text() as unknown as AnyObj;
        text.SetText(UTF8to32(''));
        syl.AddChild(text as unknown as VrvObject);
        newParent.AddChild(syl as unknown as VrvObject);
        if (self.m_doc.HasFacsimile()) {
          const zone = new Zone() as unknown as AnyObj;
          const movedNcs = (newParent as unknown as {
            FindAllDescendantsByType(id: unknown): VrvObject[];
          }).FindAllDescendantsByType(ClassId.NC) as unknown as AnyObj[];
          const firstMoved = movedNcs.length !== 0 ? movedNcs[0] : el;
          const lastMoved = movedNcs.length !== 0 ? movedNcs[movedNcs.length - 1] : el;
          const firstNcZone = zoneOf(firstMoved, 'split el');
          const lastNcZone = zoneOf(lastMoved, 'split el');
          if (!oldSylZone) throw new Error('EditorToolkitNeume.Ungroup: old syl zone required.');
          zoneSet(zone, 'SetUlx', zoneGet(firstNcZone, 'GetUlx'));
          zoneSet(zone, 'SetUly', zoneGet(oldSylZone, 'GetUly'));
          zoneSet(zone, 'SetLrx', zoneGet(lastNcZone, 'GetLrx'));
          zoneSet(zone, 'SetLry', zoneGet(oldSylZone, 'GetLry'));
          // C++ GetChildCount(NC, 2) depth-2 semantic: sum of per-NEUME NC counts.
          if (ncDepth2(newParent) <= 2) zoneSet(zone, 'SetLrx', zoneGet(zone, 'GetLrx') + 50);
          if (!self.m_doc.GetFacsimile()) throw new Error('EditorToolkitNeume.Ungroup: facsimile required.');
          ((self.m_doc.GetFacsimile() as unknown as AnyObj)
            .FindDescendantByType(ClassId.SURFACE) as unknown as AnyObj)
            .AddChild(zone as unknown as VrvObject);
          const fi = syl.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void } | null;
          if (!fi) throw new Error('EditorToolkitNeume.Ungroup: syl facsimile required.');
          fi.AttachZone(zone);
        }
      }
      if (ligNum !== 1) {
        uuidArray.push(newParent.GetID());
        sparent!.AddChild(newParent as unknown as VrvObject);
        sparent!.ReorderByXPos();
      }
      if (ligNum === 2) ligNum = 0;
    }
  }

  // Clef changes: stable-sort new syllables by ulx, adjust pitches past a new clef.
  if (syllables.length !== 0) {
    const ic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
    const vec = syllables.slice();
    vec.sort((a, b) => (VrvObject.sortByUlx(a as unknown as VrvObject, b as unknown as VrvObject) ? -1 : 1));
    for (const sylParent of vec) {
      let currentClef = page.FindPreviousChild(ac, sylParent as unknown as VrvObject) as unknown as AnyObj | null;
      if (!currentClef && sparent) {
        currentClef = (sparent as unknown as { GetCurrentClef(): unknown }).GetCurrentClef() as AnyObj | null;
      }
      if (currentClef !== oldClef) {
        const pitchedChildren: VrvObject[] = [];
        sylParent.FindAllDescendantsByComparison(pitchedChildren, ic);
        for (const child of pitchedChildren) {
          const pi = (child as unknown as AnyObj).GetPitchInterface() as unknown as {
            AdjustPitchForNewClef(a: unknown, b: unknown): void;
          } | null;
          if (!pi) throw new Error('EditorToolkitNeume.Ungroup: pitch interface required.');
          pi.AdjustPitchForNewClef(oldClef, currentClef);
        }
      }
    }
  }

  if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  self.m_editStatus.import('uuid', uuidArray);
  return true;
}
  public ChangeGroup(elementId: string, contour: string) {
  const self = this as unknown as { m_doc: AnyObj; m_editStatus: AnyObj };
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const el = page.FindDescendantByID(elementId) as unknown as AnyObj | null;
  if (!el) {
    LogError('Unable to find neume with id %s', elementId);
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Unable to find neume with id ' + elementId + '.');
    return false;
  }

  // Keep the first NC, delete the rest (C++ DeleteChild loop on a snapshot).
  const children = el.FindAllDescendantsByType(ClassId.NC) as VrvObject[];
  let firstChild: AnyObj | null = null;
  for (const child of children) {
    if (!firstChild) firstChild = child as unknown as AnyObj;
    else el.DeleteChild(child);
  }
  // C++ checks !firstChild but never sets FAILURE status — preserve the quirk.
  if (!firstChild) {
    LogError('Unable to find first child.');
    return false;
  }

  let initialUlx = zoneGet(zoneOf(firstChild, 'first nc'), 'GetUlx');
  let initialUly = zoneGet(zoneOf(firstChild, 'first nc'), 'GetUly');
  let initialLrx = zoneGet(zoneOf(firstChild, 'first nc'), 'GetLrx');
  let initialLry = zoneGet(zoneOf(firstChild, 'first nc'), 'GetLry');

  const staff = el.GetAncestorStaff() as unknown as AnyObj;
  if (!staff) throw new Error('EditorToolkitNeume.ChangeGroup: staff ancestor required.');
  if (!self.m_doc.GetFacsimile()) throw new Error('EditorToolkitNeume.ChangeGroup: facsimile required.');
  const facsimile = self.m_doc.GetFacsimile() as unknown as AnyObj;
  const unit = self.m_doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize) as number;
  const noteHeight = Math.trunc(unit / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
  const noteWidth = Math.trunc(unit / NOTE_WIDTH_TO_STAFF_SIZE_RATIO);
  let prevNc = firstChild;

  const pi0 = prevNc.GetPitchInterface() as unknown as {
    GetPname(): number; GetOct(): number; AdjustPitchByOffset(v: number): void;
  } | null;
  if (!pi0) throw new Error('EditorToolkitNeume.ChangeGroup: pitch interface required.');

  for (const ch of contour) {
    const newNc = new Nc() as unknown as AnyObj;
    const zone = new Zone() as unknown as AnyObj;
    const newUlx = initialUlx + noteWidth;
    const newLrx = initialLrx + noteWidth;
    let newUly: number; let newLry: number;
    const prevPi = (prevNc.GetPitchInterface() as unknown as {
      GetPname(): number; GetOct(): number; AdjustPitchByOffset(v: number): void;
    } | null);
    if (!prevPi) throw new Error('EditorToolkitNeume.ChangeGroup: pitch interface required.');
    (newNc.GetPitchInterface() as unknown as { SetPname(v: number): void }).SetPname(prevPi.GetPname());
    (newNc.GetPitchInterface() as unknown as { SetOct(v: number): void }).SetOct(prevPi.GetOct());
    if (ch === 'u') {
      newUly = initialUly - noteHeight;
      newLry = initialLry - noteHeight;
      (newNc.GetPitchInterface() as unknown as { AdjustPitchByOffset(v: number): void }).AdjustPitchByOffset(1);
    } else if (ch === 'd') {
      newUly = initialUly + noteHeight;
      newLry = initialLry + noteHeight;
      (newNc.GetPitchInterface() as unknown as { AdjustPitchByOffset(v: number): void }).AdjustPitchByOffset(-1);
    } else if (ch === 's') {
      newUly = initialUly;
      newLry = initialLry;
    } else {
      // C++ deletes both heap objects; GC handles TS references.
      LogError('Unsupported character in contour.');
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', 'Unsupported character in contour.');
      return false;
    }
    zoneSet(zone, 'SetUlx', newUlx);
    zoneSet(zone, 'SetUly', newUly);
    zoneSet(zone, 'SetLrx', newLrx);
    zoneSet(zone, 'SetLry', newLry);
    (newNc.GetFacsimileInterface() as unknown as { AttachZone(z: unknown): void }).AttachZone(zone);
    const surface = facsimile.FindDescendantByType(ClassId.SURFACE) as unknown as AnyObj | null;
    if (!surface) throw new Error('EditorToolkitNeume.ChangeGroup: surface required.');
    surface.AddChild(zone as unknown as VrvObject);
    el.AddChild(newNc as unknown as VrvObject);
    initialUlx = newUlx; initialUly = newUly; initialLrx = newLrx; initialLry = newLry;
    prevNc = newNc;
  }

  if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
  self.m_editStatus.import('uuid', el.GetID());
  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  return true;
}
  public ToggleLigature(elementIds: string[]) {
  const self = this as unknown as {
    m_doc: AnyObj; m_editStatus: AnyObj;
    Set(elementId: string, attrType: string, attrValue: string): boolean;
  };
  if (elementIds.length !== 2) throw new Error('EditorToolkitNeume.ToggleLigature: 2 ids required.');
  let success1 = false;
  let success2 = false;
  const firstNcId = elementIds[0];
  const secondNcId = elementIds[1];
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const firstNc = page.FindDescendantByID(firstNcId) as unknown as AnyObj | null;
  if (!firstNc) throw new Error('EditorToolkitNeume.ToggleLigature: first nc required.');
  const secondNc = page.FindDescendantByID(secondNcId) as unknown as AnyObj | null;
  if (!secondNc) throw new Error('EditorToolkitNeume.ToggleLigature: second nc required.');

  const firstIdx = firstNc.GetIdx();
  const secondIdx = secondNc.GetIdx();
  if (Math.abs(firstIdx - secondIdx) !== 1) {
    LogError('The selected ncs are not adjacent.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'The selected ncs are not adjacent.');
    return false;
  }

  let isLigature = false;
  if (firstNc.HasAttribute('ligated', 'true') && secondNc.HasAttribute('ligated', 'true')) {
    isLigature = true;
  } else {
    // Clear decorative state first so the new ligature starts clean.
    self.Set(firstNcId, 'tilt', '');
    self.Set(secondNcId, 'tilt', '');
    self.Set(firstNcId, 'curve', '');
    self.Set(secondNcId, 'curve', '');
  }
  if (firstNc.GetChildCount(ClassId.UNSPECIFIED) > 0) {
    const liqChildren = firstNc.FindAllDescendantsByType(ClassId.LIQUESCENT) as VrvObject[];
    for (const child of liqChildren) firstNc.DeleteChild(child);
  }
  if (secondNc.GetChildCount(ClassId.UNSPECIFIED) > 0) {
    const liqChildren = secondNc.FindAllDescendantsByType(ClassId.LIQUESCENT) as VrvObject[];
    for (const child of liqChildren) secondNc.DeleteChild(child);
  }

  const firstNcZone = ligZone(firstNc);
  const secondNcZone = ligZone(secondNc);
  const ligUlx = zoneField(firstNcZone, 'GetUlx');
  const ligUly = zoneField(firstNcZone, 'GetUly');
  const ligLrx = zoneField(firstNcZone, 'GetLrx');
  const ligLry = zoneField(firstNcZone, 'GetLry');

  const staff = firstNc.GetFirstAncestor(ClassId.STAFF) as unknown as AnyObj | null;
  if (!staff) throw new Error('EditorToolkitNeume.ToggleLigature: staff ancestor required.');
  const unit = self.m_doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize) as number;
  const noteHeight = Math.trunc(unit / NOTE_HEIGHT_TO_STAFF_SIZE_RATIO);
  const noteWidth = Math.trunc(unit / NOTE_WIDTH_TO_STAFF_SIZE_RATIO);

  if (isLigature) {
    if (self.Set(firstNcId, 'ligated', 'false')) success1 = true;
    zonePut(secondNcZone, 'SetUlx', ligUlx + noteWidth);
    zonePut(secondNcZone, 'SetUly', ligUly + noteHeight);
    zonePut(secondNcZone, 'SetLrx', ligLrx + noteWidth);
    zonePut(secondNcZone, 'SetLry', ligLry + noteHeight);
    if (self.Set(secondNcId, 'ligated', 'false')) success2 = true;
  } else {
    if (self.Set(firstNcId, 'ligated', 'true')) success1 = true;
    zonePut(secondNcZone, 'SetUlx', ligUlx);
    zonePut(secondNcZone, 'SetUly', ligUly + noteHeight);
    zonePut(secondNcZone, 'SetLrx', ligLrx);
    zonePut(secondNcZone, 'SetLry', ligLry + noteHeight);
    if (self.Set(secondNcId, 'ligated', 'true')) success2 = true;
  }

  if (!(success1 && success2)) {
    LogWarning('Unable to update ligature attribute');
    self.m_editStatus.import('message', 'Unable to update ligature attribute.');
    self.m_editStatus.import('status', 'WARNING');
    return false;
  }

  if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
  (self.m_doc.GetDrawingPage() as AnyObj).LayOutTranscription(true);

  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  return success1 && success2;
}
  public ToggleNeumeConnection(elementIds: string[]) {
  const self = this as unknown as { m_doc: AnyObj; m_editStatus: AnyObj };
  if (elementIds.length !== 2) throw new Error('EditorToolkitNeume.ToggleNeumeConnection: 2 ids required.');
  const firstNcId = elementIds[0];
  const secondNcId = elementIds[1];
  if (!self.m_doc.GetDrawingPage()) {
    LogError('Could not get the drawing page.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }
  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const firstNc = page.FindDescendantByID(firstNcId) as unknown as AnyObj | null;
  if (!firstNc) throw new Error('EditorToolkitNeume.ToggleNeumeConnection: first nc required.');
  const secondNc = page.FindDescendantByID(secondNcId) as unknown as AnyObj | null;
  if (!secondNc) throw new Error('EditorToolkitNeume.ToggleNeumeConnection: second nc required.');

  if (firstNc.GetParent() !== secondNc.GetParent()) {
    LogError('The selected ncs are not in the same neume.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'The selected ncs are not in the same neume.');
    return false;
  }

  const firstIdx = firstNc.GetIdx();
  const secondIdx = secondNc.GetIdx();
  if (Math.abs(firstIdx - secondIdx) !== 1) {
    LogError('The selected ncs are not adjacent.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'The selected ncs are not adjacent.');
    return false;
  }

  const currentNc = firstIdx > secondIdx ? firstNc : secondNc;
  const staff = currentNc.GetFirstAncestor(ClassId.STAFF) as unknown as AnyObj | null;
  if (!staff) throw new Error('EditorToolkitNeume.ToggleNeumeConnection: staff ancestor required.');
  if (staff.m_drawingNotationType !== NOTATIONTYPE_neume_hufnagel) {
    LogError('Neume connections are supported only for Hufnagel notation.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Neume connections are supported only for Hufnagel notation.');
    return false;
  }

  currentNc.SetCon(currentNc.GetCon() === ncForm_CON_e ? ncForm_CON_NONE : ncForm_CON_e);

  if (self.m_doc.IsTranscription() && self.m_doc.HasFacsimile()) self.m_doc.SyncFromFacsimileDoc();
  (self.m_doc.GetDrawingPage() as AnyObj).LayOutTranscription(true);

  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  return true;
}
  public ChangeStaff(elementId: string) {
  const self = this as unknown as {
    m_doc: AnyObj; m_editStatus: AnyObj;
    AdjustPitchFromPosition(element: unknown): boolean;
    AdjustClefLineFromPosition(clef: unknown, staff?: unknown): boolean;
  };
  if (!self.m_doc.GetDrawingPage()) {
    // C++ log lacks the trailing period but the status message has it — keep verbatim.
    LogError('Could not get the drawing page');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not get the drawing page.');
    return false;
  }

  if (!self.m_doc.HasFacsimile()) {
    LogWarning('Staff re-association is only available in facsimile mode.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Staff re-association is only available in facsimile mode.');
    return false;
  }

  const page = self.m_doc.GetDrawingPage() as AnyObj;
  const element = page.FindDescendantByID(elementId) as unknown as AnyObj | null;
  if (!element) throw new Error('EditorToolkitNeume.ChangeStaff: element required.');
  if (element === null) {
    LogError("No element exists with ID '%s'.", elementId);
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'No element exists with ID' + elementId + '.');
    return false;
  }

  if (!(element.Is(ClassId.SYLLABLE) || element.Is(ClassId.CUSTOS) || element.Is(ClassId.CLEF)
      || element.Is(ClassId.DIVLINE) || element.Is(ClassId.ACCID))) {
    LogError(
      'Element is of type %s, but only Syllables, Custos, Clefs, Divlines, and Accids can change staves.',
      element.GetClassName(),
    );
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message',
      'Element is of type ' + element.GetClassName()
      + ', but only Syllables, Custos, Clefs, DivLines, and Accids can change staves.');
    return false;
  }

  const stavesList = self.m_doc.FindAllDescendantsByType(ClassId.STAFF, false) as VrvObject[];
  const staves: VrvObject[] = stavesList.slice();

  const comp = new ClosestBB();

  const fi = element.GetFacsimileInterface() as unknown as { HasFacs(): boolean; GetZone(): unknown } | null;
  if (fi && fi.HasFacs()) {
    const zone = fi.GetZone() as unknown as {
      GetUlx(): number; GetUly(): number;
    };
    comp.x = zone.GetUlx();
    comp.y = zone.GetUly();
  } else if (element.Is(ClassId.SYLLABLE)) {
    const rUlx = { value: 0 };
    const rUly = { value: 0 };
    const rLrx = { value: 0 };
    const rLry = { value: 0 };
    if (!element.GenerateZoneBounds(rUlx, rUly, rLrx, rLry)) {
      LogError("Couldn't generate bounding box for syllable.");
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', "Couldn't generate bounding box for syllable.");
      return false;
    }
    const ulx = rUlx.value;
    const uly = rUly.value;
    const lrx = rLrx.value;
    const lry = rLry.value;
    comp.x = (lrx + ulx) / 2;
    // C++ integer division truncates toward zero on (uly + lry) / 2.
    comp.y = Math.trunc((uly + lry) / 2);
  } else {
    LogError('This element does not have a facsimile.');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'This element does not have a facsimile.');
    return false;
  }

  // TS Array.prototype.sort takes a numeric comparator; C++ std::sort with the
  // ClosestBB bool predicate is modeled as a stable index-tagged sort so the
  // nearest staff lands at index 0 either way.
  let staff: AnyObj | null = null;
  if (staves.length > 0) {
    const tagged = staves.map((s, i) => ({ s, i }));
    tagged.sort((a, b) => {
      if (comp.compare(a.s, b.s)) return -1;
      if (comp.compare(b.s, a.s)) return 1;
      return a.i - b.i;
    });
    staff = tagged[0].s as AnyObj;
  } else {
    LogError('Could not find any staves. This should not happen');
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', 'Could not find any staves. This should not happen');
    return false;
  }

  const parent = element.GetFirstAncestor(ClassId.LAYER) as unknown as AnyObj | null;
  const sParent = (parent ? parent.GetFirstAncestor(ClassId.STAFF) : null) as unknown as AnyObj | null;
  if (!parent) throw new Error('EditorToolkitNeume.ChangeStaff: parent required.');
  if (parent === null || sParent === null) {
    LogError("Couldn't find staff parent of element with id '%s'", elementId);
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', "Couldn't find staff parent of element with id " + elementId);
    return false;
  }

  const layer = staff.FindDescendantByType(ClassId.LAYER) as unknown as AnyObj | null;
  if (!layer) throw new Error('EditorToolkitNeume.ChangeStaff: layer required.');
  if (layer === null) {
    LogError("Couldn't find layer child of staff. This should not happen");
    self.m_editStatus.import('status', 'FAILURE');
    self.m_editStatus.import('message', "Couldn't find layer child of staff. This should not happen");
    return false;
  }

  if (layer === parent) {
    self.m_editStatus.import('status', 'WARNING');
    self.m_editStatus.import('message', 'Moving to the same staff as before.');
    self.m_editStatus.import('elementId', elementId);
    self.m_editStatus.import('newStaffId', staff.GetID());
    return true;
  }

  if (element.Is(ClassId.ACCID) || element.Is(ClassId.DIVLINE)) {
    // Move accid/divLine out of a syllable before re-homing it.
    const elParent = element.GetParent() as unknown as AnyObj | null;
    if (elParent && elParent.Is(ClassId.SYLLABLE)) {
      const par = elParent;
      const sPar = par.GetParent() as unknown as AnyObj | null;
      if (!sPar) throw new Error('EditorToolkitNeume.ChangeStaff: syllable parent required.');
      element.MoveItselfTo(sPar);
      sPar.ReorderByXPos();
      par.ClearRelinquishedChildren();
      par.ReorderByXPos();
    }
  }

  if (element.Is(ClassId.CLEF)) {
    const clef = element;
    const ic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
    const cic = new ClassIdComparison(ClassId.CLEF);

    let previousClefBefore = page.FindPreviousChild(cic, element) as unknown as AnyObj | null;
    if (previousClefBefore === null) {
      previousClefBefore = layer.GetCurrentClef() as unknown as AnyObj | null;
    }
    const nextClefBefore = page.FindNextChild(cic, element) as unknown as AnyObj | null;

    const oldPitchChildren: VrvObject[] = [];
    page.FindAllDescendantsBetween(
      oldPitchChildren, ic, clef,
      (nextClefBefore !== null ? nextClefBefore : page.GetLast()) as VrvObject);
    for (const child of oldPitchChildren) {
      const pi = (child as AnyObj).GetPitchInterface() as unknown as {
        AdjustPitchForNewClef(a: unknown, b: unknown): void;
      } | null;
      if (!pi) throw new Error('EditorToolkitNeume.ChangeStaff: pitch interface required.');
      pi.AdjustPitchForNewClef(clef, previousClefBefore);
    }

    element.MoveItselfTo(layer);
    layer.ReorderByXPos();
    parent.ClearRelinquishedChildren();
    parent.ReorderByXPos();

    if (!self.AdjustClefLineFromPosition(element, staff)) {
      LogError('Could not adjust clef line of %s', element.GetID());
      self.m_editStatus.import('status', 'FAILURE');
      self.m_editStatus.import('message', 'Failed to set clef line from facsimile.');
      return false;
    }

    const newPitchChildren: VrvObject[] = [];
    let previousClefAfter = page.FindPreviousChild(cic, element) as unknown as AnyObj | null;
    if (previousClefAfter === null) {
      previousClefAfter = layer.GetCurrentClef() as unknown as AnyObj | null;
    }
    const nextClefAfter = page.FindNextChild(cic, element) as unknown as AnyObj | null;
    page.FindAllDescendantsBetween(
      newPitchChildren, ic, clef,
      (nextClefAfter !== null ? nextClefAfter : page.GetLast()) as VrvObject);
    for (const child of newPitchChildren) {
      const pi = (child as AnyObj).GetPitchInterface() as unknown as {
        AdjustPitchForNewClef(a: unknown, b: unknown): void;
      } | null;
      if (!pi) throw new Error('EditorToolkitNeume.ChangeStaff: pitch interface required.');
      pi.AdjustPitchForNewClef(previousClefAfter, clef);
    }
  } else {
    element.MoveItselfTo(layer);
    layer.ReorderByXPos();
    parent.ClearRelinquishedChildren();
    parent.ReorderByXPos();
    if (!(element.Is(ClassId.ACCID) || element.Is(ClassId.DIVLINE))) {
      if (!self.AdjustPitchFromPosition(element)) {
        LogError('Could not adjust pitch of %s', element.GetID());
        self.m_editStatus.import('status', 'FAILURE');
        self.m_editStatus.import('message', 'Failed to properly set pitch.');
        self.m_editStatus.import('elementId', element.GetID());
        self.m_editStatus.import('newStaffId', staff.GetID());
        return false;
      }
    }
  }

  self.m_editStatus.import('status', 'OK');
  self.m_editStatus.import('message', '');
  self.m_editStatus.import('elementId', elementId);
  self.m_editStatus.import('newStaffId', staff.GetID());
  return true;
}
  public ChangeStaffTo(elementId: string,
  staffId: string,) {
  const doc = this.m_doc as AnyObj;
  const view = this.m_view as AnyObj;
  const status = getStatus(this as unknown as AnyObj);

  const page = doc.GetDrawingPage() as AnyObj | null;
  if (!page) {
    LogError('Could not get the drawing page');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not get the drawing page.');
    return false;
  }

  if (!doc.HasFacsimile()) {
    LogWarning('Staff re-association is only available in facsimile mode.');
    status.import('status', 'FAILURE');
    status.import('message', 'Staff re-association is only available in facsimile mode.');
    return false;
  }

  const element = page.FindDescendantByID(elementId) as AnyObj | null;
  if (!element) throw new Error('EditorToolkitNeume.ChangeStaffTo: element required.');
  if (element === null) {
    LogError(`No element exists with ID '${elementId}'.`, elementId);
    status.import('status', 'FAILURE');
    status.import('message', 'No element exists with ID' + elementId + '.');
    return false;
  }

  if (!(element.Is(ClassId.CLEF) || element.Is(ClassId.DIVLINE) || element.Is(ClassId.ACCID))) {
    LogError(
      `Element is of type ${element.GetClassName()}, but only Clefs, Divlines, and Accids can change to a specified staff.`,
      element.GetClassName(),
    );
    status.import('status', 'FAILURE');
    status.import(
      'message',
      'Element is of type ' + element.GetClassName()
        + ', but only Clefs, Divlines, and Accids can change to a specified staff.',
    );
    return false;
  }

  const staff = page.FindDescendantByID(staffId) as AnyObj | null;
  // C++ dynamic_cast<Staff *> null-check: reject anything that is not a STAFF.
  if (!staff || !staff.Is(ClassId.STAFF)) {
    LogError('Could not find any staves. This should not happen');
    status.import('status', 'FAILURE');
    status.import('message', 'Could not find any staves. This should not happen');
    return false;
  }

  const parent = element.GetFirstAncestor(ClassId.LAYER) as AnyObj | null;
  const sParent = parent ? (parent.GetFirstAncestor(ClassId.STAFF) as AnyObj | null) : null;
  if (!parent) throw new Error('EditorToolkitNeume.ChangeStaffTo: layer parent required.');
  if (parent === null || sParent === null) {
    LogError(`Couldn't find staff parent of element with id '${elementId}'`, elementId);
    status.import('status', 'FAILURE');
    status.import('message', `Couldn't find staff parent of element with id ${elementId}`);
    return false;
  }

  const layer = staff.FindDescendantByType(ClassId.LAYER) as AnyObj | null;
  // C++ assert(LAYER) checks a class-id constant and can never fire; kept as
  // a comment for parity, not as a runtime check.
  if (layer === null) {
    LogError(`Couldn't find layer child of staff. This should not happen`);
    status.import('status', 'FAILURE');
    status.import('message', `Couldn't find layer child of staff. This should not happen`);
    return false;
  }

  if (layer === parent) {
    status.import('status', 'WARNING');
    status.import('message', 'Moving to the same staff as before.');
    status.import('elementId', elementId);
    status.import('newStaffId', staff.GetID());
    return true;
  }

  if (element.Is(ClassId.ACCID) || element.Is(ClassId.DIVLINE)) {
    // If accid or divLine is inside the syllable, move it out.
    if (element.GetParent() && element.GetParent()!.Is(ClassId.SYLLABLE)) {
      const par = element.GetParent()! as AnyObj;
      const sPar = par.GetParent() as AnyObj | null;
      if (!par) throw new Error('EditorToolkitNeume.ChangeStaffTo: parent required.');
      if (!sPar) throw new Error('EditorToolkitNeume.ChangeStaffTo: grandparent required.');
      element.MoveItselfTo(sPar);
      sPar.ReorderByXPos();
      par.ClearRelinquishedChildren();
      par.ReorderByXPos();
    }
  }

  // Adjust pitch/staff line.
  if (element.Is(ClassId.CLEF)) {
    const clef = element as AnyObj;
    const ic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
    const cic = new ClassIdComparison(ClassId.CLEF);

    let previousClefBefore = page.FindPreviousChild(cic, element) as AnyObj | null;
    if (previousClefBefore === null) {
      previousClefBefore = (layer as AnyObj).GetCurrentClef();
    }
    const nextClefBefore = page.FindNextChild(cic, element) as AnyObj | null;
    const oldPitchChildren: AnyObj[] = [];
    page.FindAllDescendantsBetween(
      oldPitchChildren,
      ic,
      clef,
      nextClefBefore !== null ? nextClefBefore : page.GetLast()!,
    );
    for (const it of oldPitchChildren) {
      const pi = (it as AnyObj).GetPitchInterface() as AnyObj | null;
      if (!pi) throw new Error('EditorToolkitNeume.ChangeStaffTo: pitch interface required.');
      pi.AdjustPitchForNewClef(clef, previousClefBefore);
    }

    element.MoveItselfTo(layer);
    (layer as AnyObj).ReorderByXPos();
    parent.ClearRelinquishedChildren();
    parent.ReorderByXPos();

    // Adjust clefline.
    if (!(this as AnyObj).AdjustClefLineFromPosition(element, staff)) {
      LogError(`Could not adjust clef line of ${element.GetID()}`, element.GetID());
      status.import('status', 'FAILURE');
      status.import('message', 'Failed to set clef line from facsimile.');
      return false;
    }

    // Apply pitch interface changes to any elements whose clef may have changed.
    const newPitchChildren: AnyObj[] = [];
    let previousClefAfter = page.FindPreviousChild(cic, element) as AnyObj | null;
    if (previousClefAfter === null) {
      previousClefAfter = (layer as AnyObj).GetCurrentClef();
    }
    const nextClefAfter = page.FindNextChild(cic, element) as AnyObj | null;
    page.FindAllDescendantsBetween(
      newPitchChildren,
      ic,
      clef,
      nextClefAfter !== null ? nextClefAfter : page.GetLast()!,
    );
    for (const it of newPitchChildren) {
      const pi = (it as AnyObj).GetPitchInterface() as AnyObj | null;
      if (!pi) throw new Error('EditorToolkitNeume.ChangeStaffTo: pitch interface required.');
      pi.AdjustPitchForNewClef(previousClefAfter, clef);
    }
  }
  else {
    // C++ quirk vs ChangeStaff: no AdjustPitchFromPosition here; ACCID and
    // DIVLINE just move.
    element.MoveItselfTo(layer);
    (layer as AnyObj).ReorderByXPos();
    parent.ClearRelinquishedChildren();
    parent.ReorderByXPos();
  }

  void view;
  status.import('status', 'OK');
  status.import('message', '');
  status.import('elementId', elementId);
  status.import('newStaffId', staff.GetID());
  return true;
}
  public ClefMovementHandler(clefIn: unknown, x: number, y: number) {
  const clef = clefIn as AnyObj;
  const doc = docOf(this);
  const layer = clef.GetFirstAncestor(ClassId.LAYER) as AnyObj | null;
  if (!layer) return false;
  const staff = layer.GetFirstAncestor(ClassId.STAFF) as AnyObj;
  const staffSize: number = staffSizeOf(staff);
  const initialClefLine: number = clef.GetLine();
  const clefLine = Math.round((y - x * Math.tan(staff.GetDrawingRotation() * Math.PI / 180.0))
    / doc.GetDrawingDoubleUnit(staffSize) + initialClefLine);
  const lineDiff = clefLine - initialClefLine;

  const withThisClefBefore: VrvObject[] = [];
  const withPrecedingClefBefore: VrvObject[] = [];
  const ac = new ClassIdComparison(ClassId.CLEF);
  const ic = new InterfaceComparison(InterfaceId.INTERFACE_PITCH);
  const page = doc.GetDrawingPage() as AnyObj;
  const precedingClefBefore = page.FindPreviousChild(ac, clef) as AnyObj | null;
  const nextClefBefore = page.FindNextChild(ac, clef) as AnyObj | null;
  const curClef = typeof layer.GetCurrentClef === 'function' ? (layer.GetCurrentClef() as AnyObj | null) : null;
  page.FindAllDescendantsBetween(withThisClefBefore, ic, clef,
    nextClefBefore !== curClef ? (nextClefBefore as unknown as VrvObject) : lastOf(page));
  page.FindAllDescendantsBetween(withPrecedingClefBefore, ic,
    precedingClefBefore as unknown as VrvObject, clef);

  if (clef.HasFacs()) {
    const zone = getZoneAny(clef);
    const yy = (clefLine - initialClefLine) * 2 * staffSize - x * Math.tan(staff.GetDrawingRotation() * Math.PI / 180.0);
    zone?.ShiftByXY(x, -yy);
  }
  layer.ReorderByXPos();

  const precedingClefAfter = page.FindPreviousChild(ac, clef) as AnyObj | null;
  const nextClefAfter = page.FindNextChild(ac, clef) as AnyObj | null;

  if (precedingClefAfter === precedingClefBefore && nextClefAfter === nextClefBefore) {
    const withThisClefAfter: VrvObject[] = [];
    const withPrecedingClefAfter: VrvObject[] = [];
    page.FindAllDescendantsBetween(withThisClefAfter, ic, clef,
      nextClefAfter ? (nextClefAfter as unknown as VrvObject) : lastOf(page));
    page.FindAllDescendantsBetween(withPrecedingClefAfter, ic, precedingClefBefore as unknown as VrvObject, clef);
    if (withPrecedingClefBefore.length > withPrecedingClefAfter.length) {
      clef.SetLine(clefLine);
      for (const o of setDiff(withPrecedingClefBefore, withPrecedingClefAfter)) {
        getPitchAny(o as AnyObj)?.AdjustPitchForNewClef(precedingClefBefore ?? curClef, clef);
      }
      if (lineDiff !== 0) {
        for (const o of withThisClefBefore) getPitchAny(o as AnyObj)?.AdjustPitchByOffset(lineDiff * -2);
      }
    }
    else if (withPrecedingClefBefore.length < withPrecedingClefAfter.length) {
      for (const o of setDiff(withPrecedingClefAfter, withPrecedingClefBefore)) {
        getPitchAny(o as AnyObj)?.AdjustPitchForNewClef(clef, precedingClefBefore ?? curClef);
      }
      if (lineDiff !== 0) {
        for (const o of withThisClefAfter) getPitchAny(o as AnyObj)?.AdjustPitchByOffset(lineDiff * -2);
      }
      clef.SetLine(clefLine);
    }
    else {
      clef.SetLine(clefLine);
      if (lineDiff !== 0) {
        for (const o of withThisClefBefore) getPitchAny(o as AnyObj)?.AdjustPitchByOffset(lineDiff * -2);
      }
    }
  }
  else {
    const withOldPrecedingClefAfter: VrvObject[] = [];
    const withNewPrecedingClefBefore: VrvObject[] = [];
    const withNewPrecedingClefAfter: VrvObject[] = [];
    page.FindAllDescendantsBetween(withOldPrecedingClefAfter, ic, precedingClefBefore as unknown as VrvObject,
      nextClefBefore ? (nextClefBefore as unknown as VrvObject) : lastOf(page));
    page.FindAllDescendantsBetween(withNewPrecedingClefBefore, ic, precedingClefAfter as unknown as VrvObject,
      nextClefAfter ? (nextClefAfter as unknown as VrvObject) : lastOf(page));
    page.FindAllDescendantsBetween(withNewPrecedingClefAfter, ic, precedingClefAfter as unknown as VrvObject, clef);
    for (const o of setDiff(withOldPrecedingClefAfter, withPrecedingClefBefore)) {
      getPitchAny(o as AnyObj)?.AdjustPitchForNewClef(clef, precedingClefBefore ?? curClef);
    }
    clef.SetLine(clefLine);
    for (const o of setDiff(withNewPrecedingClefBefore, withNewPrecedingClefAfter)) {
      getPitchAny(o as AnyObj)?.AdjustPitchForNewClef(precedingClefAfter ?? curClef, clef);
    }
  }
  return true;
}
  public AdjustPitchAfterDrag(objIn: unknown, y = 0) {
  const obj = objIn as AnyObj;
  const doc = docOf(this);
  if (!obj.Is(ClassId.NC) && !obj.Is(ClassId.CUSTOS)) {
    LogError('AdjustPitchAfterDrag should only be called on custos or ncs.'
      + 'It has been called on %s, whose id is %s');
    return false;
  }
  const pi = getPitchAny(obj);
  const staff = obj.GetFirstAncestor(ClassId.STAFF) as AnyObj;
  const staffSize = doc.GetDrawingUnit(staffSizeOf(staff));
  // C++ NOTE_HEIGHT_TO_STAFF_SIZE_RATIO == 2 preserved literally.
  const noteHeight = Math.trunc(staffSize * 2 / 2);
  const yOffset = y > 0 ? noteHeight / 2 : -noteHeight / 2;
  const pitchDifference = Math.trunc((y + yOffset) / staffSize);
  pi?.AdjustPitchByOffset(pitchDifference);
  return true;
}
  public AdjustPitchFromPosition(objIn: unknown) {
  const obj = objIn as AnyObj;
  const doc = docOf(this);
  const view = viewOf(this);
  if (!obj.Is(ClassId.CUSTOS) && !obj.Is(ClassId.SYLLABLE) && !obj.Is(ClassId.NEUME)) {
    LogError('AdjustPitchFromPosition should only be called on custos or syllables/neumes. Called on %s, ID: %s');
    return false;
  }
  const staff = obj.GetFirstAncestor(ClassId.STAFF) as AnyObj | null;
  if (!staff) { LogError('Object does not have a valid parent staff.'); return false; }
  const staffSize = doc.GetDrawingUnit(staffSizeOf(staff));
  const ac = new ClassIdComparison(ClassId.CLEF);
  const page = doc.GetDrawingPage() as AnyObj;
  let clef = page.FindPreviousChild(ac, obj) as AnyObj | null;
  if (!clef) {
    const layer = staff.FindDescendantByType(ClassId.LAYER) as AnyObj | null;
    if (!layer) { LogError('Unable to find layer for staff.'); return false; }
    clef = (typeof layer.GetCurrentClef === 'function' ? layer.GetCurrentClef() : null) as AnyObj | null;
  }
  if (!clef) { LogError('AdjustPitchFromPosition: no clef available.'); return false; }
  const activeClef: AnyObj = clef;
  const staffY: number = staff.GetDrawingY();
  const lineSpacing: number = doc.GetDrawingDoubleUnit(staffSizeOf(staff));
  const lines: number = staff.GetDrawingLines ? staff.GetDrawingLines() : staff.m_drawingLines;
  const clefPosY = Math.round(staffY - (lines - activeClef.GetLine()) * lineSpacing);
  // Local CLEFSHAPE ordinals (clef.ts module-local): G=1 GG=2 F=3 C=4.
  const shape: number = activeClef.GetShape();
  let pname = 1;
  let baseOctave = 4;
  if (shape === 4) { pname = 1; baseOctave = 4; }
  else if (shape === 3) { pname = 4; baseOctave = 3; }
  else if (shape === 1) { pname = 5; baseOctave = 4; }
  else { LogError('Clef %s does not have a valid shape: %s'); return false; }
  const adjustOne = (target: AnyObj): boolean => {
    const pi = getPitchAny(target);
    const fi = target.GetFacsimileInterface() as unknown as {
      HasFacs(): boolean; GetZone(): AnyObj | null;
    } | null;
    if (!pi || !fi || !fi.HasFacs()) {
      LogError('Pitch adjustment failed due to missing interfaces or facsimile data.');
      return false;
    }
    pi.SetPname(pname);
    let octave = baseOctave;
    if (activeClef.GetDis() && activeClef.GetDisPlace()) {
      // Local STAFFREL ordinals: above=1.
      const direction = (activeClef.GetDisPlace() === 1) ? 1 : -1;
      octave += direction * Math.trunc(activeClef.GetDis() / 7);
    }
    pi.SetOct(octave);
    const zone = fi.GetZone();
    if (!zone) { LogError('Pitch adjustment failed due to missing interfaces or facsimile data.'); return false; }
    const toX = view.ToLogicalX ? view.ToLogicalX(zone.GetUlx()) : zone.GetUlx();
    const rotationOffset = staff.GetDrawingRotationOffsetFor(toX);
    const yPos = view.ToLogicalY ? view.ToLogicalY(zone.GetUly()) : zone.GetUly();
    const pitchDifference = Math.round((clefPosY - rotationOffset - yPos) / staffSize);
    pi.AdjustPitchByOffset(-pitchDifference);
    return true;
  };
  if (obj.Is(ClassId.CUSTOS)) return adjustOne(obj);
  const pitchedChildren: VrvObject[] = [];
  obj.FindAllDescendantsByComparison(pitchedChildren, new InterfaceComparison(InterfaceId.INTERFACE_PITCH));
  if (pitchedChildren.length === 0) { LogWarning('Syllable/neume has no pitched children: %s'); return true; }
  for (const child of pitchedChildren) {
    if (!(child as AnyObj).Is(ClassId.LIQUESCENT)) {
      if (!adjustOne(child as AnyObj)) return false;
    }
  }
  return true;
}
  public AdjustClefLineFromPosition(clefIn: unknown, staffIn?: unknown) {
  const clef = clefIn as AnyObj;
  const doc = docOf(this);
  let staff = (staffIn as AnyObj | undefined) ?? null;
  if (!staff) staff = (clef.GetAncestorStaff ? clef.GetAncestorStaff() : clef.GetFirstAncestor(ClassId.STAFF)) as AnyObj;
  if (!clef.HasFacs() || !staff.HasFacs()) return false;
  const staffSize: number = doc.GetDrawingDoubleUnit(staffSizeOf(staff));
  const cz = getZoneAny(clef);
  const sz = getZoneAny(staff);
  if (!cz || !sz) return false;
  const yDiff = cz.GetUly() - sz.GetUly()
    + (cz.GetUlx() - sz.GetUlx()) * Math.tan(staff.GetDrawingRotation() * Math.PI / 180.0);
  const lines: number = staff.GetDrawingLines ? staff.GetDrawingLines() : staff.m_drawingLines;
  clef.SetLine(lines - Math.round(yDiff / staffSize));
  return true;
}

  // --- Parse helpers (C++ Parse*Action out-params as return objects) ---
  public ParseAddSylAction(p: Record<string, unknown>): { elementId: string; sylText: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) return null;
    const sylText = strVal(p.sylText);
    if (sylText === null) return null;
    return { elementId, sylText };
  }
  public ParseDragAction(p: Record<string, unknown>): { elementId: string; x: number; y: number } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) return null;
    const x = numVal(p.x);
    if (x === null) return null;
    const y = numVal(p.y);
    if (y === null) return null;
    return { elementId, x, y };
  }
  public ParseInsertCoordsAction(p: Record<string, unknown>): {
    elementType: string; staffId: string; ulx: number; uly: number; lrx: number; lry: number; attributes: NeumeAttrPair[];
  } | null {
    const elementType = strVal(p.elementType);
    if (elementType === null) return null;
    const staffId = strVal(p.staffId);
    if (staffId === null) return null;
    const ulx = numVal(p.ulx);
    if (ulx === null) return null;
    const uly = numVal(p.uly);
    if (uly === null) return null;
    const attributes: NeumeAttrPair[] = [];
    const attrs = objVal(p.attributes);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        const v = strVal(attrs[k]);
        if (v !== null) attributes.push([k, v]);
      }
    }
    if (elementType !== 'staff') {
      const lrx = numVal(p.lrx);
      const lry = numVal(p.lry);
      return { elementType, staffId, ulx, uly, lrx: lrx ?? -1, lry: lry ?? -1, attributes };
    }
    const lrx = numVal(p.lrx);
    if (lrx === null) return null;
    const lry = numVal(p.lry);
    if (lry === null) return null;
    return { elementType, staffId, ulx, uly, lrx, lry, attributes };
  }
  public ParseIdAction(p: Record<string, unknown>): string | null {
    const v = strVal(p.elementId);
    return v;
  }
  public ParseIdsAction(p: Record<string, unknown>): string[] | null {
    if (!Array.isArray(p.elementIds)) return null;
    const out: string[] = [];
    for (const item of p.elementIds as unknown[]) {
      if (typeof item !== 'string') return out;
      out.push(item);
    }
    return out;
  }
  public ParseDisplaceClefAction(p: Record<string, unknown>): { elementId: string; direction: string } | null {
    const elementId = strVal(p.elementId);
    const direction = strVal(p.direction);
    if (elementId === null || direction === null) return null;
    return { elementId, direction };
  }
  public ParseSetAction(p: Record<string, unknown>): { elementId: string; attrType: string; attrValue: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) { LogWarning("Could not parse 'elementId'"); return null; }
    const attrType = strVal(p.attrType);
    if (attrType === null) { LogWarning("Could not parse 'attrType'"); return null; }
    const attrValue = strVal(p.attrValue);
    if (attrValue === null) { LogWarning("Could not parse 'attrValue'"); return null; }
    return { elementId, attrType, attrValue };
  }
  public ParseSetTextAction(p: Record<string, unknown>): { elementId: string; text: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) { LogWarning("Could not parse 'elementId'"); return null; }
    const text = strVal(p.text);
    if (text === null) { LogWarning("Could not parse 'text'"); return null; }
    return { elementId, text };
  }
  public ParseSetClefAction(p: Record<string, unknown>): { elementId: string; shape: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) { LogWarning("Could not parse 'elementId'"); return null; }
    const shape = strVal(p.shape);
    if (shape === null) { LogWarning("Could not parse 'shape'"); return null; }
    return { elementId, shape };
  }
  public ParseSetLiquescentAction(p: Record<string, unknown>): { elementId: string; shape: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) { LogWarning("Could not parse 'elementId'"); return null; }
    const shape = strVal(p.curve);
    if (shape === null) { LogWarning("Could not parse 'curve'"); return null; }
    return { elementId, shape };
  }
  public ParseSetAquitanianElementAction(p: Record<string, unknown>): { elementId: string; shape: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) { LogWarning("Could not parse 'elementId'"); return null; }
    const shape = strVal(p.shape);
    if (shape === null) { LogWarning("Could not parse 'shape'"); return null; }
    return { elementId, shape };
  }
  public ParseSplitAction(p: Record<string, unknown>): { elementId: string; x: number } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) { LogWarning("Could not parse 'elementId'."); return null; }
    const x = numVal(p.x);
    if (x === null) { LogWarning("Could not parse 'x'."); return null; }
    return { elementId, x };
  }
  public ParseSplitNeumeAction(p: Record<string, unknown>): { elementId: string; ncId: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) { LogWarning("Could not parse 'elementId'."); return null; }
    const ncId = strVal(p.ncId);
    if (ncId === null) { LogWarning("Could not parse 'ncId'."); return null; }
    return { elementId, ncId };
  }
  public ParseChangeGroupAction(p: Record<string, unknown>): { elementId: string; contour: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) return null;
    const contour = strVal(p.contour);
    if (contour === null) return null;
    return { elementId, contour };
  }
  public ParseChangeStaffToAction(p: Record<string, unknown>): { elementId: string; staffId: string } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) return null;
    const staffId = strVal(p.staffId);
    if (staffId === null) return null;
    return { elementId, staffId };
  }
  public ParseGroupAction(p: Record<string, unknown>): { groupType: string; elementIds: string[] } | null {
    const groupType = strVal(p.groupType);
    if (groupType === null) return null;
    const elementIds = this.ParseIdsAction(p);
    if (elementIds === null) return null;
    return { groupType, elementIds };
  }
  public ParseResizeAction(p: Record<string, unknown>): {
    elementId: string; ulx: number; uly: number; lrx: number; lry: number;
  } | null {
    const elementId = strVal(p.elementId);
    if (elementId === null) return null;
    const ulx = numVal(p.ulx);
    if (ulx === null) return null;
    const uly = numVal(p.uly);
    if (uly === null) return null;
    const lrx = numVal(p.lrx);
    if (lrx === null) return null;
    const lry = numVal(p.lry);
    if (lry === null) return null;
    return { elementId, ulx, uly, lrx, lry };
  }
  public ParseResizeRotateAction(p: Record<string, unknown>): {
    elementId: string; ulx: number; uly: number; lrx: number; lry: number; rotate: number;
  } | null {
    const base = this.ParseResizeAction(p);
    if (!base) return null;
    const rotate = numVal(p.rotate);
    if (rotate === null) return null;
    return { ...base, rotate };
  }
  // --- Canonical C++-named wrappers (delegate to the TS aliases above) ---
  // C++ ParseInsertAction 7-arg coords overload == ParseInsertCoordsAction.
  public ParseInsertAction(p: Record<string, unknown>): {
    elementType: string; staffId: string; ulx: number; uly: number; lrx: number; lry: number; attributes: NeumeAttrPair[];
  } | null {
    return this.ParseInsertCoordsAction(p);
  }
  // C++ ParseInsertAction 3-arg (startid/endid) overload: dead in-tree (zero callers); kept for header parity.
  public ParseInsertSpanAction(p: Record<string, unknown>): { elementType: string; startId: string; endId: string } | null {
    const elementType = strVal(p.elementType);
    if (elementType === null) return null;
    const startId = strVal(p.startid);
    if (startId === null) return null;
    const endId = strVal(p.endid);
    if (endId === null) return null;
    return { elementType, startId, endId };
  }
  public ParseInsertToSyllableAction(p: Record<string, unknown>): string | null { return this.ParseIdAction(p); }
  public ParseMoveOutsideSyllableAction(p: Record<string, unknown>): string | null { return this.ParseIdAction(p); }
  public ParseMatchHeightAction(p: Record<string, unknown>): string | null { return this.ParseIdAction(p); }
  public ParseMergeAction(p: Record<string, unknown>): string[] | null { return this.ParseIdsAction(p); }
  public ParseRemoveAction(p: Record<string, unknown>): string | null { return this.ParseIdAction(p); }
  public ParseUngroupAction(p: Record<string, unknown>): { groupType: string; elementIds: string[] } | null {
    return this.ParseGroupAction(p);
  }
  public ParseToggleLigatureAction(p: Record<string, unknown>): string[] | null { return this.ParseIdsAction(p); }
  public ParseToggleNeumeConnectionAction(p: Record<string, unknown>): string[] | null { return this.ParseIdsAction(p); }
  public ParseChangeStaffAction(p: Record<string, unknown>): string | null { return this.ParseIdAction(p); }
}

export { JsonxxArray };
