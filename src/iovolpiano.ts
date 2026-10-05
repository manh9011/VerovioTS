/**
 * iovolpiano.ts — VolpianoInput port of src-cpp/src/iovolpiano.cpp (157 lines).
 * Real domain objects (Mdiv/Score/Section/Staff/Measure/Layer/Note/Accid/
 * BarLine/StaffGrp/StaffDef/Clef) so LoadData produces a renderable doc.
 */
import { Input, type DocLike } from './iobase.js';
import { LogWarning } from './vrv.js';
import { DocType } from './doc.js';
import { VrvObject } from './object.js';
import { ClassId, MeasureType, VisibilityType } from './vrvdef.js';
import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Staff } from './staff.js';
import { StaffGrp } from './staffgrp.js';
import { StaffDef } from './staffdef.js';
import { Layer } from './layer.js';
import { Measure } from './measure.js';
import { Note } from './note.js';
import { Accid } from './accid.js';
import { BarLine } from './barline.js';
import { Clef } from './clef.js';
import {
  PITCHNAME_a, PITCHNAME_b, PITCHNAME_c, PITCHNAME_d,
  PITCHNAME_e, PITCHNAME_f, PITCHNAME_g,
} from './pitchinterface.js';
import {
  ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_n,
} from './accid.js';

const Raw = DocType.Raw;
const Visible = VisibilityType.Visible;
// atttypes.h: BARMETHOD takt=3; BARRENDITION dbl=3, end=8; CLEFSHAPE G=1.
const BARMETHOD_takt = 3;
const BARRENDITION_dbl = 3;
const BARRENDITION_end = 8;
const CLEFSHAPE_G = 1;
const BOOLEAN_true = 1;

const NOTE_TABLE = new Map<string, readonly [number, number]>([
  ['8', [PITCHNAME_a, 3]], ['9', [PITCHNAME_g, 3]], ['a', [PITCHNAME_a, 3]],
  ['b', [PITCHNAME_b, 3]], ['c', [PITCHNAME_c, 4]], ['d', [PITCHNAME_d, 4]],
  ['e', [PITCHNAME_e, 4]], ['f', [PITCHNAME_f, 4]], ['g', [PITCHNAME_g, 4]],
  ['h', [PITCHNAME_a, 4]], ['j', [PITCHNAME_b, 4]], ['k', [PITCHNAME_c, 5]],
  ['l', [PITCHNAME_d, 5]], ['m', [PITCHNAME_e, 5]], ['n', [PITCHNAME_f, 5]],
  ['o', [PITCHNAME_g, 5]], ['p', [PITCHNAME_a, 5]], ['q', [PITCHNAME_b, 5]],
  ['r', [PITCHNAME_c, 6]], ['s', [PITCHNAME_d, 6]],
]);

const LIQUESCENTS = new Map<string, string>([
  ['(', '8'], [')', '9'], ['A', 'a'], ['B', 'b'], ['C', 'c'], ['D', 'd'], ['E', 'e'],
  ['F', 'f'], ['G', 'g'], ['H', 'h'], ['J', 'j'], ['K', 'k'], ['L', 'l'], ['M', 'm'],
  ['N', 'n'], ['O', 'o'], ['P', 'p'], ['Q', 'q'], ['R', 'r'], ['S', 's'],
]);

interface VolpianoDoc extends DocLike {
  Reset(): void;
  SetType(t: DocType): void;
  AddChild(x: VrvObject): boolean;
  GetFirstScoreDef(): VrvObject;
  ConvertToPageBasedDoc(): void;
}

export class VolpianoInput extends Input {
  public constructor(doc: VolpianoDoc) {
    super(doc);
  }

  public override Import(volpiano: string): boolean {
    const d = this.m_doc as unknown as VolpianoDoc;
    d.Reset();
    d.SetType(Raw);
    const mdiv = new Mdiv();
    mdiv.SetVisibility(Visible);
    d.AddChild(mdiv);
    const score = new Score();
    mdiv.AddChild(score);
    const section = new Section();
    score.AddChild(section);
    const staff = new Staff(1);
    const measure = new Measure(MeasureType.UNMEASURED, 1);
    const layer = new Layer();
    layer.SetN(1);
    staff.AddChild(layer);
    measure.AddChild(staff);
    section.AddChild(measure);

    let accidVal: number = ACCIDENTAL_WRITTEN_NONE;
    for (let ch of volpiano) {
      if (NOTE_TABLE.has(ch) || LIQUESCENTS.has(ch)) {
        const liquescent = LIQUESCENTS.has(ch);
        if (liquescent) ch = LIQUESCENTS.get(ch)!;
        const [pname, oct] = NOTE_TABLE.get(ch)!;
        const note = new Note();
        note.SetPname(pname);
        note.SetOct(oct);
        if (accidVal !== ACCIDENTAL_WRITTEN_NONE) {
          const accid = new Accid();
          accid.SetAccid(accidVal);
          accid.SetAttribute(true);
          note.AddChild(accid);
          accidVal = ACCIDENTAL_WRITTEN_NONE;
        }
        if (liquescent) note.SetCue(BOOLEAN_true);
        layer.AddChild(note);
      }
      else if (ch === 'i' || ch === 'w' || ch === 'x' || ch === 'y' || ch === 'z') {
        accidVal = ACCIDENTAL_WRITTEN_f;
      }
      else if (ch === 'I' || ch === 'W' || ch === 'X' || ch === 'Y' || ch === 'Z') {
        accidVal = ACCIDENTAL_WRITTEN_n;
      }
      else if (ch === '3') {
        layer.AddChild(new BarLine());
      }
      else if (ch === '4') {
        const dbl = new BarLine();
        dbl.SetForm(BARRENDITION_dbl);
        layer.AddChild(dbl);
      }
      else if (ch === '5') {
        const end = new BarLine();
        end.SetForm(BARRENDITION_end);
        layer.AddChild(end);
      }
      else if (ch === '6') {
        LogWarning("Volpiano '6' barline is not supported");
      }
      else if (ch === '7') {
        const takt = new BarLine();
        takt.SetMethod(BARMETHOD_takt);
        layer.AddChild(takt);
      }
    }

    const staffGrp = new StaffGrp();
    const staffDef = new StaffDef();
    staffDef.SetN(1);
    staffDef.SetLines(5);
    const clef = new Clef();
    clef.SetAttribute(true);
    clef.SetLine(2);
    clef.SetShape(CLEFSHAPE_G);
    staffDef.AddChild(clef);
    staffGrp.AddChild(staffDef);
    (d.GetFirstScoreDef() as unknown as VrvObject).AddChild(staffGrp);
    d.ConvertToPageBasedDoc();
    return true;
  }
}
