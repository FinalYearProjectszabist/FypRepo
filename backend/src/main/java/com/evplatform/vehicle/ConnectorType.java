package com.evplatform.vehicle;

/** Charging connector standards supported by the platform (used by the Compatibility Engine). */
public enum ConnectorType {
    /** Combined Charging System (Combo 2): DC fast; its upper half is a Type 2 AC inlet. */
    CCS2(true),
    /** Japanese DC fast standard (e.g. Nissan Leaf). */
    CHADEMO(true),
    /** IEC 62196 Type 2 (Mennekes): AC charging. */
    TYPE2(false);

    private final boolean dc;

    ConnectorType(boolean dc) {
        this.dc = dc;
    }

    public boolean isDc() {
        return dc;
    }
}
