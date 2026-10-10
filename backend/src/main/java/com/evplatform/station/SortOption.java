package com.evplatform.station;

public enum SortOption {
    /** Nearest first (needs a location; otherwise falls back to RATING). */
    DISTANCE,
    /** Cheapest PKR/kWh first. */
    PRICE,
    /** Highest rated first. */
    RATING,
    /** Fastest charger first. */
    POWER,
    /** Most free chargers first. */
    AVAILABILITY
}
