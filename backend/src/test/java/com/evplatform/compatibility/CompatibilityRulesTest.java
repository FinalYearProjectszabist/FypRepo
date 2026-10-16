package com.evplatform.compatibility;

import static org.assertj.core.api.Assertions.assertThat;

import com.evplatform.compatibility.ChargerMatch.MatchType;
import com.evplatform.station.Charger;
import com.evplatform.station.ChargerStatus;
import com.evplatform.vehicle.ConnectorType;
import com.evplatform.vehicle.Vehicle;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class CompatibilityRulesTest {

    private static Vehicle car(ConnectorType main, Double maxAc, Double maxDc, ConnectorType... extra) {
        Vehicle v = new Vehicle();
        v.setMake("Test");
        v.setModel("EV");
        v.setConnectorType(main);
        v.getAdditionalConnectors().addAll(List.of(extra));
        v.setMaxAcPowerKw(maxAc == null ? null : BigDecimal.valueOf(maxAc));
        v.setMaxDcPowerKw(maxDc == null ? null : BigDecimal.valueOf(maxDc));
        return v;
    }

    private static Charger charger(ConnectorType type, double kw) {
        return new Charger("Bay", type, BigDecimal.valueOf(kw), BigDecimal.TEN, ChargerStatus.AVAILABLE);
    }

    @Test
    void ccs2CarAlsoTakesType2AcButNotChademo() {
        Vehicle byd = car(ConnectorType.CCS2, 7.0, 88.0);
        assertThat(CompatibilityRules.acceptedConnectors(byd)).containsExactly(ConnectorType.CCS2, ConnectorType.TYPE2);

        ChargerMatch dc = CompatibilityRules.match(byd, charger(ConnectorType.CCS2, 150));
        assertThat(dc.compatible()).isTrue();
        assertThat(dc.via()).isEqualTo(MatchType.DIRECT);
        assertThat(dc.effectivePowerKw()).isEqualByComparingTo("88");   // car's DC limit

        ChargerMatch ac = CompatibilityRules.match(byd, charger(ConnectorType.TYPE2, 22));
        assertThat(ac.via()).isEqualTo(MatchType.CCS2_AC_INLET);
        assertThat(ac.effectivePowerKw()).isEqualByComparingTo("7");    // on-board charger limit

        ChargerMatch chademo = CompatibilityRules.match(byd, charger(ConnectorType.CHADEMO, 50));
        assertThat(chademo.compatible()).isFalse();
        assertThat(chademo.effectivePowerKw()).isNull();
    }

    @Test
    void multiConnectorCar() {
        Vehicle leaf = car(ConnectorType.CHADEMO, 6.6, 50.0, ConnectorType.TYPE2);
        assertThat(CompatibilityRules.acceptedConnectors(leaf)).containsExactly(ConnectorType.CHADEMO, ConnectorType.TYPE2);
        assertThat(CompatibilityRules.match(leaf, charger(ConnectorType.TYPE2, 22)).via()).isEqualTo(MatchType.ADDITIONAL_PORT);
        assertThat(CompatibilityRules.match(leaf, charger(ConnectorType.CCS2, 60)).compatible()).isFalse();
    }

    @Test
    void unknownLimitsUseChargerPowerAndLevels() {
        Vehicle v = car(ConnectorType.TYPE2, null, null);
        assertThat(CompatibilityRules.match(v, charger(ConnectorType.TYPE2, 22)).effectivePowerKw()).isEqualByComparingTo("22");

        ChargerMatch yes = CompatibilityRules.match(v, charger(ConnectorType.TYPE2, 22));
        ChargerMatch no = CompatibilityRules.match(v, charger(ConnectorType.CCS2, 60));
        assertThat(CompatibilityRules.level(List.of(yes, yes))).isEqualTo(CompatibilityLevel.COMPATIBLE);
        assertThat(CompatibilityRules.level(List.of(yes, no))).isEqualTo(CompatibilityLevel.PARTIAL);
        assertThat(CompatibilityRules.level(List.of(no))).isEqualTo(CompatibilityLevel.INCOMPATIBLE);
    }
}
