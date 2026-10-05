import { BoundingBox } from './boundingbox';
import { Accessor } from './vrvdef';
import { BezierCurve, Point } from './devicecontextbase';
import { ClassId, VRV_UNSET, STAFFREL_above, STAFFREL_below, STAFFREL_within, STAFFREL_between, CURVEDIR_above, CURVEDIR_none } from './vrvdef';
import { StaffSearch } from './layerelement';
import { VrvObject } from './object';

export interface FloatingPositionerAlignmentLike {
  GetCorrespFloatingPositioner?(object: FloatingObject): FloatingPositioner | null;
  GetStaffSize?(): number;
  GetStaff?(): { GetN(): number; m_drawingLines?: number } | null;
  GetStaffHeight?(): number;
  CalcOverflowAbove?(bbox: BoundingBox): number;
  CalcOverflowBelow?(bbox: BoundingBox): number;
}
export interface StaffYAlignmentLike {
  GetStaff?(): unknown;
  GetYRel?(): number;
  SetYRel?(y: number): void;
  SetTopMargin?(y: number): void;
  SetBottomMargin?(y: number): void;
  IsStaffAbove?(): boolean;
  IsStaffBelow?(): boolean;
}
export interface FloatingObjectDocLike {
  GetDrawingUnit?(staffSize: number): number;
  GetStaffDistance?(object: FloatingObject, staffIndex: number, place: number): { HasValue(): boolean; GetType(): number; GetPx(): number; GetVu(): number };
  GetBottomMargin?(classId: number): number;
  GetTopMargin?(classId: number): number;
}
export interface FloatingPositionerObjectLike {
  GetPlace?(): number;
  GetLayerPlace?(fallback: number): number;
  GetDisPlace?(): number;
  IsExtenderElement?(): boolean;
  SetMaxDrawingYRel?(y: number, place: number): void;
  GetMaxDrawingYRel?(): number;
  GetTurnHeight?(doc: FloatingObjectDocLike, staffSize: number): number;
  GetStart?(): VrvObject | null;
  GetEnd?(): VrvObject | null;
  GetTimeSpanningInterface?(): { GetStart(): VrvObject | null; GetEnd(): VrvObject | null } | null;
}
export interface CurveSpannedElementLike extends CurveSpannedElement {}

export type StaffAlignmentLike = FloatingPositionerAlignmentLike & StaffYAlignmentLike;

