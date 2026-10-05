/**
 * Pure TypeScript translation of Verovio's src/annot.cpp / include/vrv/annot.h.
 * The libMEI attribute classes and TextListInterface are represented by local
 * typed state boundaries until their canonical shared implementations migrate.
 */
import { ObjectFactory, VrvObject } from './object.js';
import { EditorialElement } from './editorial.js';
import { ClassId } from './vrvdef.js';
import { xml_document } from './pugixml.js';

const ATT_PLIST = 187;
const ATT_SOURCE = 198;

class PlistAttributes {
  private plist: string[] = [];
  ResetPlist(): void { this.plist = []; }
  SetPlist(value: string[] | string): void { this.plist = Array.isArray(value) ? [...value] : value.trim() ? value.trim().split(/\s+/) : []; }
  GetPlist(): string[] { return [...this.plist]; }
  HasPlist(): boolean { return this.plist.length > 0; }
}

class SourceAttributes {
  private source = '';
  ResetSource(): void { this.source = ''; }
  SetSource(value: string): void { this.source = value; }
  GetSource(): string { return this.source; }
  HasSource(): boolean { return this.source !== ''; }
}

/** Minimal structural boundary for the unported TextListInterface. */
class TextListState {
  Reset(): void {}
}

export class Annot extends EditorialElement {
  private textList?: TextListState;
  private plist?: PlistAttributes;
  private source?: SourceAttributes;
  public m_content?: xml_document;

  public constructor() {
    super(ClassId.ANNOT);
    this.ensureState();
    this.RegisterAttClass(ATT_PLIST);
    this.RegisterAttClass(ATT_SOURCE);
    this.Reset();
  }

  private ensureState(): void {
    this.textList ??= new TextListState();
    this.plist ??= new PlistAttributes();
    this.source ??= new SourceAttributes();
    this.m_content ??= new xml_document();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureState();
    this.textList!.Reset();
    this.plist!.ResetPlist();
    this.source!.ResetSource();
  }

  public override Clone(): VrvObject {
    const clone = new Annot();
    clone.AssignFrom(this);
    clone.SetPlist(this.GetPlist());
    clone.SetSource(this.GetSource());
    if (this.m_content && clone.m_content) clone.m_content.reset(this.m_content);
    return clone;
  }

  public override GetClassName(): string { return 'annot'; }

  /** C++ IsSupportedChild(): <annot> may contain annot itself or any text element. */
  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.ANNOT) return true;
    return VrvObject.IsTextElement(classId);
  }

  public ResetPlist(): void { this.plist!.ResetPlist(); }
  public SetPlist(value: string[] | string): void { this.plist!.SetPlist(value); }
  public GetPlist(): string[] { return this.plist!.GetPlist(); }
  public HasPlist(): boolean { return this.plist!.HasPlist(); }

  public ResetSource(): void { this.source!.ResetSource(); }
  public SetSource(value: string): void { this.source!.SetSource(value); }
  public GetSource(): string { return this.source!.GetSource(); }
  public HasSource(): boolean { return this.source!.HasSource(); }
}

ObjectFactory.GetInstance().Register('annot', ClassId.ANNOT, () => new Annot());
