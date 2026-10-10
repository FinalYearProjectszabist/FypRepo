package com.evplatform.station;

import com.evplatform.vehicle.ConnectorType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/** One charging point (plug) at a station. */
@Entity
@Table(name = "chargers")
public class Charger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "station_id")
    private Station station;

    /** e.g. "Bay 1" */
    @Column(nullable = false, length = 40)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConnectorType connectorType;

    /** Output power in kW (7 = AC home, 50+ = DC fast). */
    @Column(nullable = false, precision = 6, scale = 1)
    private BigDecimal powerKw;

    /** Price in PKR per kWh. */
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal pricePerKwh;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChargerStatus status = ChargerStatus.AVAILABLE;

    protected Charger() {}

    public Charger(String label, ConnectorType connectorType, BigDecimal powerKw, BigDecimal pricePerKwh,
                   ChargerStatus status) {
        this.label = label;
        this.connectorType = connectorType;
        this.powerKw = powerKw;
        this.pricePerKwh = pricePerKwh;
        this.status = status;
    }

    public Long getId() { return id; }

    public Station getStation() { return station; }
    void setStation(Station station) { this.station = station; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public ConnectorType getConnectorType() { return connectorType; }
    public void setConnectorType(ConnectorType connectorType) { this.connectorType = connectorType; }

    public BigDecimal getPowerKw() { return powerKw; }
    public void setPowerKw(BigDecimal powerKw) { this.powerKw = powerKw; }

    public BigDecimal getPricePerKwh() { return pricePerKwh; }
    public void setPricePerKwh(BigDecimal pricePerKwh) { this.pricePerKwh = pricePerKwh; }

    public ChargerStatus getStatus() { return status; }
    public void setStatus(ChargerStatus status) { this.status = status; }
}
