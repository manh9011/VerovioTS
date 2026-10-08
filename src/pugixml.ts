/*
 * Pure-TypeScript migration of the dependency-local pugiXML DOM core.
 *
 * This pass ports the public node/attribute/text/document handle layer and
 * the in-memory tree mutation semantics used by Verovio. Full XPath,
 * streaming/file I/O, encoding-specific parsing and allocator page machinery
 * remain in subsequent sub-passes; no browser DOM or WASM dependency is used.
 */

export enum xml_node_type {
  node_null,
  node_document,
  node_element,
  node_pcdata,
  node_cdata,
  node_comment,
  node_pi,
  node_declaration,
  node_doctype,
}

export const parse_minimal = 0x0000;
export const parse_pi = 0x0001;
export const parse_comments = 0x0002;
export const parse_cdata = 0x0004;
export const parse_ws_pcdata = 0x0008;
export const parse_escapes = 0x0010;
export const parse_eol = 0x0020;
export const parse_wconv_attribute = 0x0040;
export const parse_wnorm_attribute = 0x0080;
export const parse_declaration = 0x0100;
export const parse_doctype = 0x0200;
export const parse_ws_pcdata_single = 0x0400;
export const parse_trim_pcdata = 0x0800;
export const parse_fragment = 0x1000;
export const parse_embed_pcdata = 0x2000;
export const parse_merge_pcdata = 0x4000;
export const parse_default = parse_cdata | parse_escapes | parse_wconv_attribute | parse_eol;
export const parse_full = parse_default | parse_pi | parse_comments | parse_declaration | parse_doctype;

export enum xml_encoding {
  encoding_auto,
  encoding_utf8,
  encoding_utf16_le,
  encoding_utf16_be,
  encoding_utf16,
  encoding_utf32_le,
  encoding_utf32_be,
  encoding_utf32,
  encoding_wchar,
  encoding_latin1,
}

export const format_indent = 0x01;
export const format_write_bom = 0x02;
export const format_raw = 0x04;
export const format_no_declaration = 0x08;
export const format_no_escapes = 0x10;
export const format_save_file_text = 0x20;
export const format_indent_attributes = 0x40;
export const format_no_empty_element_tags = 0x80;
export const format_skip_control_chars = 0x100;
export const format_attribute_single_quote = 0x200;
export const format_default = format_indent;
export const default_double_precision = 17;
export const default_float_precision = 9;

export enum xml_parse_status {
  status_ok = 0,
  status_file_not_found,
  status_io_error,
  status_out_of_memory,
  status_internal_error,
  status_unrecognized_tag,
  status_bad_pi,
  status_bad_comment,
  status_bad_cdata,
  status_bad_doctype,
  status_bad_pcdata,
  status_bad_start_element,
  status_bad_attribute,
  status_bad_end_element,
  status_end_element_mismatch,
  status_append_invalid_root,
  status_no_document_element,
}

const STATUS_DESCRIPTIONS: Record<number, string> = {
  [xml_parse_status.status_ok]: 'No error',
  [xml_parse_status.status_file_not_found]: 'File was not found during load_file()',
  [xml_parse_status.status_io_error]: 'Error reading from file/stream',
  [xml_parse_status.status_out_of_memory]: 'Could not allocate memory',
  [xml_parse_status.status_internal_error]: 'Internal error occurred',
  [xml_parse_status.status_unrecognized_tag]: 'Parser could not determine tag type',
  [xml_parse_status.status_bad_pi]: 'Parsing error occurred while parsing document declaration/processing instruction',
  [xml_parse_status.status_bad_comment]: 'Parsing error occurred while parsing comment',
  [xml_parse_status.status_bad_cdata]: 'Parsing error occurred while parsing CDATA section',
  [xml_parse_status.status_bad_doctype]: 'Parsing error occurred while parsing document type declaration',
  [xml_parse_status.status_bad_pcdata]: 'Parsing error occurred while parsing PCDATA section',
  [xml_parse_status.status_bad_start_element]: 'Parsing error occurred while parsing start element tag',
  [xml_parse_status.status_bad_attribute]: 'Parsing error occurred while parsing element attribute',
  [xml_parse_status.status_bad_end_element]: 'Parsing error occurred while parsing end element tag',
  [xml_parse_status.status_end_element_mismatch]: 'There was a mismatch of start-end tags',
  [xml_parse_status.status_append_invalid_root]: 'Unable to append nodes since root type is not node_element or node_document',
  [xml_parse_status.status_no_document_element]: 'Parsing resulted in a document without element nodes',
};

export class xml_parse_result {
  constructor(
    public status: xml_parse_status = xml_parse_status.status_internal_error,
    public offset: number = 0,
    public encoding: xml_encoding = xml_encoding.encoding_auto,
  ) {}

  valueOf(): boolean { return this.status === xml_parse_status.status_ok; }
  toBoolean(): boolean { return this.status === xml_parse_status.status_ok; }
  description(): string { return STATUS_DESCRIPTIONS[this.status] ?? 'Unknown error'; }
}

export interface AttributeData {
  name: string;
  value: string;
  owner: NodeData;
  alive: boolean;
  prevAttribute: AttributeData | null;
  nextAttribute: AttributeData | null;
}

