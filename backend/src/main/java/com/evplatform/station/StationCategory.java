package com.evplatform.station;

/** Who hosts the charger — shown as the category buttons on the search page. */
public enum StationCategory {
    /** Public charging station (operator / fuel station network). */
    PUBLIC,
    /** Café, hotel, gym, mall… listing chargers for customers. */
    BUSINESS,
    /** Homeowner sharing a private charger. */
    HOME
}
