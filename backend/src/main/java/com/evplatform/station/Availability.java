package com.evplatform.station;

/** Derived, real-time view of a station for the driver. */
public enum Availability {
    /** Operational, open, and at least one matching charger is free. */
    AVAILABLE,
    /** Operational and open, but every matching charger is occupied (join the queue). */
    BUSY,
    /** Outside opening hours. */
    CLOSED,
    /** Under maintenance, offline, or no working charger. */
    UNAVAILABLE
}
