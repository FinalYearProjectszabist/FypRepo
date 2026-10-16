package com.evplatform.vehicle;

import com.evplatform.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

/**
 * A driver's EV. Battery capacity and connector type feed the Compatibility Engine (Module 3)
 * and Cost Calculator (Module 4).
 */
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false, length = 40)
    private String make;

    @Column(nullable = false, length = 40)
    private String model;

    @Column(name = "manufacture_year")
    private int year;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal batteryCapacityKwh;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConnectorType connectorType;

    /**
     * Extra ports or adapters the car can use besides its main connector
     * (e.g. a Nissan Leaf has CHAdeMO for DC and Type 2 for AC). Used by the Compatibility Engine.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "vehicle_extra_connectors", joinColumns = @JoinColumn(name = "vehicle_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "connector_type", length = 20)
    private Set<ConnectorType> additionalConnectors = EnumSet.noneOf(ConnectorType.class);

    /** Max power the on-board charger accepts on AC (kW). Null = unknown. */
    @Column(precision = 5, scale = 1)
    private BigDecimal maxAcPowerKw;

    /** Max DC fast-charging power the car accepts (kW). Null = unknown. */
    @Column(precision = 5, scale = 1)
    private BigDecimal maxDcPowerKw;

    /** Full-charge range in km. */
    private int rangeKm;

    /** Current state of charge, 0–100 %. */
    private int currentBatteryPercent;

    @Column(length = 15)
    private String licensePlate;

    private boolean primaryVehicle;

    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public BigDecimal getBatteryCapacityKwh() { return batteryCapacityKwh; }
    public void setBatteryCapacityKwh(BigDecimal batteryCapacityKwh) { this.batteryCapacityKwh = batteryCapacityKwh; }

    public ConnectorType getConnectorType() { return connectorType; }
    public void setConnectorType(ConnectorType connectorType) { this.connectorType = connectorType; }

    public Set<ConnectorType> getAdditionalConnectors() { return additionalConnectors; }
    public void setAdditionalConnectors(Set<ConnectorType> additionalConnectors) {
        this.additionalConnectors = additionalConnectors;
    }

    public BigDecimal getMaxAcPowerKw() { return maxAcPowerKw; }
    public void setMaxAcPowerKw(BigDecimal maxAcPowerKw) { this.maxAcPowerKw = maxAcPowerKw; }

    public BigDecimal getMaxDcPowerKw() { return maxDcPowerKw; }
    public void setMaxDcPowerKw(BigDecimal maxDcPowerKw) { this.maxDcPowerKw = maxDcPowerKw; }

    public int getRangeKm() { return rangeKm; }
    public void setRangeKm(int rangeKm) { this.rangeKm = rangeKm; }

    public int getCurrentBatteryPercent() { return currentBatteryPercent; }
    public void setCurrentBatteryPercent(int currentBatteryPercent) { this.currentBatteryPercent = currentBatteryPercent; }

    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public boolean isPrimaryVehicle() { return primaryVehicle; }
    public void setPrimaryVehicle(boolean primaryVehicle) { this.primaryVehicle = primaryVehicle; }

    public Instant getCreatedAt() { return createdAt; }
}
