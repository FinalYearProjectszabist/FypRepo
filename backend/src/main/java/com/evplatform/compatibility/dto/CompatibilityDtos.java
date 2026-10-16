package com.evplatform.compatibility.dto;

import com.evplatform.compatibility.ChargerMatch;
import com.evplatform.station.dto.StationDtos.VehicleBrief;
import com.evplatform.vehicle.ConnectorType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class CompatibilityDtos {

    private CompatibilityDtos() {}

    /** One row of "which connector types can my car use?" */
    public record ConnectorSupport(ConnectorType connectorType, boolean dc, boolean compatible,
                                   ChargerMatch.MatchType matchType, BigDecimal carMaxPowerKw, String note) {}

    public record VehicleCompatibility(VehicleBrief vehicle, List<ConnectorSupport> connectors) {}

    public record PreBookingRequest(
            @NotNull(message = "Select a vehicle") Long vehicleId,
            @NotNull(message = "Select a station") Long stationId,
            /** Optional: the charger the driver picked. If null the engine recommends one. */
            Long chargerId,
            /** Optional current location, used for the "can you reach it?" range check. */
            @DecimalMin(value = "-90", message = "Invalid latitude") @DecimalMax(value = "90", message = "Invalid latitude")
            Double lat,
            @DecimalMin(value = "-180", message = "Invalid longitude") @DecimalMax(value = "180", message = "Invalid longitude")
            Double lng) {}

    public enum Severity { INFO, WARNING, BLOCKER }

    public enum Verdict {
        /** Good to book. */
        OK,
        /** Can book, but the driver should read the warnings. */
        WARNING,
        /** Booking this charger would fail (plug doesn't fit, charger broken, station closed for maintenance). */
        BLOCKED
    }

    public record Check(String code, Severity severity, String message) {}

    public record PreBookingResult(
            Verdict verdict,
            VehicleBrief vehicle,
            Long stationId,
            String stationName,
            /** The charger that was checked (picked or recommended); null if none fits. */
            Long chargerId,
            String chargerLabel,
            BigDecimal effectivePowerKw,
            /** Best alternative at this station when the checked charger is blocked. */
            Long recommendedChargerId,
            String recommendedChargerLabel,
            List<Check> checks) {}
}
