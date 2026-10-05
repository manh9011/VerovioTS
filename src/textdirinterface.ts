import { Interface } from './interface.js';
import { InterfaceId } from './vrvdef.js';

export enum StaffRel {
  NONE = 0,
  above,
  below,
  between,
  within,
  MAX,
}

class AttPlacementRelStaff {
  private m_place = StaffRel.NONE;
  ResetPlacementRelStaff(): void { this.m_place = StaffRel.NONE; }
  SetPlace(v: StaffRel): void { this.m_place = v; }
  GetPlace(): StaffRel { return this.m_place; }
  HasPlace(): boolean { return this.m_place !== StaffRel.NONE; }
}

export enum HorizontalAlignment {
  NONE = 0, left, right, center, justify, MAX,
}

export interface TextDirChildLike { GetHalign?(): HorizontalAlignment; }
export interface TextDirObjectLike {
  GetDescendantCount(classId: number): number;
  GetChildren(): readonly TextDirChildLike[];
}

const ATT_PLACEMENTRELSTAFF = 186;
const LB = 110;

export class TextDirInterface extends Interface {
  private readonly placementRelStaff = new AttPlacementRelStaff();
  constructor() {
    super();
    this.RegisterInterfaceAttClass(ATT_PLACEMENTRELSTAFF);
    this.Reset();
  }
  override Reset(): void { this.placementRelStaff.ResetPlacementRelStaff(); }
  ResetPlacementRelStaff(): void { this.placementRelStaff.ResetPlacementRelStaff(); }
  override IsInterface(): InterfaceId { return InterfaceId.INTERFACE_TEXT_DIR; }
  SetPlace(v: StaffRel): void { this.placementRelStaff.SetPlace(v); }
  GetPlace(): StaffRel { return this.placementRelStaff.GetPlace(); }
  HasPlace(): boolean { return this.placementRelStaff.HasPlace(); }
  GetNumberOfLines(object: TextDirObjectLike): number {
    if (!object) throw new Error('TextDirInterface.GetNumberOfLines requires object');
    return object.GetDescendantCount(LB) + 1;
  }
  AreChildrenAlignedTo(object: TextDirObjectLike, alignment: HorizontalAlignment): boolean {
    const children = object.GetChildren();
    return children.some(child => child.GetHalign?.() === alignment);
  }
}
