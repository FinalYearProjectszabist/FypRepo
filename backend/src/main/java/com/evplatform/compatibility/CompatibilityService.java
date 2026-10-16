package com.evplatform.compatibility;

import com.evplatform.common.ApiException;
import com.evplatform.compatibility.dto.CompatibilityDtos.Check;
import com.evplatform.compatibility.dto.CompatibilityDtos.ConnectorSupport;
import com.evplatform.compatibility.dto.CompatibilityDtos.PreBookingRequest;
import com.evplatform.compatibility.dto.CompatibilityDtos.PreBookingResult;
import com.evplatform.compatibility.dto.CompatibilityDtos.Severity;
import com.evplatform.compatibility.dto.CompatibilityDtos.Verdict;
import com.evplatform.compatibility.dto.CompatibilityDtos.VehicleCompatibility;
import com.evplatform.station.Charger;
import com.evplatform.station.ChargerStatus;
import com.evplatform.station.GeoUtils;
import com.evplatform.station.Station;
import com.evplatform.station.StationRepository;
import com.evplatform.station.StationService;
import com.evplatform.station.StationStatus;
import com.evplatform.station.dto.StationDtos.VehicleBrief;
import com.evplatform.vehicle.ConnectorType;
import com.evplatform.vehicle.Vehicle;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Module 3 — Compatibility Engine: vehicle ↔ connector matrix and the pre-booking check. */
@Service
@Transactional(readOnly = true)
public class CompatibilityService {

    /** Straight-line distance × this ≈ road distance. */
    static final double ROAD_FACTOR = 1.3;
    /** Below this effective power we show the "slow charge" estimate. */
    private static final BigDecimal SLOW_KW = new BigDecimal("11");

    private final StationService stationService;
    private final StationRepository stations;
    private final Clock clock;

    public CompatibilityService(StationService stationService, StationRepository stations, Clock clock) {
        this.stationService = stationService;
        this.stations = stations;
        this.clock = clock;
    }

    /** Vehicle Connector and Charger Type Match: which connector types this car can use, and how fast. */
    public VehicleCompatibility vehicleCompatibility(Long userId, Long vehicleId) {
        Vehicle v = stationService.vehicleOf(userId, vehicleId);
        List<ConnectorSupport> rows = Arrays.stream(ConnectorType.values()).map(type -> {
            Charger probe = new Charger("probe", type, new BigDecimal("400"), BigDecimal.ZERO, ChargerStatus.AVAILABLE);
            ChargerMatch m = CompatibilityRules.match(v, probe);
            BigDecimal limit = type.isDc() ? v.getMaxDcPowerKw() : v.getMaxAcPowerKw();
            String note = m.compatible()
                    ? m.note().replaceAll(" — charges at .*$", "") + (limit != null ? " · up to " + CompatibilityRules.strip(limit) + " kW" : "")
                    : m.note();
            return new ConnectorSupport(type, type.isDc(), m.compatible(), m.via(), limit, note);
        }).toList();
        return new VehicleCompatibility(VehicleBrief.from(v), rows);
    }

