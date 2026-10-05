import { AttClassId, ClassId, FunctorCode, InterfaceId } from './vrvdef.js';
import { ExtractIDFragment } from './vrv.js';
import { Interface } from './interface.js';

export class LinkingAttributes {
  private m_copyof = '';
  private m_corresp = '';
  private m_follows = '';
  private m_next = '';
  private m_precedes = '';
  private m_prev = '';
  private m_sameas = '';
  private m_synch = '';

  public ResetLinking(): void { this.m_copyof=''; this.m_corresp=''; this.m_follows=''; this.m_next=''; this.m_precedes=''; this.m_prev=''; this.m_sameas=''; this.m_synch=''; }
  public SetCopyof(v:string):void {this.m_copyof=v;} public GetCopyof():string{return this.m_copyof;} public HasCopyof():boolean{return this.m_copyof!=='';}
  public SetCorresp(v:string):void {this.m_corresp=v;} public GetCorresp():string{return this.m_corresp;} public HasCorresp():boolean{return this.m_corresp!=='';}
  public SetFollows(v:string):void {this.m_follows=v;} public GetFollows():string{return this.m_follows;} public HasFollows():boolean{return this.m_follows!=='';}
  public SetNext(v:string):void {this.m_next=v;} public GetNext():string{return this.m_next;} public HasNext():boolean{return this.m_next!=='';}
  public SetPrecedes(v:string):void {this.m_precedes=v;} public GetPrecedes():string{return this.m_precedes;} public HasPrecedes():boolean{return this.m_precedes!=='';}
  public SetPrev(v:string):void {this.m_prev=v;} public GetPrev():string{return this.m_prev;} public HasPrev():boolean{return this.m_prev!=='';}
  public SetSameas(v:string):void {this.m_sameas=v;} public GetSameas():string{return this.m_sameas;} public HasSameas():boolean{return this.m_sameas!=='';}
  public SetSynch(v:string):void {this.m_synch=v;} public GetSynch():string{return this.m_synch;} public HasSynch():boolean{return this.m_synch!=='';}
}

export interface MeasureLike { }
export interface ObjectLike {
  GetFirstAncestor(classId: number, maxDepth?: number): ObjectLike | null;
  GetID(): string;
  GetClassId(): number;
  GetLinkingInterface(): LinkingInterface | null;
  IsAnyOf(ids: readonly number[]): boolean;
  IsControlElement(): boolean;
  HasAttClass(id: number): boolean;
}
export interface PrepareLinkingFunctorLike { IsProcessingData(): boolean; InsertNextIDPair(id:string, owner:LinkingInterface):void; InsertSameasIDPair(id:string, owner:LinkingInterface, object?:ObjectLike):void; }
export interface PrepareStaffCurrentTimeSpanningFunctorLike { InsertTimeSpanningElement(object:ObjectLike):void; }
export interface ResetDataFunctorLike {}

// These IDs are libmei enum ordinals; keep the exact zero-based values from
// libmei/dist/attclasses.h because Interface::GetAttClasses() exposes them.
export const ATT_EXTENDER: AttClassId = 132;
export const ATT_LINKING: AttClassId = 152;
export const BOOLEAN_true = 1;

/** Pure TypeScript translation of vrv::LinkingInterface. */
export class LinkingInterface extends Interface {
  private readonly m_linkingAttributes = new LinkingAttributes();
  private m_next: ObjectLike | null = null;
  private m_nextID = '';
  private m_sameas: ObjectLike | null = null;
  private m_sameasID = '';

