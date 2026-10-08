package com.evplatform.vehicle.dto;

import com.evplatform.common.ValidationRules;
import com.evplatform.vehicle.ConnectorType;
import com.evplatform.vehicle.Vehicle;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class VehicleDtos {

    private VehicleDtos() {}

    public record VehicleRequest(
            @NotBlank(message = "Make is required")
            @Size(min = 2, max = 40, message = "Make must be 2-40 characters")
            String make,

            @NotBlank(message = "Model is required")
            @Size(min = 1, max = 40, message = "Model must be 1-40 characters")
            String model,

            @NotNull(message = "Year is required")
            @Min(value = 2010, message = "Year must be 2010 or later")
            @Max(value = 2030, message = "Year is not valid")
            Integer year,

            @NotNull(message = "Battery capacity is required")
            @DecimalMin(value = "10.0", message = "Battery capacity must be at least 10 kWh")
            @DecimalMax(value = "250.0", message = "Battery capacity must be at most 250 kWh")
            @Digits(integer = 3, fraction = 2, message = "Battery capacity can have at most 2 decimals")
            BigDecimal batteryCapacityKwh,

            @NotNull(message = "Connector type is required")
            ConnectorType connectorType,

            @NotNull(message = "Range is required")
            @Min(value = 50, message = "Range must be at least 50 km")
            @Max(value = 1200, message = "Range must be at most 1200 km")
            Integer rangeKm,

            @NotNull(message = "Current battery level is required")
            @Min(value = 0, message = "Battery level must be 0-100%")
            @Max(value = 100, message = "Battery level must be 0-100%")
            Integer currentBatteryPercent,

            @Pattern(regexp = ValidationRules.LICENSE_PLATE, message = ValidationRules.LICENSE_PLATE_MSG)
            String licensePlate,

            boolean primaryVehicle) {}

    public record VehicleResponse(
            Long id,
            String make,
            String model,
            int year,
            BigDecimal batteryCapacityKwh,
            ConnectorType connectorType,
            int rangeKm,
            int currentBatteryPercent,
            /** Derived: estimated km left at the current battery level. */
            int estimatedRangeLeftKm,
            String licensePlate,
            boolean primaryVehicle) {

        public static VehicleResponse from(Vehicle v) {
            return new VehicleResponse(v.getId(), v.getMake(), v.getModel(), v.getYear(), v.getBatteryCapacityKwh(),
                    v.getConnectorType(), v.getRangeKm(), v.getCurrentBatteryPercent(),
                    Math.round(v.getRangeKm() * v.getCurrentBatteryPercent() / 100f),
                    v.getLicensePlate(), v.isPrimaryVehicle());
        }
    }
}