export interface NodeData {
  type: xml_node_type;
  name: string;
  value: string;
  parent: NodeData | null;
  firstChild: NodeData | null;
  lastChild: NodeData | null;
  prevSibling: NodeData | null;
  nextSibling: NodeData | null;
  firstAttribute: AttributeData | null;
  lastAttribute: AttributeData | null;
  alive: boolean;
  document: NodeData;
}

function createNode(type: xml_node_type, name = '', value = '', document?: NodeData): NodeData {
  const n = {} as NodeData;
  n.type = type;
  n.name = name;
  n.value = value;
  n.parent = null;
  n.firstChild = null;
  n.lastChild = null;
  n.prevSibling = null;
  n.nextSibling = null;
  n.firstAttribute = null;
  n.lastAttribute = null;
  n.alive = true;
  n.document = document ?? n;
  return n;
}

function isNamedNodeType(t: xml_node_type): boolean {
  return t === xml_node_type.node_element || t === xml_node_type.node_pi ||
    t === xml_node_type.node_declaration || t === xml_node_type.node_doctype;
}

function allowInsertChild(parent: xml_node_type, child: xml_node_type): boolean {
  if (parent === xml_node_type.node_document) {
    return child === xml_node_type.node_element || child === xml_node_type.node_comment ||
      child === xml_node_type.node_pi || child === xml_node_type.node_declaration || child === xml_node_type.node_doctype;
  }
  if (parent === xml_node_type.node_element) {
    return child !== xml_node_type.node_document && child !== xml_node_type.node_null;
  }
  return false;
}

function escapeXml(s: string, attribute: boolean): string {
  // C++ text_output_escaped: pcdata escapes & < >; attributes escape & < "
  // (' only with format_attribute_single_quote). '>' stays literal in attrs.
  // ponytail: single-pass scan replaces 3 chained regex replaces.
  // SVG output has ~10k+ attr/text values per page; most contain no metachar.
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s.charCodeAt(i);
    if (c === 38 || c === 60 || c === (attribute ? 34 : 62)) break;
    i++;
  }
  if (i === n) return s;
  let r = s.slice(0, i);
  for (; i < n; i++) {
    const c = s.charCodeAt(i);
    if (c === 38) r += '&amp;';
    else if (c === 60) r += '&lt;';
    else if (attribute ? c === 34 : c === 62) r += attribute ? '&quot;' : '&gt;';
    else r += s[i];
  }
  return r;
}

export class xml_attribute {
  constructor(private _attr: AttributeData | null = null) {}
  empty(): boolean { return this._attr === null || !this._attr.alive; }
  name(): string { return this.empty() ? '' : this._attr!.name; }
  value(): string { return this.empty() ? '' : this._attr!.value; }
  as_string(def = ''): string { return this.empty() ? def : this._attr!.value; }
  as_int(def = 0): number { const v = Number.parseInt(this.value(), 10); return Number.isNaN(v) ? def : v; }
  as_uint(def = 0): number { const v = this.as_int(Number.NaN); return Number.isFinite(v) && v >= 0 ? v >>> 0 : def; }
  as_double(def = 0): number { const v = Number.parseFloat(this.value()); return Number.isNaN(v) ? def : v; }
  as_float(def = 0): number { return this.as_double(def); }
  as_bool(def = false): boolean {
    if (this.empty()) return def;
    const s = this.value();
    return s.length === 0 ? def : '1tTyY'.includes(s[0]) || (!'0fFnN'.includes(s[0]) ? Boolean(def) : false);
  }
  set_name(rhs: string, size?: number): boolean { if (this.empty()) return false; this._attr!.name = size === undefined ? rhs : rhs.slice(0, size); return true; }
  set_value(rhs: string | number | boolean, sizeOrPrecision?: number): boolean {
    if (this.empty()) return false;
    if (typeof rhs === 'string') this._attr!.value = sizeOrPrecision === undefined ? rhs : rhs.slice(0, sizeOrPrecision);
    else if (typeof rhs === 'boolean') this._attr!.value = rhs ? 'true' : 'false';
    else if (sizeOrPrecision !== undefined && Number.isFinite(rhs)) this._attr!.value = rhs.toFixed(sizeOrPrecision);
    else this._attr!.value = String(rhs);
    return true;
  }
  next_attribute(): xml_attribute { return this.empty() ? new xml_attribute() : new xml_attribute(findNextAttribute(this._attr!)); }
  previous_attribute(): xml_attribute { return this.empty() ? new xml_attribute() : new xml_attribute(findPreviousAttribute(this._attr!)); }
  hash_value(): number { return this._attr ? objectId(this._attr) : 0; }
  internal_object(): AttributeData | null { return this._attr && this._attr.alive ? this._attr : null; }
  get internal(): AttributeData | null { return this._attr; }
}

const objectIds = new WeakMap<object, number>(); let nextObjectId = 1;
function objectId(o: object): number { let id = objectIds.get(o); if (!id) { id = nextObjectId++; objectIds.set(o, id); } return id; }
function findNextAttribute(a: AttributeData): AttributeData | null { return a.owner.firstAttribute === a ? a.owner.firstAttribute?.owner.firstAttribute === a ? nextAttr(a) : nextAttr(a) : nextAttr(a); }
function nextAttr(a: AttributeData): AttributeData | null { return a.nextAttribute; }
function findPreviousAttribute(a: AttributeData): AttributeData | null { return a.prevAttribute; }
function attrNext(a: AttributeData): AttributeData | null { return a.nextAttribute; }

