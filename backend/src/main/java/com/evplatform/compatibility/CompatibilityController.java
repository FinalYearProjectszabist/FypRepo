package com.evplatform.compatibility;

import com.evplatform.compatibility.dto.CompatibilityDtos.PreBookingRequest;
import com.evplatform.compatibility.dto.CompatibilityDtos.PreBookingResult;
import com.evplatform.compatibility.dto.CompatibilityDtos.VehicleCompatibility;
import com.evplatform.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Module 3 — Compatibility Engine. DRIVER only (needs the driver's vehicles).
 * Station search/details also use the engine via the vehicleId parameter.
 */
@RestController
@RequestMapping("/api/compatibility")
public class CompatibilityController {

    private final CompatibilityService compatibilityService;

    public CompatibilityController(CompatibilityService compatibilityService) {
        this.compatibilityService = compatibilityService;
    }

    /** Which connector types (CCS2 / CHAdeMO / Type 2) this vehicle can use. */
    @GetMapping("/vehicles/{vehicleId}")
    public VehicleCompatibility vehicle(@AuthenticationPrincipal AuthUser me, @PathVariable Long vehicleId) {
        return compatibilityService.vehicleCompatibility(me.id(), vehicleId);
    }

    /** Run before booking: OK / WARNING / BLOCKED with reasons and a recommended charger. */
    @PostMapping("/pre-booking-check")
    public PreBookingResult preBooking(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody PreBookingRequest req) {
        return compatibilityService.preBookingCheck(me.id(), req);
    }
}
