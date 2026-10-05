/**
 * Pure TypeScript translation of libmei/dist/atts_edittrans.cpp.
 *
 * Generated-libmei attribute classes for editorial identification metadata.
 * Semantics intentionally mirror the canonical C++ implementation:
 * empty-string defaults, pugiXML attribute presence/removal behavior,
 * converter dispatch through Att, and explicit instantiable wrappers.
 */
import { Att } from './att';
import { xml_node } from './pugixml';

function readStringAttribute(element: xml_node, name: string): { present: boolean; value: string } {
  const attr = element.attribute(name);
  return { present: !attr.empty(), value: attr.value() };
}

function writeStringAttribute(element: xml_node, name: string, value: string): boolean {
  element.append_attribute(name).set_value(value);
  return true;
}

/** Causative agent of damage, illegibility, or other loss of original text. */
export abstract class AttAgentIdent extends Att {
  protected m_agent = '';

  constructor() {
    super();
    this.ResetAgentIdent();
  }

  ResetAgentIdent(): void {
    this.m_agent = '';
  }

  ReadAgentIdent(element: xml_node, removeAttr = true): boolean {
    const { present, value } = readStringAttribute(element, 'agent');
    if (!present) return false;
    this.SetAgent(this.StrToStr(value));
    if (removeAttr) element.remove_attribute('agent');
    return true;
  }

  WriteAgentIdent(element: xml_node): boolean {
    if (!this.HasAgent()) return false;
    return writeStringAttribute(element, 'agent', this.StrToStr(this.GetAgent()));
  }

  SetAgent(agent: string): void {
    this.m_agent = agent;
  }

  GetAgent(): string {
    return this.m_agent;
  }

  HasAgent(): boolean {
    return this.m_agent !== '';
  }
}

/** Instantiable generated-libmei wrapper. */
export class InstAgentIdent extends AttAgentIdent {}

/** Reason for missing textual material, supplied material, or difficult transcription. */
export abstract class AttReasonIdent extends Att {
  protected m_reason = '';

  constructor() {
    super();
    this.ResetReasonIdent();
  }

  ResetReasonIdent(): void {
    this.m_reason = '';
  }

  ReadReasonIdent(element: xml_node, removeAttr = true): boolean {
    const { present, value } = readStringAttribute(element, 'reason');
    if (!present) return false;
    this.SetReason(this.StrToStr(value));
    if (removeAttr) element.remove_attribute('reason');
    return true;
  }

  WriteReasonIdent(element: xml_node): boolean {
    if (!this.HasReason()) return false;
    return writeStringAttribute(element, 'reason', this.StrToStr(this.GetReason()));
  }

  SetReason(reason: string): void {
    this.m_reason = reason;
  }

  GetReason(): string {
    return this.m_reason;
  }

  HasReason(): boolean {
    return this.m_reason !== '';
  }
}

/** Instantiable generated-libmei wrapper. */
export class InstReasonIdent extends AttReasonIdent {}