function linkAttribute(owner: NodeData, attr: AttributeData, before: AttributeData | null): void {
  const prev = before ? ((before as AttributeData & {prevAttribute?: AttributeData | null}).prevAttribute ?? null) : owner.lastAttribute;
  const next = before;
  attr.prevAttribute = prev;
  attr.nextAttribute = next;
  if (prev) prev.nextAttribute = attr; else owner.firstAttribute = attr;
  if (next) next.prevAttribute = attr; else owner.lastAttribute = attr;
}

function unlinkAttribute(attr: AttributeData): void {
  const owner = attr.owner;
  if (attr.prevAttribute) attr.prevAttribute.nextAttribute = attr.nextAttribute; else owner.firstAttribute = attr.nextAttribute;
  if (attr.nextAttribute) attr.nextAttribute.prevAttribute = attr.prevAttribute; else owner.lastAttribute = attr.prevAttribute;
  attr.prevAttribute = null; attr.nextAttribute = null; attr.alive = false;
}

function childList(owner: NodeData): NodeData[] { const out: NodeData[] = []; for (let n = owner.firstChild; n; n = n.nextSibling) out.push(n); return out; }

function linkChild(owner: NodeData, child: NodeData, before: NodeData | null): void {
  const prev = before ? before.prevSibling : owner.lastChild;
  child.parent = owner; child.document = owner.document; child.alive = true;
  child.prevSibling = prev; child.nextSibling = before;
  if (prev) prev.nextSibling = child; else owner.firstChild = child;
  if (before) before.prevSibling = child; else owner.lastChild = child;
}
function unlinkChild(child: NodeData): void {
  const owner = child.parent; if (!owner) return;
  if (child.prevSibling) child.prevSibling.nextSibling = child.nextSibling; else owner.firstChild = child.nextSibling;
  if (child.nextSibling) child.nextSibling.prevSibling = child.prevSibling; else owner.lastChild = child.prevSibling;
  child.parent = null; child.prevSibling = null; child.nextSibling = null;
}
function cloneTree(src: NodeData, doc: NodeData): NodeData {
  const n = createNode(src.type, src.name, src.value, doc);
  for (let a = src.firstAttribute; a; a = attrNext(a)) {
    const na: AttributeData = { name: a.name, value: a.value, owner: n, alive: true, prevAttribute: null, nextAttribute: null };
    linkAttribute(n, na, null);
  }
  for (let c = src.firstChild; c; c = c.nextSibling) linkChild(n, cloneTree(c, doc), null);
  return n;
}
function destroyTree(n: NodeData): void {
  for (let c = n.firstChild; c;) { const next = c.nextSibling; destroyTree(c); c = next; }
  for (let a = n.firstAttribute; a;) { const next = attrNext(a); a.alive = false; a = next; }
  n.alive = false; n.parent = null; n.firstChild = null; n.lastChild = null; n.firstAttribute = null; n.lastAttribute = null;
}

export class xml_text {
  constructor(private _root: NodeData | null = null) {}
  private dataNode(): NodeData | null {
    if (!this._root || !this._root.alive) return null;
    // C++ xml_text::_data(): a pcdata/cdata root is its own data node
    // (`if (!_root || impl::is_text_node(_root)) return _root;`).
    if (this._root.type === xml_node_type.node_pcdata || this._root.type === xml_node_type.node_cdata) return this._root;
    for (let n = this._root.firstChild; n; n = n.nextSibling) if (n.type === xml_node_type.node_pcdata || n.type === xml_node_type.node_cdata) return n;
    return null;
  }
  // C++ `xml_text::empty()` returns `_data() == NULL` where `_data()` is the
  // first pcdata/cdata child; a bare element node has empty text even though
  // the node itself is alive. (MEIOutput::PruneAttributes relies on this.)
  empty(): boolean { return this.dataNode() === null; }
  get(): string { return this.dataNode()?.value ?? ''; }
  as_string(def = ''): string { return this.dataNode()?.value ?? def; }
  as_int(def = 0): number { const v = Number.parseInt(this.get(), 10); return Number.isNaN(v) ? def : v; }
  as_uint(def = 0): number { const v = this.as_int(Number.NaN); return Number.isFinite(v) && v >= 0 ? v >>> 0 : def; }
  as_double(def = 0): number { const v = Number.parseFloat(this.get()); return Number.isNaN(v) ? def : v; }
  as_float(def = 0): number { return this.as_double(def); }
  as_bool(def = false): boolean { const s = this.get(); return s ? '1tTyY'.includes(s[0]) : def; }
  set(rhs: string | number | boolean, precision?: number): boolean {
    const data = this._root?.alive ? this._root : null; if (!data) return false;
    let target = this.dataNode();
    if (!target) { target = createNode(xml_node_type.node_pcdata, '', '', data.document); linkChild(data, target, null); }
    if (typeof rhs === 'string') target.value = precision === undefined ? rhs : rhs.slice(0, precision);
    else if (typeof rhs === 'boolean') target.value = rhs ? 'true' : 'false';
    else if (precision !== undefined) target.value = rhs.toFixed(precision); else target.value = String(rhs);
    return true;
  }
  data(): xml_node { const d = this.dataNode(); return new xml_node(d); }
}

