package com.evplatform.station;

import com.evplatform.user.User;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * A charging location (public station, business or home charger).
 * Created by station owners (Owner Management module); searched by drivers here.
 */
@Entity
@Table(name = "stations", indexes = @Index(name = "idx_station_lat_lng", columnList = "latitude, longitude"))
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StationCategory category;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(nullable = false, length = 60)
    private String city;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StationStatus status = StationStatus.OPERATIONAL;

    private boolean open24Hours;

    private LocalTime opensAt;

    private LocalTime closesAt;

    /** Average rating 0–5 (ratings themselves come with the Charger Marketplace module). */
    @Column(precision = 2, scale = 1)
    private BigDecimal rating = BigDecimal.ZERO;

    private int reviewCount;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "station_facilities", joinColumns = @JoinColumn(name = "station_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "facility", length = 30)
    private Set<Facility> facilities = EnumSet.noneOf(Facility.class);

    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private Set<Charger> chargers = new LinkedHashSet<>();

    /** Station owner; null for platform-listed public stations. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

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

    public void addCharger(Charger charger) {
        charger.setStation(this);
        chargers.add(charger);
    }

    /** True when the station is open at the given local (Pakistan) time. Handles past-midnight hours. */
    public boolean isOpenAt(LocalTime time) {
        if (open24Hours || opensAt == null || closesAt == null) {
            return open24Hours;
        }
        if (opensAt.isBefore(closesAt)) {
            return !time.isBefore(opensAt) && time.isBefore(closesAt);
        }
        return !time.isBefore(opensAt) || time.isBefore(closesAt);
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public StationCategory getCategory() { return category; }
    public void setCategory(StationCategory category) { this.category = category; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public StationStatus getStatus() { return status; }
    public void setStatus(StationStatus status) { this.status = status; }

    public boolean isOpen24Hours() { return open24Hours; }
    public void setOpen24Hours(boolean open24Hours) { this.open24Hours = open24Hours; }

    public LocalTime getOpensAt() { return opensAt; }
    public void setOpensAt(LocalTime opensAt) { this.opensAt = opensAt; }

    public LocalTime getClosesAt() { return closesAt; }
    public void setClosesAt(LocalTime closesAt) { this.closesAt = closesAt; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    public Set<Facility> getFacilities() { return facilities; }
    public void setFacilities(Set<Facility> facilities) { this.facilities = facilities; }

    public Set<Charger> getChargers() { return chargers; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
