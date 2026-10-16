package com.evplatform.compatibility;

import com.evplatform.compatibility.ChargerMatch.MatchType;
import com.evplatform.station.Charger;
import com.evplatform.vehicle.ConnectorType;
import com.evplatform.vehicle.Vehicle;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;

/**
 * Module 3 — Compatibility Engine rules (pure functions, no database).
 *
 * <ul>
 *   <li>A car accepts its main connector plus any extra ports/adapters it lists.</li>
 *   <li>A CCS2 (Combo 2) inlet also accepts a Type 2 AC plug, because its top half <i>is</i> a Type 2 socket.</li>
 *   <li>Charging speed is limited by both sides: min(charger kW, car's max AC or DC kW).</li>
 * </ul>
 */
public final class CompatibilityRules {

    private CompatibilityRules() {}

    public static EnumSet<ConnectorType> sorted(Collection<ConnectorType> values) {
        return values == null || values.isEmpty() ? EnumSet.noneOf(ConnectorType.class) : EnumSet.copyOf(values);
    }

    /** Every charger connector type this car can use. */
    public static EnumSet<ConnectorType> acceptedConnectors(Vehicle v) {
        EnumSet<ConnectorType> set = EnumSet.of(v.getConnectorType());
        set.addAll(v.getAdditionalConnectors());
        if (set.contains(ConnectorType.CCS2)) {
            set.add(ConnectorType.TYPE2);
        }
        return set;
    }

    public static ChargerMatch match(Vehicle v, Charger c) {
        ConnectorType plug = c.getConnectorType();
        MatchType via;
        if (plug == v.getConnectorType()) {
            via = MatchType.DIRECT;
        } else if (v.getAdditionalConnectors().contains(plug)) {
            via = MatchType.ADDITIONAL_PORT;
        } else if (plug == ConnectorType.TYPE2 && hasCcs2(v)) {
            via = MatchType.CCS2_AC_INLET;
        } else {
            return new ChargerMatch(false, MatchType.NONE, null,
                    label(plug) + " does not fit your " + v.getMake() + " " + v.getModel()
                            + " (" + portsLabel(v) + ")");
        }

        BigDecimal carLimit = plug.isDc() ? v.getMaxDcPowerKw() : v.getMaxAcPowerKw();
        BigDecimal effective = carLimit == null ? c.getPowerKw() : c.getPowerKw().min(carLimit);
        String fit = switch (via) {
            case DIRECT -> "Fits your main " + label(plug) + " port";
            case ADDITIONAL_PORT -> "Fits your extra " + label(plug) + " port / adapter";
            case CCS2_AC_INLET -> "Type 2 AC plug fits the upper part of your CCS2 inlet";
            case NONE -> throw new IllegalStateException();
        };
        String speed = effective.compareTo(c.getPowerKw()) < 0
                ? " — charges at " + strip(effective) + " kW (your car's " + (plug.isDc() ? "DC" : "AC") + " limit)"
                : " — charges at " + strip(effective) + " kW";
        return new ChargerMatch(true, via, effective, fit + speed);
    }

    /** Station-level verdict from its chargers. */
    public static CompatibilityLevel level(List<ChargerMatch> matches) {
        long ok = matches.stream().filter(ChargerMatch::compatible).count();
        if (ok == 0) {
            return CompatibilityLevel.INCOMPATIBLE;
        }
        return ok == matches.size() ? CompatibilityLevel.COMPATIBLE : CompatibilityLevel.PARTIAL;
    }

    public static String label(ConnectorType t) {
        return switch (t) {
            case CCS2 -> "CCS2";
            case CHADEMO -> "CHAdeMO";
            case TYPE2 -> "Type 2";
        };
    }

    static String portsLabel(Vehicle v) {
        StringBuilder sb = new StringBuilder(label(v.getConnectorType()));
        sorted(v.getAdditionalConnectors()).forEach(t -> sb.append(" + ").append(label(t)));
        return sb.toString();
    }

    static String strip(BigDecimal kw) {
        return kw.stripTrailingZeros().toPlainString();
    }

    private static boolean hasCcs2(Vehicle v) {
        return v.getConnectorType() == ConnectorType.CCS2 || v.getAdditionalConnectors().contains(ConnectorType.CCS2);
    }
}