export class xml_node {
  protected _root: NodeData | null;
  constructor(p: NodeData | null = null) { this._root = p; }
  empty(): boolean { return this._root === null || !this._root.alive; }
  type(): xml_node_type { return this.empty() ? xml_node_type.node_null : this._root!.type; }
  name(): string { return this.empty() ? '' : this._root!.name; }
  value(): string { return this.empty() ? '' : this._root!.value; }
  first_attribute(): xml_attribute { return new xml_attribute(this._root?.firstAttribute ?? null); }
  last_attribute(): xml_attribute { return new xml_attribute(this._root?.lastAttribute ?? null); }
  first_child(): xml_node { return new xml_node(this._root?.firstChild ?? null); }
  last_child(): xml_node { return new xml_node(this._root?.lastChild ?? null); }
  next_sibling(name?: string): xml_node { let n = this._root?.nextSibling ?? null; if (name === undefined) return new xml_node(n); while (n && n.name !== name) n = n.nextSibling; return new xml_node(n); }
  previous_sibling(name?: string): xml_node { let n = this._root?.prevSibling ?? null; if (name === undefined) return new xml_node(n); while (n && n.name !== name) n = n.prevSibling; return new xml_node(n); }
  parent(): xml_node { return new xml_node(this._root?.parent ?? null); }
  root(): xml_node { return new xml_node(this._root?.document ?? null); }
  text(): xml_text { return new xml_text(this._root); }
  child(name: string): xml_node { for (let n = this._root?.firstChild ?? null; n; n = n.nextSibling) if (n.name === name) return new xml_node(n); return new xml_node(); }
  attribute(name: string, hint?: xml_attribute): xml_attribute { for (let a = this._root?.firstAttribute ?? null; a; a = attrNext(a)) if (a.name === name) return new xml_attribute(a); return new xml_attribute(); }
  child_value(name?: string): string { const n = name === undefined ? this.first_child() : this.child(name); if (name === undefined) { for (let c = this._root?.firstChild ?? null; c; c = c.nextSibling) if (c.type === xml_node_type.node_pcdata || c.type === xml_node_type.node_cdata) return c.value; return ''; } return n.child_value(); }
  set_name(rhs: string, size?: number): boolean { if (this.empty() || !isNamedNodeType(this.type())) return false; this._root!.name = size === undefined ? rhs : rhs.slice(0, size); return true; }
  set_value(rhs: string, size?: number): boolean { if (this.empty()) return false; this._root!.value = size === undefined ? rhs : rhs.slice(0, size); return true; }
  append_attribute(name: string): xml_attribute { return this.insertAttribute(name, null); }
  prepend_attribute(name: string): xml_attribute { return this.insertAttribute(name, this._root?.firstAttribute ?? null); }
  insert_attribute_after(name: string, attr: xml_attribute): xml_attribute { const existing = attr.internal; if (!this._root || !existing || existing.owner !== this._root) return new xml_attribute(); return this.insertAttribute(name, attrNext(existing)); }
  insert_attribute_before(name: string, attr: xml_attribute): xml_attribute { const existing = attr.internal; if (!this._root || !existing || existing.owner !== this._root) return new xml_attribute(); return this.insertAttribute(name, existing); }
  ensure_attribute(name: string): xml_attribute { const a = this.attribute(name); return a.empty() ? this.append_attribute(name) : a; }