  public constructor() { super(); this.RegisterInterfaceAttClass(ATT_LINKING); this.Reset(); }
  public override Reset():void { this.ResetLinking(); this.m_next=null; this.m_nextID=''; this.m_sameas=null; this.m_sameasID=''; }
  public override IsInterface():InterfaceId { return InterfaceId.INTERFACE_LINKING; }
  public ResetLinking():void {this.m_linkingAttributes.ResetLinking();}
  public SetCopyof(value:string):void {this.m_linkingAttributes.SetCopyof(value);} public GetCopyof():string{return this.m_linkingAttributes.GetCopyof();} public HasCopyof():boolean{return this.m_linkingAttributes.HasCopyof();}
  public SetFollows(value:string):void {this.m_linkingAttributes.SetFollows(value);} public GetFollows():string{return this.m_linkingAttributes.GetFollows();} public HasFollows():boolean{return this.m_linkingAttributes.HasFollows();}
  public SetPrecedes(value:string):void {this.m_linkingAttributes.SetPrecedes(value);} public GetPrecedes():string{return this.m_linkingAttributes.GetPrecedes();} public HasPrecedes():boolean{return this.m_linkingAttributes.HasPrecedes();}
  public SetPrev(value:string):void {this.m_linkingAttributes.SetPrev(value);} public GetPrev():string{return this.m_linkingAttributes.GetPrev();} public HasPrev():boolean{return this.m_linkingAttributes.HasPrev();}
  public SetSynch(value:string):void {this.m_linkingAttributes.SetSynch(value);} public GetSynch():string{return this.m_linkingAttributes.GetSynch();} public HasSynch():boolean{return this.m_linkingAttributes.HasSynch();}
  public SetNext(value:string):void {this.m_linkingAttributes.SetNext(value);} public GetNext():string{return this.m_linkingAttributes.GetNext();} public HasNext():boolean{return this.m_linkingAttributes.HasNext();}
  public SetSameas(value:string):void {this.m_linkingAttributes.SetSameas(value);} public GetSameas():string{return this.m_linkingAttributes.GetSameas();} public HasSameas():boolean{return this.m_linkingAttributes.HasSameas();}
  public SetCorresp(value:string):void {this.m_linkingAttributes.SetCorresp(value);} public GetCorresp():string{return this.m_linkingAttributes.GetCorresp();} public HasCorresp():boolean{return this.m_linkingAttributes.HasCorresp();}
  public SetNextLink(next:ObjectLike):void { this.m_next=next; }
  public GetNextLink():ObjectLike|null{return this.m_next;} public HasNextLink():boolean{return this.m_next!==null;}
  // C++ asserts are release-disabled (WASM overwrites silently); match that.
  public SetSameasLink(value:ObjectLike):void { this.m_sameas=value; }
  public GetSameasLink():ObjectLike|null{return this.m_sameas;} public HasSameasLink():boolean{return this.m_sameas!==null;}
  public GetNextMeasure():MeasureLike|null { const next=this.m_next; if(!next)return null; return next.GetFirstAncestor(ClassId.MEASURE) as MeasureLike|null; }
  public AddBackLink(object:ObjectLike):void { const linking=object.GetLinkingInterface(); let corresp='#'+object.GetID(); if(linking?.HasCorresp()) corresp=linking.GetCorresp(); this.SetCorresp(corresp); }
  protected SetIDStr():void { if(this.HasNext()) this.m_nextID=ExtractIDFragment(this.GetNext()); if(this.HasSameas()) this.m_sameasID=ExtractIDFragment(this.GetSameas()); }
  public InterfacePrepareLinking(functor:PrepareLinkingFunctorLike,object:ObjectLike):FunctorCode { if(functor.IsProcessingData()) return FunctorCode.FUNCTOR_CONTINUE; this.SetIDStr(); if(this.m_nextID) functor.InsertNextIDPair(this.m_nextID,this); if(this.m_sameasID) functor.InsertSameasIDPair(this.m_sameasID,this,object); return FunctorCode.FUNCTOR_CONTINUE; }
  public InterfacePrepareStaffCurrentTimeSpanning(functor:PrepareStaffCurrentTimeSpanningFunctorLike,object:ObjectLike):FunctorCode {
    if(!object.IsAnyOf([ClassId.DIR,ClassId.DYNAM])) return FunctorCode.FUNCTOR_CONTINUE;
    if(!this.m_next || !this.m_next.IsControlElement()) return FunctorCode.FUNCTOR_CONTINUE;
    if(object.HasAttClass(ATT_EXTENDER)) {
      const extender = (object as unknown as { GetExtender?:()=>number }).GetExtender?.();
      if(extender !== BOOLEAN_true) return FunctorCode.FUNCTOR_CONTINUE;
    }
    functor.InsertTimeSpanningElement(object); return FunctorCode.FUNCTOR_CONTINUE;
  }
  public InterfaceResetData(_functor:ResetDataFunctorLike,_object:ObjectLike):FunctorCode { this.m_next=null; this.m_nextID=''; this.m_sameas=null; this.m_sameasID=''; return FunctorCode.FUNCTOR_CONTINUE; }
}
