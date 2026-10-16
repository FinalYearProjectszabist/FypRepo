package com.evplatform.station.dto;

import com.evplatform.compatibility.ChargerMatch;
import com.evplatform.compatibility.CompatibilityLevel;
import com.evplatform.compatibility.CompatibilityRules;
import com.evplatform.station.Availability;
import com.evplatform.station.Charger;
import com.evplatform.station.ChargerStatus;
import com.evplatform.station.Facility;
import com.evplatform.station.SortOption;
import com.evplatform.station.StationCategory;
import com.evplatform.station.StationStatus;
import com.evplatform.vehicle.ConnectorType;
import com.evplatform.vehicle.Vehicle;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public final class StationDtos {

    private StationDtos() {}

    /**
     * Query parameters of GET /api/stations. Every filter is optional.
     * Lists accept comma separated values, e.g. connectors=CCS2,TYPE2
     */
    public record SearchParams(
            /** Free text: station name, address or city. */
            @Size(max = 80, message = "Search text must be at most 80 characters")
            String q,

            @DecimalMin(value = "-90", message = "Invalid latitude") @DecimalMax(value = "90", message = "Invalid latitude")
            Double lat,

            @DecimalMin(value = "-180", message = "Invalid longitude") @DecimalMax(value = "180", message = "Invalid longitude")
            Double lng,

            /** Only used with lat/lng. Default 25 km. */
            @DecimalMin(value = "1", message = "Radius must be at least 1 km")
            @DecimalMax(value = "500", message = "Radius must be at most 500 km")
            Double radiusKm,

            String city,
            StationCategory category,
            List<ConnectorType> connectors,

            @DecimalMin(value = "0", message = "Power must be positive") Double minPowerKw,
            @DecimalMin(value = "0", message = "Price must be positive") Double maxPrice,

            /** Only stations with a free matching charger right now. */
            Boolean availableOnly,
            /** Station statuses to include (default: all). */
            List<StationStatus> statuses,
            Boolean openNow,

            @DecimalMin(value = "0", message = "Rating must be 0-5") @DecimalMax(value = "5", message = "Rating must be 0-5")
            Double minRating,
            /** Station must have ALL of these. */
            List<Facility> facilities,

            SortOption sort,

            /** Compatibility Engine: one of the signed-in driver's vehicles. */
            Long vehicleId,
            /** With vehicleId: drop stations where nothing fits (default true). */
            Boolean hideIncompatible,

            @Min(value = 1, message = "Limit must be 1-200") @Max(value = 200, message = "Limit must be 1-200")
            Integer limit) {}

    public record StationSummary(
            Long id,
            String name,
            StationCategory category,
            String address,
            String city,
            double latitude,
            double longitude,
            StationStatus status,
            Availability availability,
            /** null when no location was given. */
            Double distanceKm,
            BigDecimal rating,
            int reviewCount,
            Set<ConnectorType> connectors,
            int totalChargers,
            int availableChargers,
            BigDecimal maxPowerKw,
            BigDecimal minPricePerKwh,
            Set<Facility> facilities,
            boolean open24Hours,
            LocalTime opensAt,
            LocalTime closesAt,
            boolean openNow,
            /** null when no vehicle was selected. */
            CompatibilityLevel compatibility,
            /** Chargers at the station that fit the car (null without a vehicle). */
            Integer compatibleChargers,
            /** Fastest speed the selected car can actually charge at here (null without a vehicle). */
            BigDecimal effectiveMaxPowerKw) {}

    public record ChargerResponse(Long id, String label, ConnectorType connectorType, BigDecimal powerKw,
                                  BigDecimal pricePerKwh, ChargerStatus status,
                                  /* Compatibility Engine fields — null without a vehicle */
                                  Boolean compatible, ChargerMatch.MatchType matchType, BigDecimal effectivePowerKw,
                                  String compatibilityNote) {
        public static ChargerResponse from(Charger c) {
            return new ChargerResponse(c.getId(), c.getLabel(), c.getConnectorType(), c.getPowerKw(),
                    c.getPricePerKwh(), c.getStatus(), null, null, null, null);
        }

        public static ChargerResponse from(Charger c, ChargerMatch m) {
            return new ChargerResponse(c.getId(), c.getLabel(), c.getConnectorType(), c.getPowerKw(),
                    c.getPricePerKwh(), c.getStatus(), m.compatible(), m.via(), m.effectivePowerKw(), m.note());
        }
    }

    /** The vehicle the results were computed for. */
    public record VehicleBrief(Long id, String name, ConnectorType connectorType,
                               Set<ConnectorType> compatibleConnectors) {
        public static VehicleBrief from(Vehicle v) {
            return v == null ? null : new VehicleBrief(v.getId(), v.getMake() + " " + v.getModel(),
                    v.getConnectorType(), CompatibilityRules.acceptedConnectors(v));
        }
    }

    public record StationDetail(StationSummary summary, String description, List<ChargerResponse> chargers,
                                VehicleBrief vehicle) {}

    public record SearchResponse(
            List<StationSummary> results,
            int total,
            /** Centre used for distances, or null. */
            Double lat,
            Double lng,
            Double radiusKm,
            SortOption sort,
            VehicleBrief vehicle) {}

    /** Values for the filter UI. */
    public record FilterOptions(
            List<String> cities,
            List<StationCategory> categories,
            List<ConnectorType> connectors,
            List<Facility> facilities,
            List<StationStatus> statuses,
            List<SortOption> sortOptions) {}
}