  append_child(typeOrName: xml_node_type | string = xml_node_type.node_element): xml_node { return typeof typeOrName === 'string' ? this.insertChild(xml_node_type.node_element, typeOrName, null) : this.insertChild(typeOrName, '', null); }
  prepend_child(typeOrName: xml_node_type | string = xml_node_type.node_element): xml_node { return typeof typeOrName === 'string' ? this.insertChild(xml_node_type.node_element, typeOrName, this._root?.firstChild ?? null) : this.insertChild(typeOrName, '', this._root?.firstChild ?? null); }
  insert_child_after(typeOrName: xml_node_type | string, node: xml_node): xml_node { const n = node._root; if (!this._root || !n || n.parent !== this._root) return new xml_node(); return typeof typeOrName === 'string' ? this.insertChild(xml_node_type.node_element, typeOrName, n.nextSibling) : this.insertChild(typeOrName, '', n.nextSibling); }
  insert_child_before(typeOrName: xml_node_type | string, node: xml_node): xml_node { const n = node._root; if (!this._root || !n || n.parent !== this._root) return new xml_node(); return typeof typeOrName === 'string' ? this.insertChild(xml_node_type.node_element, typeOrName, n) : this.insertChild(typeOrName, '', n); }
  ensure_child(name: string): xml_node { const n = this.child(name); return n.empty() ? this.append_child(name) : n; }
  append_copy(proto: xml_node | xml_attribute): xml_node | xml_attribute { return proto instanceof xml_attribute ? this.copyAttribute(proto, null) : this.copyNode(proto, null); }
  prepend_copy(proto: xml_node | xml_attribute): xml_node | xml_attribute { return proto instanceof xml_attribute ? this.copyAttribute(proto, this._root?.firstAttribute ?? null) : this.copyNode(proto, this._root?.firstChild ?? null); }
  insert_copy_after(proto: xml_node | xml_attribute, node: xml_node | xml_attribute): xml_node | xml_attribute { if (proto instanceof xml_attribute && node instanceof xml_attribute) { const n = node.internal; return n && n.owner === this._root ? this.copyAttribute(proto, attrNext(n)) : new xml_attribute(); } if (proto instanceof xml_node && node instanceof xml_node) { const n = node.internal_object(); return n && n.parent === this._root ? this.copyNode(proto, n.nextSibling) : new xml_node(); } return proto instanceof xml_attribute ? new xml_attribute() : new xml_node(); }
  insert_copy_before(proto: xml_node | xml_attribute, node: xml_node | xml_attribute): xml_node | xml_attribute { if (proto instanceof xml_attribute && node instanceof xml_attribute) { const n = node.internal; return n && n.owner === this._root ? this.copyAttribute(proto, n) : new xml_attribute(); } if (proto instanceof xml_node && node instanceof xml_node) { const n = node.internal_object(); return n && n.parent === this._root ? this.copyNode(proto, n) : new xml_node(); } return proto instanceof xml_attribute ? new xml_attribute() : new xml_node(); }
  append_move(moved: xml_node): xml_node { return this.moveNode(moved, null); }
  prepend_move(moved: xml_node): xml_node { return this.moveNode(moved, this._root?.firstChild ?? null); }
  insert_move_after(moved: xml_node, node: xml_node): xml_node { return node._root && node._root.parent === this._root ? this.moveNode(moved, node._root.nextSibling) : new xml_node(); }
  insert_move_before(moved: xml_node, node: xml_node): xml_node { return node._root && node._root.parent === this._root ? this.moveNode(moved, node._root) : new xml_node(); }
  remove_attribute(aOrName: xml_attribute | string): boolean { const a = typeof aOrName === 'string' ? this.attribute(aOrName) : aOrName; const data = a.internal; if (!this._root || !data || data.owner !== this._root) return false; unlinkAttribute(data); return true; }
  remove_attributes(): boolean { if (!this._root) return false; for (let a = this._root.firstAttribute; a;) { const next = attrNext(a); a.alive = false; a = next; } this._root.firstAttribute = this._root.lastAttribute = null; return true; }
  remove_child(nOrName: xml_node | string): boolean { const n = typeof nOrName === 'string' ? this.child(nOrName) : nOrName; const d = n._root; if (!this._root || !d || d.parent !== this._root) return false; unlinkChild(d); destroyTree(d); return true; }
  remove_children(): boolean { if (!this._root) return false; for (let n = this._root.firstChild; n;) { const next = n.nextSibling; destroyTree(n); n = next; } this._root.firstChild = this._root.lastChild = null; return true; }
  find_child_by_attribute(name: string, attrName: string, attrValue: string): xml_node;
  find_child_by_attribute(attrName: string, attrValue: string): xml_node;
  find_child_by_attribute(a: string, b: string, c?: string): xml_node { for (let n = this._root?.firstChild ?? null; n; n = n.nextSibling) { const attr = n.firstAttribute; if (c === undefined) { for (let x = attr; x; x = attrNext(x)) if (x.name === a && x.value === b) return new xml_node(n); } else if (n.name === a) { for (let x = attr; x; x = attrNext(x)) if (x.name === b && x.value === c) return new xml_node(n); } } return new xml_node(); }
  find_child(pred: (n: xml_node) => boolean): xml_node { for (let n = this._root?.firstChild ?? null; n; n = n.nextSibling) { const w = new xml_node(n); if (pred(w)) return w; } return new xml_node(); }
  find_attribute(pred: (a: xml_attribute) => boolean): xml_attribute { for (let a = this._root?.firstAttribute ?? null; a; a = attrNext(a)) { const w = new xml_attribute(a); if (pred(w)) return w; } return new xml_attribute(); }
  find_node(pred: (n: xml_node) => boolean): xml_node { if (!this._root) return new xml_node(); const visit = (n: NodeData): xml_node => { for (let cur = n.firstChild; cur; cur = cur.nextSibling) { const w = new xml_node(cur); if (pred(w)) return w; const nested = visit(cur); if (!nested.empty()) return nested; } return new xml_node(); }; return visit(this._root); }
  children(): Iterable<xml_node> { return Array.from(childList(this._root ?? createNode(xml_node_type.node_null))).map(n => new xml_node(n)); }
  attributes(): Iterable<xml_attribute> { const out: xml_attribute[] = []; for (let a = this._root?.firstAttribute ?? null; a; a = attrNext(a)) out.push(new xml_attribute(a)); return out; }
  path(delimiter = '/'): string { if (this.empty()) return ''; const parts: string[] = []; for (let n = this._root; n && n.parent; n = n.parent) { if (n.type !== xml_node_type.node_element) continue; let index = 1; for (let s = n.prevSibling; s; s = s.prevSibling) if (s.type === xml_node_type.node_element && s.name === n.name) index++; parts.push(index === 1 ? n.name : `${n.name}[${index}]`); } return delimiter + parts.reverse().join(delimiter); }
  first_element_by_path(path: string, delimiter = '/'): xml_node { let cur: xml_node = this; for (const part of path.split(delimiter).filter(Boolean)) { if (part === '.') continue; if (part === '..') { cur = cur.parent(); continue; } cur = cur.child(part); if (cur.empty()) return cur; } return cur; }
  offset_debug(): number { return 0; }
  hash_value(): number { return this._root ? objectId(this._root) : 0; }
  internal_object(): NodeData | null { return this._root && this._root.alive ? this._root : null; }
  private insertAttribute(name: string, before: AttributeData | null): xml_attribute { if (!this._root || (this._root.type !== xml_node_type.node_element && this._root.type !== xml_node_type.node_declaration)) return new xml_attribute(); const a: AttributeData = { name, value: '', owner: this._root, alive: true, prevAttribute: null, nextAttribute: null }; linkAttribute(this._root, a, before); return new xml_attribute(a); }
  private copyAttribute(proto: xml_attribute, before: AttributeData | null): xml_attribute { const src = proto.internal; if (!src) return new xml_attribute(); const a = this.insertAttribute(src.name, before); a.set_value(src.value); return a; }
  private insertChild(type: xml_node_type, name: string, before: NodeData | null): xml_node { if (!this._root || !allowInsertChild(this._root.type, type)) return new xml_node(); const child = createNode(type, type === xml_node_type.node_declaration ? 'xml' : name, '', this._root.document); linkChild(this._root, child, before); return new xml_node(child); }
  private copyNode(proto: xml_node, before: NodeData | null): xml_node { const src = proto.internal_object(); if (!src || !this._root || !allowInsertChild(this._root.type, src.type)) return new xml_node(); const c = cloneTree(src, this._root.document); linkChild(this._root, c, before); return new xml_node(c); }
  private moveNode(moved: xml_node, before: NodeData | null): xml_node { const src = moved.internal_object(); const owner = this._root; if (!src || !owner || src === owner || !allowInsertChild(owner.type, src.type)) return new xml_node(); for (let p: NodeData | null = owner; p; p = p.parent) if (p === src) return new xml_node(); if (src.parent) unlinkChild(src); linkChild(owner, src, before); return new xml_node(src); }
}

