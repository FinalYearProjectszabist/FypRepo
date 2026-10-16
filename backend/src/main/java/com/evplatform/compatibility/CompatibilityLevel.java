package com.evplatform.compatibility;

/** Station-level verdict for a vehicle. */
public enum CompatibilityLevel {
    /** Every charger at the station fits the car. */
    COMPATIBLE,
    /** Some chargers fit, some don't. */
    PARTIAL,
    /** No charger fits the car. */
    INCOMPATIBLE
}