function invariant(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

export class CurveSpannedElement {
  public m_rotatedPoints: Point[] = [new Point(0,0),new Point(0,0),new Point(0,0),new Point(0,0)];
  public m_boundingBox: BoundingBox | null = null;
  public m_discarded = false;
  public m_isBelow = true;
}

export class FloatingObject extends VrvObject {
  private static s_drawingObjectIds: unknown[] = [];
  private m_currentPositioner: FloatingPositioner | null = null;
  private m_drawingGrpId = 0;
  private m_maxDrawingYRel = VRV_UNSET;

  public constructor(classId: number = ClassId.FLOATING_OBJECT) {
    super(classId);
    this.Reset();
  }
  public Reset(): void { super.Reset(); this.ResetDrawing(); this.m_drawingGrpId = 0; }
  public ResetDrawing(): void { this.m_currentPositioner = null; this.m_maxDrawingYRel = VRV_UNSET; }
  public UpdateContentBBoxX(x1:number,x2:number):void { this.m_currentPositioner?.UpdateContentBBoxX(x1,x2); }
  public UpdateContentBBoxY(y1:number,y2:number):void { this.m_currentPositioner?.UpdateContentBBoxY(y1,y2); }
  public UpdateSelfBBoxX(x1:number,x2:number):void { this.m_currentPositioner?.UpdateSelfBBoxX(x1,x2); }
  public UpdateSelfBBoxY(y1:number,y2:number):void { this.m_currentPositioner?.UpdateSelfBBoxY(y1,y2); }
  public GetDrawingX():number { return this.m_currentPositioner ? this.m_currentPositioner.GetDrawingX() : 0; }
  public GetDrawingY():number { return this.m_currentPositioner ? this.m_currentPositioner.GetDrawingY() : 0; }
  public SetCurrentFloatingPositioner(p:FloatingPositioner|null):void { this.m_currentPositioner=p; }
  public GetCurrentFloatingPositioner():FloatingPositioner|null { return this.m_currentPositioner; }
  public GetCorrespFloatingPositioner(object:FloatingObject|null):FloatingPositioner|null { if (!object || !this.m_currentPositioner) return null; return this.m_currentPositioner.GetAlignment()?.GetCorrespFloatingPositioner?.(object) ?? null; }
  public GetDrawingGrpId():number{return this.m_drawingGrpId;}
  public SetDrawingGrpId(id:number):void{this.m_drawingGrpId=id;}
  public SetDrawingGrpObject(o:unknown):number { invariant(o!=null,'FloatingObject::SetDrawingGrpObject requires a non-null object'); const i=FloatingObject.s_drawingObjectIds.indexOf(o); const idx=i<0?(FloatingObject.s_drawingObjectIds.push(o)-1):i; this.m_drawingGrpId=idx+1000; return this.m_drawingGrpId; }
  public ResetMaxDrawingYRel():void{this.m_maxDrawingYRel=VRV_UNSET;}
  public SetMaxDrawingYRel(y:number,place:number):void{if(place===STAFFREL_above){if(this.m_maxDrawingYRel===VRV_UNSET||this.m_maxDrawingYRel>y)this.m_maxDrawingYRel=y;}else if(this.m_maxDrawingYRel===VRV_UNSET||this.m_maxDrawingYRel<y)this.m_maxDrawingYRel=y;}
  public GetMaxDrawingYRel():number{return this.m_maxDrawingYRel;}
  public ResetDrawingObjectIDs():void{FloatingObject.s_drawingObjectIds=[];}
  public IsExtenderElement():boolean{return false;}
  public IsCloserToStaffThan(_other:FloatingObject,_place:number):boolean{return false;}
  public GetVerticalContentBoundaryRel(_doc:FloatingObjectDocLike|null,positioner:FloatingPositioner,_bbox:BoundingBox|null,contentTop:boolean):[number,boolean]{ invariant(positioner!=null,'positioner required'); return [contentTop?positioner.GetContentY2():positioner.GetContentY1(),false]; }
  public Accept(functor:any):any { return functor.VisitFloatingObject(this); }
  public AcceptEnd(functor:any):any { return functor.VisitFloatingObjectEnd(this); }
}

export class FloatingPositioner extends BoundingBox {
  protected m_objectX: VrvObject | null = null;
  protected m_objectY: VrvObject | null = null;
  protected m_drawingXRel = 0;
  protected m_drawingYRel = 0;
  protected m_drawingExtenderWidth = 0;
  protected m_object: FloatingObject;
  protected m_alignment: FloatingPositionerAlignmentLike;
  protected m_place = 0;
  public m_spanningType: any;

  public constructor(object:FloatingObject,alignment:FloatingPositionerAlignmentLike,spanningType:any){super(); invariant(!!object,'FloatingPositioner object required'); invariant(!!alignment,'FloatingPositioner alignment required'); this.m_object=object;this.m_alignment=alignment;this.m_spanningType=spanningType;this.m_place=this.defaultPlace(object);this.ResetPositioner();}
  private defaultPlace(object:FloatingObject):number {
    const p=object as unknown as FloatingPositionerObjectLike;
    const explicit=()=>p.GetPlace?.() ?? 0;
    switch(object.GetClassId()) {
      case ClassId.ACCID_FLOATING: case ClassId.ANNOTSCORE: case ClassId.BRACKETSPAN: case ClassId.FERMATA: case ClassId.FING: case ClassId.REH: case ClassId.TEMPO: case ClassId.ENDING: case ClassId.PITCHINFLECTION: return explicit() || STAFFREL_above;
      // C++ falls back to GetLayerPlace (stem-direction aware), not plain above.
      case ClassId.MORDENT: case ClassId.ORNAM: case ClassId.REPEATMARK: case ClassId.TRILL: case ClassId.TURN: { const place = explicit(); if (place) return place; return p.GetLayerPlace?.(STAFFREL_above) ?? STAFFREL_above; }
      case ClassId.HARM: { const place = explicit(); if (place) return place; const first = (object as unknown as { GetFirst?(): { Is?(id: number): boolean } | null }).GetFirst?.(); if (first && first.Is && first.Is(ClassId.FB)) return STAFFREL_below; return STAFFREL_above; }
      case ClassId.BREATH: case ClassId.CPMARK: case ClassId.FING: return explicit() || STAFFREL_above;
      case ClassId.CAESURA: return explicit() || STAFFREL_within;
      case ClassId.DIR: case ClassId.DYNAM: case ClassId.HAIRPIN: case ClassId.PEDAL: return explicit() || STAFFREL_below;
      case ClassId.OCTAVE: return p.GetDisPlace?.()===1 ? STAFFREL_above : STAFFREL_below;
      default: return 0;
    }
  }
  public GetClassId():number{return ClassId.FLOATING_POSITIONER;}
  public ResetPositioner():void{this.ResetBoundingBox();this.ResetCachedDrawingX();this.ResetCachedDrawingY();this.m_objectX=null;this.m_objectY=null;this.m_drawingYRel=0;this.m_drawingXRel=0;this.m_drawingExtenderWidth=0;}
  public GetDrawingX():number{invariant(!!this.m_objectX,'FloatingPositioner objectX required');return this.m_objectX.GetDrawingX()+this.m_drawingXRel;}
  public GetDrawingY():number{invariant(!!this.m_objectY,'FloatingPositioner objectY required');return this.m_objectY.GetDrawingY()-this.m_drawingYRel;}
  public ResetCachedDrawingX():void{this.m_cachedDrawingX=VRV_UNSET;}
  public ResetCachedDrawingY():void{this.m_cachedDrawingY=VRV_UNSET;}
  public SetObjectXY(x:VrvObject,y:VrvObject):void{invariant(!!x&&!!y,'FloatingPositioner object XY required');this.m_objectX=x;this.m_objectY=y;}
  public GetObjectX(){return this.m_objectX;} public GetObjectY(){return this.m_objectY;}
  public GetObject(){return this.m_object;} public GetAlignment(){return this.m_alignment;}
  public GetSpanningType(){return this.m_spanningType;} public GetDrawingPlace(){return this.m_place;}
  public GetDrawingYRel(){return this.m_drawingYRel;} public GetDrawingXRel(){return this.m_drawingXRel;} public GetDrawingExtenderWidth(){return this.m_drawingExtenderWidth;}
  public SetDrawingExtenderWidth(v:number){this.m_drawingExtenderWidth=v;}
  public SetDrawingXRel(v:number){this.ResetCachedDrawingX();this.m_drawingXRel=v;}
  public SetDrawingYRel(v:number,force=false){let set=force;if(this.m_place===STAFFREL_above){if(v<this.m_drawingYRel)set=true;}else if(v>this.m_drawingYRel)set=true;if(set){this.ResetCachedDrawingY();this.m_drawingYRel=v;}}
  public HasHorizontalOverlapWith(bbox:BoundingBox,unit:number):boolean{invariant(!!bbox,'bbox required');const ext=bbox instanceof FloatingPositioner?bbox.GetDrawingExtenderWidth():0;const margin=this.GetAdmissibleHorizOverlapMargin(bbox,unit);if(!this.HasContentBB()||!bbox.HasContentBB())return false;if(this.GetContentRight()+this.m_drawingExtenderWidth<=bbox.GetContentLeft()-margin)return false;if(this.GetContentLeft()>=bbox.GetContentRight()+ext+margin)return false;return true;}
  public GetAdmissibleHorizOverlapMargin(bbox:BoundingBox,unit:number):number{const el=bbox as unknown as { IsLayerElement?:()=>boolean; GetFirstAncestor?:(id:number)=>unknown } | null;if(el&&typeof el.IsLayerElement==='function'&&el.IsLayerElement()){const obj=this.m_object as unknown as { IsExtenderElement?:()=>boolean; Is?:(id:number)=>boolean };if(obj&&typeof obj.IsExtenderElement==='function'&&obj.IsExtenderElement())return 8*unit;if(obj&&typeof obj.Is==='function'&&obj.Is(ClassId.DYNAM)&&el.GetFirstAncestor&&el.GetFirstAncestor(ClassId.BEAM))return 2*unit;}return 0;}
  // C++ FloatingPositioner::CalcDrawingYRel (floatingobject.cpp:461-583).
  // bbox==null: base position from content bbox + margins, clamped by staff distance.
  // bbox!=null: collision shift vs curve/beam via Intersects, else overflow-based push.
  public CalcDrawingYRel(doc:FloatingObjectDocLike,staffAlignment:FloatingPositionerAlignmentLike,horizOverlappingBBox:BoundingBox|null):void {
    invariant(!!doc,'CalcDrawingYRel doc required');
    invariant(!!staffAlignment,'CalcDrawingYRel staffAlignment required');
    const staffSize=staffAlignment.GetStaffSize?.() ?? 0;
    const unit=doc.GetDrawingUnit?.(staffSize) ?? 0;
    let yRel=0;
    if(horizOverlappingBBox==null){
      const staffIndex=staffAlignment.GetStaff?.()?.GetN() ?? 0;
      let minStaffDistance=0;
      const measurement=doc.GetStaffDistance?.(this.m_object,staffIndex,this.m_place);
      if(measurement&&measurement.HasValue()){
        // MEASUREMENTTYPE_px == 2 (atttypes.h); local constant as in bracketspan.ts to avoid import cycle.
        const MEASUREMENTTYPE_px=2;
        minStaffDistance=measurement.GetType()===MEASUREMENTTYPE_px?measurement.GetPx():Math.trunc(measurement.GetVu()*unit);
      }
      const staff=staffAlignment.GetStaff?.();
      if(staff&&staff.m_drawingLines===1) minStaffDistance=Math.trunc(minStaffDistance+2.5*unit);
      if(this.m_place===STAFFREL_above){
        yRel=this.GetContentY1();
        yRel=Math.trunc(yRel-(doc.GetBottomMargin?.(this.m_object.GetClassId())??0)*unit);
        this.SetDrawingYRel(yRel);
        this.SetDrawingYRel(-minStaffDistance);
      }
      else if(this.m_place===STAFFREL_within){
        yRel=Math.trunc((staffAlignment.GetStaffHeight?.() ?? 0)/2);
        if(this.m_object.GetClassId()===ClassId.TURN){
          const turn=this.m_object as unknown as { GetTurnHeight(doc:FloatingObjectDocLike,staffSize:number):number };
          yRel+=Math.trunc(turn.GetTurnHeight(doc,staffSize)/2);
        }
        else if(!this.m_object.IsAnyOf([ClassId.CPMARK,ClassId.DIR,ClassId.HAIRPIN])){
          yRel+=Math.trunc((this.GetContentY2()-this.GetContentY1())/2);
        }
        this.SetDrawingYRel(yRel);
      }
      else {
        yRel=(staffAlignment.GetStaffHeight?.() ?? 0)+this.GetContentY2();
        yRel=Math.trunc(yRel+(doc.GetTopMargin?.(this.m_object.GetClassId())??0)*unit);
        this.SetDrawingYRel(yRel);
        this.SetDrawingYRel(minStaffDistance+(staffAlignment.GetStaffHeight?.() ?? 0));
      }
      return;
    }
    const curve=horizOverlappingBBox instanceof FloatingCurvePositioner?horizOverlappingBBox:null;
    const margin=Math.trunc((doc.GetBottomMargin?.(this.m_object.GetClassId())??0)*unit);
    const [staffSideContentBoundary,hasRefinedContentBoundary]=this.GetVerticalContentBoundaryRel(doc,horizOverlappingBBox,this.m_place!==STAFFREL_above);
    if(!hasRefinedContentBoundary){
      if(curve&&curve.GetObject()&&curve.GetObject()!.IsAnyOf([ClassId.LV,ClassId.PHRASE,ClassId.SLUR,ClassId.TIE])){
        const shift=this.Intersects(curve,Accessor.CONTENT,margin);
        if(shift!==0)this.SetDrawingYRel(this.GetDrawingYRel()-shift);
        return;
      }
      else if(horizOverlappingBBox.Is(ClassId.BEAM)){
        const shift=this.IntersectsBeam(horizOverlappingBBox as never,Accessor.CONTENT,margin);
        if(shift!==0)this.SetDrawingYRel(this.GetDrawingYRel()-shift);
        return;
      }
    }
    const overlappingObject=horizOverlappingBBox as unknown as Partial<VrvObject>;
    const isLayerElement=typeof overlappingObject.IsLayerElement==='function'&&overlappingObject.IsLayerElement()===true;
    if(this.m_place===STAFFREL_above){
      const overflow=(staffAlignment as { CalcOverflowAbove?(b:BoundingBox): number }).CalcOverflowAbove?.(horizOverlappingBBox) ?? 0;
      yRel=-overflow+staffSideContentBoundary-margin;
      if(isLayerElement){
        if(yRel<0)this.SetDrawingYRel(yRel);
      }
      else if(this.HasVerticalContentOverlap(doc,horizOverlappingBBox,margin)){
        this.SetDrawingYRel(yRel);
      }
    }
    else {
      const overflow=(staffAlignment as { CalcOverflowBelow?(b:BoundingBox): number }).CalcOverflowBelow?.(horizOverlappingBBox) ?? 0;
      yRel=overflow+(staffAlignment.GetStaffHeight?.() ?? 0)+staffSideContentBoundary+margin;
      if(isLayerElement){
        if(yRel>0)this.SetDrawingYRel(yRel);
      }
      else if(this.HasVerticalContentOverlap(doc,horizOverlappingBBox,margin)){
        this.SetDrawingYRel(yRel);
      }
    }
  }
  public AdjustExtenders():void{const isExt=(this.m_object.GetClassId()===ClassId.DIR||this.m_object.GetClassId()===ClassId.DYNAM||this.m_object.GetClassId()===ClassId.TEMPO)&&!!this.m_object.IsExtenderElement?.();if(!isExt)return;this.m_object.SetMaxDrawingYRel(this.m_drawingYRel,this.m_place);this.SetDrawingYRel(this.m_object.GetMaxDrawingYRel());}
  public GetSpaceBelow(doc:FloatingObjectDocLike,staffAlignment:FloatingPositionerAlignmentLike,_bbox:BoundingBox):number{if(this.m_place!==STAFFREL_between)return VRV_UNSET;const staffSize=staffAlignment.GetStaffSize?.() ?? 0;const unit=doc.GetDrawingUnit?.(staffSize) ?? 0;const margin=Math.trunc((doc.GetBottomMargin?.(this.m_object.GetClassId()) ?? 0)*unit);return this.GetContentBottom()-_bbox.GetSelfTop()-margin;}
  public GetVerticalContentBoundaryRel(doc:FloatingObjectDocLike,bbox:BoundingBox|null,contentTop:boolean){return this.m_object.GetVerticalContentBoundaryRel(doc,this,bbox,contentTop);}
  public GetVerticalContentBoundary(doc:FloatingObjectDocLike,bbox:BoundingBox|null,contentTop:boolean){return this.GetDrawingY()+this.GetVerticalContentBoundaryRel(doc,bbox,contentTop)[0];}
  public HasVerticalContentOverlap(doc:FloatingObjectDocLike,bbox:BoundingBox,margin:number):boolean{if(!this.HasContentBB()||!bbox.HasContentBB())return false;const top=this.GetVerticalContentBoundary(doc,bbox,true),bottom=this.GetVerticalContentBoundary(doc,bbox,false);const other=bbox instanceof FloatingPositioner?bbox.GetVerticalContentBoundary(doc,this,true):bbox.GetContentTop();const otherBottom=bbox instanceof FloatingPositioner?bbox.GetVerticalContentBoundary(doc,this,false):bbox.GetContentBottom();return !(top<=otherBottom-margin||bottom>=other+margin);}
  public GetPoints(){return [] as Point[];} public GetThickness(){return 0;} public GetDir(){return CURVEDIR_none;}
  public CalcMinMaxY(_p:Point[]){return 0;}
}

export class FloatingCurvePositioner extends FloatingPositioner {
  private m_points:Point[]=[new Point(0,0),new Point(0,0),new Point(0,0),new Point(0,0)];
  private m_thickness=0; private m_dir=CURVEDIR_none; private m_crossStaff:VrvObject|null=null;
  private m_spannedElements:CurveSpannedElement[]=[]; private m_cachedMinMaxY=VRV_UNSET; private m_cachedX12:[number,number]=[VRV_UNSET,VRV_UNSET]; private m_requestedStaffSpace=0;
  public GetClassId(){return ClassId.FLOATING_CURVE_POSITIONER;}
  public ResetPositioner(){super.ResetPositioner();this.ResetCurveParams();}
  public ResetCurveParams(){this.m_points=[new Point(0,0),new Point(0,0),new Point(0,0),new Point(0,0)];this.m_thickness=0;this.m_dir=CURVEDIR_none;this.m_crossStaff=null;this.m_cachedMinMaxY=VRV_UNSET;this.m_cachedX12=[VRV_UNSET,VRV_UNSET];this.m_requestedStaffSpace=0;this.ClearSpannedElements();}
  public HasCachedX12(){return this.m_cachedX12[0]!==VRV_UNSET&&this.m_cachedX12[1]!==VRV_UNSET;} public GetCachedX12(){return this.m_cachedX12;} public SetCachedX12(v:[number,number]){this.m_cachedX12=v;}
  public ClearSpannedElements(){this.m_spannedElements=[];} public AddSpannedElement(e:CurveSpannedElement){this.m_spannedElements.push(e);} public GetSpannedElements(){return this.m_spannedElements;}
  public SetCrossStaff(s:VrvObject|null){this.m_crossStaff=s;} public GetCrossStaff(){return this.m_crossStaff;} public IsCrossStaff(){return !!this.m_crossStaff;}
  public SetRequestedStaffSpace(s:number){this.m_requestedStaffSpace=s;} public GetRequestedStaffSpace(){return this.m_requestedStaffSpace;}
  public UpdateCurveParams(points:Point[],thickness:number,dir:number){this.m_points=points.map(p=>new Point(p.x,p.y));const y=this.GetDrawingY();for(const p of this.m_points)p.y-=y;this.m_thickness=thickness;this.m_dir=dir;this.m_cachedMinMaxY=VRV_UNSET;}
  public UpdatePoints(bezier:BezierCurve){this.UpdateCurveParams([bezier.p1,bezier.c1,bezier.c2,bezier.p2],this.m_thickness,this.m_dir);}
  public MoveFrontHorizontal(d:number){this.m_points[0].x+=d;this.m_points[1].x+=d;} public MoveBackHorizontal(d:number){this.m_points[2].x+=d;this.m_points[3].x+=d;}
  public MoveFrontVertical(d:number){this.m_points[0].y+=d;this.m_points[1].y+=d;} public MoveBackVertical(d:number){this.m_points[2].y+=d;this.m_points[3].y+=d;}
  public GetPoints(){const y=this.GetDrawingY();return this.m_points.map(p=>new Point(p.x,p.y+y));} public GetThickness(){return this.m_thickness;} public GetDir(){return this.m_dir;}
  public CalcMinMaxY(points:Point[]):number {if(this.m_cachedMinMaxY!==VRV_UNSET)return this.m_cachedMinMaxY;const result=BoundingBox.ApproximateBezierBoundingBox(points,{x:0,y:0},0,0,0,0);this.m_cachedMinMaxY=(this.m_dir===CURVEDIR_above||this.m_dir===1)?result.maxYPos:result.minYPos;return this.m_cachedMinMaxY;}
  public CalcAdjustment(b:BoundingBox,discard:{value:boolean},margin=0,horizontalOverlap=true){return this.CalcDirectionalAdjustment(b,this.m_dir===CURVEDIR_above||this.m_dir===1,discard,margin,horizontalOverlap);}
  public CalcDirectionalAdjustment(b:BoundingBox,isAbove:boolean,discard:{value:boolean},margin=0,horizontalOverlap=true){const [l,r]=this.CalcDirectionalLeftRightAdjustment(b,isAbove,discard,margin,horizontalOverlap);return Math.max(l,r);}
  public CalcLeftRightAdjustment(b:BoundingBox,discard:{value:boolean},margin=0,horizontalOverlap=true){return this.CalcDirectionalLeftRightAdjustment(b,this.m_dir===CURVEDIR_above||this.m_dir===1,discard,margin,horizontalOverlap);}
  public CalcDirectionalLeftRightAdjustment(b:BoundingBox,isAbove:boolean,discard:{value:boolean},margin=0,horizontalOverlap=true):[number,number]{invariant(b.HasSelfBB(),'bbox self BB required');const p=this.GetPoints(),p1=p[0],p2=p[3];if(horizontalOverlap){if(p2.x<b.GetSelfLeft()-margin||p1.x>b.GetSelfRight()+margin){return [0,0];}}const top:Point[]=[],bottom:Point[]=[];BoundingBox.CalcThickBezier(p,this.m_thickness,top,bottom);let leftY=0,rightY=0;const useCutOut=(this.m_object&&(this.m_object.Is(ClassId.PHRASE)||this.m_object.Is(ClassId.SLUR))&&b.Is(ClassId.ACCID));const cutRes=useCutOut?(this.m_object as unknown as { GetDocResources?:()=>{ GetGlyph(n:number):unknown } }).GetDocResources?.():null;if(isAbove){if(p1.x<b.GetSelfLeft()&&p2.x>b.GetSelfRight()){leftY=BoundingBox.CalcBezierAtPosition(bottom,b.GetSelfLeft())-margin;rightY=BoundingBox.CalcBezierAtPosition(bottom,b.GetSelfRight())-margin;}else if(p1.x<b.GetSelfLeft()){leftY=BoundingBox.CalcBezierAtPosition(bottom,b.GetSelfLeft())-margin;rightY=p2.y-margin;}else if(p2.x>b.GetSelfRight()){leftY=p1.y-margin;rightY=BoundingBox.CalcBezierAtPosition(bottom,b.GetSelfRight())-margin;}else{leftY=p1.y-margin;rightY=p2.y-margin;}let boxTopY=b.GetSelfTop();if(useCutOut&&cutRes){try{boxTopY=(b as unknown as { GetCutOutTop(r:unknown):number }).GetCutOutTop(cutRes);}catch(e){}}const la=Math.max(boxTopY-leftY,0),ra=Math.max(boxTopY-rightY,0);discard.value=la===0&&ra===0;return [la,ra];}else{if(p1.x<b.GetSelfLeft()&&p2.x>b.GetSelfRight()){leftY=BoundingBox.CalcBezierAtPosition(top,b.GetSelfLeft())+margin;rightY=BoundingBox.CalcBezierAtPosition(top,b.GetSelfRight())+margin;}else if(p1.x<b.GetSelfLeft()){leftY=BoundingBox.CalcBezierAtPosition(top,b.GetSelfLeft())+margin;rightY=p2.y+margin;}else if(p2.x>b.GetSelfRight()){leftY=p1.y+margin;rightY=BoundingBox.CalcBezierAtPosition(top,b.GetSelfRight())+margin;}else{leftY=p1.y+margin;rightY=p2.y+margin;}let boxBottomY=b.GetSelfBottom();if(useCutOut&&cutRes){try{boxBottomY=(b as unknown as { GetCutOutBottom(r:unknown):number }).GetCutOutBottom(cutRes);}catch(e){}}const la=Math.max(leftY-boxBottomY,0),ra=Math.max(rightY-boxBottomY,0);discard.value=la===0&&ra===0;return [la,ra];}}
  public CalcRequestedStaffSpace(alignment:FloatingPositionerAlignmentLike):[number,number]{const tsi=(this.m_object as unknown as { GetTimeSpanningInterface?:()=>{ GetStart:()=>unknown; GetEnd:()=>unknown } }).GetTimeSpanningInterface?.() ?? null;if(tsi){try{const s=tsi.GetStart() as unknown as { GetAncestorStaff?:(s:number,a:boolean)=>{ GetN():number }|null }|null;const e=tsi.GetEnd() as unknown as { GetAncestorStaff?:(s:number,a:boolean)=>{ GetN():number }|null }|null;const ss=s?.GetAncestorStaff?.(StaffSearch.RESOLVE_CROSS_STAFF,false) ?? null;const es=e?.GetAncestorStaff?.(StaffSearch.RESOLVE_CROSS_STAFF,false) ?? null;if(ss&&es){const sn=ss.GetN(),en=es.GetN();if(sn!==en){const an=alignment.GetStaff?.()?.GetN() ?? 0;if(an===Math.min(sn,en))return [0,this.m_requestedStaffSpace];if(an===Math.max(sn,en))return [this.m_requestedStaffSpace,0];}}}catch(e){}}return [0,0];}
}