    /** Pre Booking Compatibility Warning. Called by the UI (and later the Booking module) before a booking. */
    public PreBookingResult preBookingCheck(Long userId, PreBookingRequest req) {
        Vehicle v = stationService.vehicleOf(userId, req.vehicleId());
        Station s = stations.findWithDetailsById(req.stationId())
                .orElseThrow(() -> ApiException.notFound("Station not found"));
        if ((req.lat() == null) != (req.lng() == null)) {
            throw ApiException.badRequest("Send both lat and lng, or neither");
        }

        List<Check> checks = new ArrayList<>();
        String car = v.getMake() + " " + v.getModel();

        // Best charger at this station for this car: fits, working, free first, then fastest.
        Optional<Charger> best = s.getChargers().stream()
                .filter(c -> CompatibilityRules.match(v, c).compatible())
                .filter(c -> c.getStatus() != ChargerStatus.OUT_OF_SERVICE)
                .min(Comparator.comparing((Charger c) -> c.getStatus() == ChargerStatus.AVAILABLE ? 0 : 1)
                        .thenComparing(c -> CompatibilityRules.match(v, c).effectivePowerKw(), Comparator.reverseOrder()));

        Charger checked;
        if (req.chargerId() != null) {
            checked = s.getChargers().stream().filter(c -> c.getId().equals(req.chargerId())).findFirst()
                    .orElseThrow(() -> ApiException.notFound("Charger not found at this station"));
        } else {
            checked = best.orElse(null);
        }

        // 1. Connector
        ChargerMatch match = checked == null ? null : CompatibilityRules.match(v, checked);
        if (checked == null) {
            boolean anyFits = s.getChargers().stream().anyMatch(c -> CompatibilityRules.match(v, c).compatible());
            checks.add(new Check("CONNECTOR", Severity.BLOCKER, anyFits
                    ? "Every charger that fits your " + car + " is out of service right now."
                    : "No charger at " + s.getName() + " fits your " + car + " ("
                            + CompatibilityRules.portsLabel(v) + "). Pick another station."));
        } else if (!match.compatible()) {
            checks.add(new Check("CONNECTOR", Severity.BLOCKER, checked.getLabel() + ": " + match.note() + "."
                    + best.map(b -> " Use " + b.getLabel() + " (" + CompatibilityRules.label(b.getConnectorType()) + ") instead.")
                            .orElse("")));
        } else {
            checks.add(new Check("CONNECTOR", Severity.INFO,
                    checked.getLabel() + ": " + match.note() + "."));
        }

        // 2. Station status & hours
        LocalTime now = LocalTime.now(clock);
        if (s.getStatus() != StationStatus.OPERATIONAL) {
            checks.add(new Check("STATION_STATUS", Severity.BLOCKER,
                    s.getName() + " is " + (s.getStatus() == StationStatus.MAINTENANCE ? "under maintenance" : "offline")
                            + " — chargers can't be booked right now."));
        } else if (!s.isOpenAt(now)) {
            checks.add(new Check("OPENING_HOURS", Severity.WARNING,
                    "The station is closed now" + (s.getOpensAt() != null ? " (opens at " + s.getOpensAt() + ")" : "")
                            + ". Book a slot inside opening hours."));
        }

        // 3. Charger status
        if (checked != null) {
            if (checked.getStatus() == ChargerStatus.OUT_OF_SERVICE) {
                checks.add(new Check("CHARGER_STATUS", Severity.BLOCKER, checked.getLabel() + " is out of service."));
            } else if (checked.getStatus() == ChargerStatus.OCCUPIED) {
                checks.add(new Check("CHARGER_STATUS", Severity.WARNING,
                        checked.getLabel() + " is in use right now — you may have to wait or join the queue."));
            }
        }

        // 4. Power limit & slow charging
        if (match != null && match.compatible()) {
            BigDecimal eff = match.effectivePowerKw();
            if (eff.compareTo(checked.getPowerKw()) < 0) {
                checks.add(new Check("POWER_LIMIT", Severity.INFO, "The charger gives up to "
                        + CompatibilityRules.strip(checked.getPowerKw()) + " kW but your " + car + " accepts "
                        + CompatibilityRules.strip(eff) + " kW, so it will charge at " + CompatibilityRules.strip(eff) + " kW."));
            }
            if (eff.compareTo(SLOW_KW) < 0) {
                BigDecimal needKwh = v.getBatteryCapacityKwh()
                        .multiply(BigDecimal.valueOf(100 - v.getCurrentBatteryPercent()))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                BigDecimal hours = needKwh.divide(eff, 1, RoundingMode.HALF_UP);
                checks.add(new Check("SLOW_CHARGE", Severity.WARNING, "Slow AC charging at "
                        + CompatibilityRules.strip(eff) + " kW: about " + hours.stripTrailingZeros().toPlainString()
                        + " h from " + v.getCurrentBatteryPercent() + "% to full."));
            }
        }

        // 5. Can the car reach the station on its current battery?
        if (req.lat() != null) {
            double roadKm = GeoUtils.distanceKm(req.lat(), req.lng(), s.getLatitude(), s.getLongitude()) * ROAD_FACTOR;
            int rangeLeft = Math.round(v.getRangeKm() * v.getCurrentBatteryPercent() / 100f);
            long km = Math.round(roadKm);
            if (roadKm > rangeLeft) {
                checks.add(new Check("RANGE", Severity.WARNING, "About " + km + " km by road, but your battery ("
                        + v.getCurrentBatteryPercent() + "%) has ~" + rangeLeft + " km left. You may not reach this station."));
            } else if (roadKm > rangeLeft * 0.8) {
                checks.add(new Check("RANGE", Severity.WARNING, "About " + km + " km by road with ~" + rangeLeft
                        + " km of range left — very little margin."));
            } else {
                checks.add(new Check("RANGE", Severity.INFO, "About " + km + " km away — within your ~" + rangeLeft + " km range."));
            }
        }

        Verdict verdict = checks.stream().anyMatch(c -> c.severity() == Severity.BLOCKER) ? Verdict.BLOCKED
                : checks.stream().anyMatch(c -> c.severity() == Severity.WARNING) ? Verdict.WARNING : Verdict.OK;

        Charger recommended = best.filter(b -> checked == null || !b.getId().equals(checked.getId())).orElse(null);
        if (verdict != Verdict.BLOCKED && recommended != null
                && recommended.getStatus() != ChargerStatus.AVAILABLE) {
            recommended = null; // only suggest an alternative when it is actually better
        }
        return new PreBookingResult(verdict, VehicleBrief.from(v), s.getId(), s.getName(),
                checked == null ? null : checked.getId(), checked == null ? null : checked.getLabel(),
                match != null && match.compatible() ? match.effectivePowerKw() : null,
                recommended == null ? null : recommended.getId(), recommended == null ? null : recommended.getLabel(),
                checks);
    }
}
