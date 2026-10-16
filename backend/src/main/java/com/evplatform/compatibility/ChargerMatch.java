package com.evplatform.compatibility;

import java.math.BigDecimal;

/**
 * Result of matching one vehicle against one charger.
 *
 * @param compatible       the plug physically fits the car
 * @param via              how it fits (or NONE)
 * @param effectivePowerKw the speed this car will actually charge at: min(charger, car limit); null if not compatible
 * @param note             human readable explanation for the UI
 */
public record ChargerMatch(boolean compatible, MatchType via, BigDecimal effectivePowerKw, String note) {

    public enum MatchType {
        /** Charger connector = the car's main port. */
        DIRECT,
        /** Car has an extra port / adapter for this connector. */
        ADDITIONAL_PORT,
        /** Type 2 AC plug in the upper half of a CCS2 (Combo 2) inlet. */
        CCS2_AC_INLET,
        NONE
    }
}
