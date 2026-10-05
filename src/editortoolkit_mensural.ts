// EditorToolkitMensural - pure TS translation of
// src-cpp/include/vrv/editortoolkit_mensural.h.
// The C++ class is an empty subclass of EditorToolkitShared (no .cpp body,
// no method overrides); the TS port mirrors that exactly.
import { EditorToolkitShared } from './editortoolkit_shared.js';

export class EditorToolkitMensural extends EditorToolkitShared {
  public constructor(doc: unknown, view: unknown) {
    // ponytail: MEI I/O seam is still pending (iomei pass); a default no-op seam keeps
    // construction usable for tests. Upgrade when iomei lands (same as EditorToolkitCMN).
    super(doc, view, { exportState: () => '', importState: () => false, exportScoreDef: () => '' });
  }
}