export class xml_document extends xml_node {
  constructor() { const doc = createNode(xml_node_type.node_document); super(doc); doc.document = doc; }
  reset(proto?: xml_document): void { this.remove_children(); if (proto) { const src = proto.internal_object(); if (src) for (let n = src.firstChild; n; n = n.nextSibling) linkChild(this._root!, cloneTree(n, this._root!), null); } }
  document_element(): xml_node { for (let n = this._root?.firstChild ?? null; n; n = n.nextSibling) if (n.type === xml_node_type.node_element) return new xml_node(n); return new xml_node(); }
  load_string(contents: string, options = parse_default): xml_parse_result { this.reset(); const result = parseXmlInto(this._root!, contents, options); return result; }
  load(contents: string, options = parse_default): xml_parse_result { return this.load_string(contents, options); }
  save_string(indent = '\t', flags = format_default): string { const root = this._root!; return serializeNode(root, indent, flags, 0); }
  save(writer: { write(data: string): void }, indent = '\t', flags = format_default): void { writer.write(this.save_string(indent, flags)); }
}

function decodeEntities(s: string): string {
  // ponytail: most PCDATA has no entities; regex replace per chunk (185: 153ms).
  // Fast-path out before running the global regex.
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|lt|gt|amp|apos|quot);/g, (_, k: string) => {
    if (k === 'lt') return '<'; if (k === 'gt') return '>'; if (k === 'amp') return '&'; if (k === 'apos') return "'"; if (k === 'quot') return '"';
    const n = k[1].toLowerCase() === 'x' ? Number.parseInt(k.slice(2), 16) : Number.parseInt(k.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : `&${k};`;
  });
}
function normalizeEol(s: string): string { return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); }
function parseAttrs(text: string): Array<[string, string]> { const attrs: Array<[string,string]> = []; const re = /([^\s=]+)\s*=\s*(["'])(.*?)\2/g; let m: RegExpExecArray | null; while ((m = re.exec(text))) attrs.push([m[1], m[3]]); return attrs; }
// C++ pugixml scans quoted sections when locating the tag-closing '>'.
function findTagEnd(text: string, from: number): number {
  let q = '';
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (q !== '') { if (ch === q) q = ''; continue; }
    if (ch === '"' || ch === "'") { q = ch; continue; }
    if (ch === '>') return i;
  }
  return -1;
}
function parseXmlInto(doc: NodeData, source: string, options: number): xml_parse_result {
  const text = (options & parse_eol) ? normalizeEol(source) : source;
  const stack: NodeData[] = [doc]; let i = 0;
  while (i < text.length) {
    if (text[i] !== '<') {
      const end = text.indexOf('<', i); const raw = text.slice(i, end < 0 ? text.length : end); const value = (options & parse_escapes) ? decodeEntities(raw) : raw;
      // C++ pugixml whitespace (ct_space) is ASCII-only: space, tab, LF, CR.
      // Bytes >= 128 (e.g. U+00A0 NBSP in UTF-8) are genuine PCDATA. JS trim()
      // is Unicode-aware and would wrongly drop NBSP-only content.
      const current = stack[stack.length - 1]; const whitespace = /^[ \t\n\r]*$/.test(value);
      if (value.length && current.type !== xml_node_type.node_document && ((options & parse_ws_pcdata) || !whitespace)) {
        const normalized = (options & parse_trim_pcdata) ? value.trim() : value;
        if (normalized.length || (options & parse_ws_pcdata_single)) { if ((options & parse_merge_pcdata) && current.lastChild?.type === xml_node_type.node_pcdata) current.lastChild.value += normalized; else linkChild(current, createNode(xml_node_type.node_pcdata, '', normalized, doc), null); }
      }
      i = end < 0 ? text.length : end; continue;
    }
    if (text.startsWith('<!--', i)) { const e = text.indexOf('-->', i + 4); if (e < 0) return new xml_parse_result(xml_parse_status.status_bad_comment, i, xml_encoding.encoding_utf8); if (options & parse_comments) linkChild(stack[stack.length-1], createNode(xml_node_type.node_comment, '', text.slice(i+4,e), doc), null); i=e+3; continue; }
    if (text.startsWith('<![CDATA[', i)) { const e = text.indexOf(']]>', i + 9); if (e < 0) return new xml_parse_result(xml_parse_status.status_bad_cdata, i, xml_encoding.encoding_utf8); if (options & parse_cdata) linkChild(stack[stack.length-1], createNode(xml_node_type.node_cdata, '', text.slice(i+9,e), doc), null); i=e+3; continue; }
    if (text.startsWith('<?', i)) { const e = text.indexOf('?>', i+2); if (e < 0) return new xml_parse_result(xml_parse_status.status_bad_pi, i, xml_encoding.encoding_utf8); const body=text.slice(i+2,e).trim(); const space=body.search(/\s/); const name=space<0?body:body.slice(0,space); if (options & parse_pi) { const n=createNode(xml_node_type.node_pi,name,space<0?'':body.slice(space+1).trim(),doc); linkChild(stack[stack.length-1],n,null); } i=e+2; continue; }
    if (text.startsWith('</', i)) { const e=text.indexOf('>',i+2); if(e<0)return new xml_parse_result(xml_parse_status.status_bad_end_element,i,xml_encoding.encoding_utf8); const name=text.slice(i+2,e).trim(); const top=stack[stack.length-1]; if(stack.length<=1||top.name!==name)return new xml_parse_result(xml_parse_status.status_end_element_mismatch,i,xml_encoding.encoding_utf8); stack.pop(); i=e+1; continue; }
    if (text.startsWith('<!DOCTYPE', i)) { const e=text.indexOf('>',i+9); if(e<0)return new xml_parse_result(xml_parse_status.status_bad_doctype,i,xml_encoding.encoding_utf8); if(options & parse_doctype) linkChild(stack[stack.length-1], createNode(xml_node_type.node_doctype,'',text.slice(i+9,e).trim(),doc),null); i=e+1; continue; }
    const e=findTagEnd(text, i+1); if(e<0)return new xml_parse_result(xml_parse_status.status_bad_start_element,i,xml_encoding.encoding_utf8); const raw=text.slice(i+1,e); const selfClose=/\/\s*$/.test(raw); const body=selfClose?raw.replace(/\/\s*$/,'').trim():raw.trim(); const m=/^([^\s/>]+)/.exec(body); if(!m)return new xml_parse_result(xml_parse_status.status_bad_start_element,i,xml_encoding.encoding_utf8); const n=createNode(xml_node_type.node_element,m[1],'',doc); for(const [k,v0] of parseAttrs(body.slice(m[0].length))) { const v=(options & parse_escapes)?decodeEntities(v0):v0; const a:AttributeData={name:k,value:v,owner:n,alive:true,prevAttribute:null,nextAttribute:null}; linkAttribute(n,a,null); } linkChild(stack[stack.length-1],n,null); if(!selfClose)stack.push(n); i=e+1;
  }
  if(stack.length!==1)return new xml_parse_result(xml_parse_status.status_end_element_mismatch,text.length,xml_encoding.encoding_utf8);
  if(!(options & parse_fragment) && !doc.firstChild) return new xml_parse_result(xml_parse_status.status_no_document_element,text.length,xml_encoding.encoding_utf8);
  return new xml_parse_result(xml_parse_status.status_ok,text.length,xml_encoding.encoding_utf8);
}

function serializeNode(node: NodeData, indent: string, flags: number, depth: number): string {
  // Faithful port of pugi::node_output (pugixml.cpp): pcdata/cdata reset the
  // indent flags so mixed content stays inline; only element boundaries and
  // comments/PIs carry newlines+indent. The previous recursive join(newline)
  // wrongly broke text around child elements (e.g. tempo '\uec25 = 120').
  const raw = Boolean(flags & format_raw);
  const indentLength = (!raw && (flags & (format_indent | format_indent_attributes))) ? indent.length : 0;
  const noescapes = Boolean(flags & format_no_escapes);
  const dq = (flags & format_attribute_single_quote) ? "'" : '"';
  const out: string[] = [];
  const writeIndent = (d: number): void => { if (indentLength) out.push(indent.repeat(d)); };
  const outputAttributes = (n: NodeData): void => {
    for (let a = n.firstAttribute; a; a = attrNext(a)) {
      out.push(` ${a.name}=${dq}${noescapes ? a.value : escapeXml(a.value, true)}${dq}`);
    }
  };
  const isOutputEmpty = (n: NodeData): boolean => {
    const c = n.firstChild;
    return !c || (!c.nextSibling && c.type === xml_node_type.node_pcdata && !c.value);
  };
  // returns false when the element closes itself (empty or value-only, no children)
  const outputStart = (n: NodeData, d: number): boolean => {
    out.push(`<${n.name}`);
    if (n.firstAttribute) outputAttributes(n);
    if (!n.value) {
      if (!n.firstChild || isOutputEmpty(n)) {
        if (flags & format_no_empty_element_tags) {
          out.push(`></${n.name}>`);
        }
        else {
          if (!raw) out.push(' ');
          out.push('/>');
        }
        return false;
      }
      out.push('>');
      return true;
    }
    out.push('>');
    out.push(noescapes ? n.value : escapeXml(n.value, false));
    if (!n.firstChild) {
      out.push(`</${n.name}>`);
      return false;
    }
    return true;
  };
  const outputEnd = (n: NodeData): void => { out.push(`</${n.name}>`); };
  const outputSimple = (n: NodeData): void => {
    if (n.type === xml_node_type.node_pcdata) out.push(noescapes ? n.value : escapeXml(n.value, false));
    else if (n.type === xml_node_type.node_cdata) out.push(`<![CDATA[${n.value}]]>`);
    else if (n.type === xml_node_type.node_comment) out.push(`<!--${n.value}-->`);
    else if (n.type === xml_node_type.node_pi) out.push(n.value ? `<?${n.name} ${n.value}?>` : `<?${n.name}?>`);
    else if (n.type === xml_node_type.node_declaration) {
      out.push(`<?${n.name}`);
      // C++ passes format_raw for declaration attributes (no indent/newline).
      const saved: Array<[string, string]> = [];
      for (let a = n.firstAttribute; a; a = attrNext(a)) saved.push([a.name, a.value]);
      for (const [k, v] of saved) out.push(` ${k}=${dq}${noescapes ? v : escapeXml(v, true)}${dq}`);
      out.push('?>');
    }
    else if (n.type === xml_node_type.node_doctype) out.push(n.value ? `<!DOCTYPE ${n.value}>` : '<!DOCTYPE>');
  };
  const INDENT_NEWLINE = 1;
  const INDENT_INDENT = 2;
  const root = node;
  let cur: NodeData | null = root;
  let d = depth;
  let indentFlags = INDENT_INDENT;
  // document root: C++ treats node_document by descending without newline
  if (cur.type === xml_node_type.node_document) {
    if (!cur.firstChild) return raw ? '' : '\n';
    cur = cur.firstChild;
  }
  else if (cur.type !== xml_node_type.node_element) {
    outputSimple(cur);
    return out.join('');
  }
  else {
    if ((indentFlags & INDENT_NEWLINE) && !raw) out.push('\n');
    if ((indentFlags & INDENT_INDENT) && indentLength) writeIndent(d);
    if (!outputStart(cur, d)) return out.join('');
    indentFlags = INDENT_NEWLINE | INDENT_INDENT;
    if (cur.firstChild) { cur = cur.firstChild; d++; }
  }
  for (;;) {
    if (!cur || cur === root) break;
    const t = cur.type;
    if (t === xml_node_type.node_pcdata || t === xml_node_type.node_cdata) {
      outputSimple(cur);
      indentFlags = 0;
    }
    else {
      if ((indentFlags & INDENT_NEWLINE) && !raw) out.push('\n');
      if ((indentFlags & INDENT_INDENT) && indentLength) writeIndent(d);
      if (t === xml_node_type.node_element) {
        indentFlags = INDENT_NEWLINE | INDENT_INDENT;
        if (outputStart(cur, d)) {
          if (cur.firstChild) { cur = cur.firstChild; d++; continue; }
        }
      }
      else if (t === xml_node_type.node_document) {
        indentFlags = INDENT_INDENT;
        if (cur.firstChild) { cur = cur.firstChild; d++; continue; }
      }
      else {
        outputSimple(cur);
        indentFlags = INDENT_NEWLINE | INDENT_INDENT;
      }
    }
    while (cur !== root) {
      if (!cur) break;
      if (cur.nextSibling) { cur = cur.nextSibling; break; }
      cur = cur.parent;
      if (cur && cur.type === xml_node_type.node_element) {
        d--;
        if ((indentFlags & INDENT_NEWLINE) && !raw) out.push('\n');
        if ((indentFlags & INDENT_INDENT) && indentLength) writeIndent(d);
        outputEnd(cur);
        indentFlags = INDENT_NEWLINE | INDENT_INDENT;
      }
      if (cur === root) break;
    }
    if (!cur || cur === root) break;
  }
  if ((indentFlags & INDENT_NEWLINE) && !raw) out.push('\n');
  return out.join('');
}

export class xml_tree_walker {
  private _depth = 0;
  depth(): number { return this._depth; }
  begin(_node: xml_node): boolean { return true; }
  for_each(_node: xml_node): boolean { return true; }
  end(_node: xml_node): boolean { return true; }
}

export class xml_writer { write(_data: string): void { throw new Error('xml_writer.write() must be implemented'); } }

export function as_utf8(value: string): string { return value; }
export function as_wide(value: string): string { return value; }
