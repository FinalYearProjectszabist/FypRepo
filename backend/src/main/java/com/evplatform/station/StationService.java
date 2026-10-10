package com.evplatform.station;

import com.evplatform.common.ApiException;
import com.evplatform.station.dto.StationDtos.ChargerResponse;
import com.evplatform.station.dto.StationDtos.FilterOptions;
import com.evplatform.station.dto.StationDtos.SearchParams;
import com.evplatform.station.dto.StationDtos.SearchResponse;
import com.evplatform.station.dto.StationDtos.StationDetail;
import com.evplatform.station.dto.StationDtos.StationSummary;
import com.evplatform.vehicle.ConnectorType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Station Discovery: location based search, category, filters (connector, power, price,
 * availability/status, rating, facilities, open now) and sort options.
 */
@Service
@Transactional(readOnly = true)
public class StationService {

    public static final double DEFAULT_RADIUS_KM = 25;
    private static final int DEFAULT_LIMIT = 100;

    private final StationRepository stations;
    private final Clock clock;

    public StationService(StationRepository stations, Clock clock) {
        this.stations = stations;
        this.clock = clock;
    }

    public SearchResponse search(SearchParams p) {
        boolean hasLocation = p.lat() != null && p.lng() != null;
        if ((p.lat() == null) != (p.lng() == null)) {
            throw ApiException.badRequest("Send both lat and lng, or neither");
        }
        double radius = p.radiusKm() != null ? p.radiusKm() : DEFAULT_RADIUS_KM;

        List<Station> candidates = hasLocation
                ? stations.findInBox(p.lat() - GeoUtils.latDelta(radius), p.lat() + GeoUtils.latDelta(radius),
                        p.lng() - GeoUtils.lngDelta(radius, p.lat()), p.lng() + GeoUtils.lngDelta(radius, p.lat()))
                : stations.findAllWithDetails();

        LocalTime now = LocalTime.now(clock);
        Set<ConnectorType> connectors = toSet(p.connectors(), ConnectorType.class);
        Set<StationStatus> statuses = toSet(p.statuses(), StationStatus.class);
        Set<Facility> facilities = toSet(p.facilities(), Facility.class);
        String q = p.q() == null || p.q().isBlank() ? null : p.q().trim().toLowerCase(Locale.ROOT);

        List<StationSummary> results = candidates.stream()
                .filter(s -> p.category() == null || s.getCategory() == p.category())
                .filter(s -> p.city() == null || p.city().isBlank() || s.getCity().equalsIgnoreCase(p.city().trim()))
                .filter(s -> q == null || matchesText(s, q))
                .filter(s -> statuses.isEmpty() || statuses.contains(s.getStatus()))
                .filter(s -> facilities.isEmpty() || s.getFacilities().containsAll(facilities))
                .filter(s -> p.minRating() == null || s.getRating().doubleValue() >= p.minRating())
                .filter(s -> !Boolean.TRUE.equals(p.openNow()) || s.isOpenAt(now))
                .map(s -> summarize(s, connectors, now, hasLocation ? p.lat() : null, hasLocation ? p.lng() : null))
                .filter(Objects::nonNull)
                .filter(s -> !hasLocation || s.distanceKm() <= radius)
                .filter(s -> p.minPowerKw() == null || s.maxPowerKw().doubleValue() >= p.minPowerKw())
                .filter(s -> p.maxPrice() == null || s.minPricePerKwh().doubleValue() <= p.maxPrice())
                .filter(s -> !Boolean.TRUE.equals(p.availableOnly()) || s.availability() == Availability.AVAILABLE)
                .sorted(comparator(p.sort(), hasLocation))
                .toList();

        int total = results.size();
        int limit = p.limit() != null ? p.limit() : DEFAULT_LIMIT;
        SortOption sort = effectiveSort(p.sort(), hasLocation);
        return new SearchResponse(results.subList(0, Math.min(limit, total)), total,
                hasLocation ? p.lat() : null, hasLocation ? p.lng() : null, hasLocation ? radius : null, sort);
    }

    public StationDetail get(Long id, Double lat, Double lng) {
        Station s = stations.findWithDetailsById(id).orElseThrow(() -> ApiException.notFound("Station not found"));
        StationSummary summary = summarize(s, Set.of(), LocalTime.now(clock), lat, lng);
        List<ChargerResponse> chargers = s.getChargers().stream().map(ChargerResponse::from).toList();
        return new StationDetail(summary, s.getDescription(), chargers);
    }

    public FilterOptions filterOptions() {
        return new FilterOptions(stations.findCities(), List.of(StationCategory.values()),
                List.of(ConnectorType.values()), List.of(Facility.values()), List.of(StationStatus.values()),
                List.of(SortOption.values()));
    }

    // ---------- helpers ----------

    /**
     * Builds the summary using only chargers that match the requested connectors.
     * Returns null when the station has no matching charger at all.
     */
    private StationSummary summarize(Station s, Set<ConnectorType> connectors, LocalTime now, Double lat, Double lng) {
        List<Charger> matching = s.getChargers().stream()
                .filter(c -> connectors.isEmpty() || connectors.contains(c.getConnectorType()))
                .toList();
        if (matching.isEmpty()) {
            return null;
        }
        boolean open = s.isOpenAt(now);
        boolean operational = s.getStatus() == StationStatus.OPERATIONAL;
        int available = operational && open
                ? (int) matching.stream().filter(c -> c.getStatus() == ChargerStatus.AVAILABLE).count()
                : 0;
        boolean anyWorking = matching.stream().anyMatch(c -> c.getStatus() != ChargerStatus.OUT_OF_SERVICE);

        Availability availability;
        if (!operational || !anyWorking) {
            availability = Availability.UNAVAILABLE;
        } else if (!open) {
            availability = Availability.CLOSED;
        } else {
            availability = available > 0 ? Availability.AVAILABLE : Availability.BUSY;
        }

        Double distance = lat == null || lng == null ? null
                : BigDecimal.valueOf(GeoUtils.distanceKm(lat, lng, s.getLatitude(), s.getLongitude()))
                        .setScale(2, RoundingMode.HALF_UP).doubleValue();

        return new StationSummary(
                s.getId(), s.getName(), s.getCategory(), s.getAddress(), s.getCity(),
                s.getLatitude(), s.getLongitude(), s.getStatus(), availability, distance,
                s.getRating(), s.getReviewCount(),
                matching.stream().map(Charger::getConnectorType)
                        .collect(Collectors.toCollection(() -> EnumSet.noneOf(ConnectorType.class))),
                matching.size(), available,
                matching.stream().map(Charger::getPowerKw).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO),
                matching.stream().map(Charger::getPricePerKwh).min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO),
                s.getFacilities().isEmpty() ? EnumSet.noneOf(Facility.class) : EnumSet.copyOf(s.getFacilities()),
                s.isOpen24Hours(), s.getOpensAt(), s.getClosesAt(), open);
    }

    private static boolean matchesText(Station s, String q) {
        return s.getName().toLowerCase(Locale.ROOT).contains(q)
                || s.getAddress().toLowerCase(Locale.ROOT).contains(q)
                || s.getCity().toLowerCase(Locale.ROOT).contains(q);
    }

    private static SortOption effectiveSort(SortOption requested, boolean hasLocation) {
        if (requested == null) {
            return hasLocation ? SortOption.DISTANCE : SortOption.RATING;
        }
        return requested == SortOption.DISTANCE && !hasLocation ? SortOption.RATING : requested;
    }

    private static Comparator<StationSummary> comparator(SortOption requested, boolean hasLocation) {
        Comparator<StationSummary> byDistance = Comparator.comparing(StationSummary::distanceKm,
                Comparator.nullsLast(Comparator.naturalOrder()));
        Comparator<StationSummary> byRating = Comparator.comparing(StationSummary::rating).reversed()
                .thenComparing(Comparator.comparingInt(StationSummary::reviewCount).reversed());
        Comparator<StationSummary> primary = switch (effectiveSort(requested, hasLocation)) {
            case DISTANCE -> byDistance;
            case PRICE -> Comparator.comparing(StationSummary::minPricePerKwh);
            case RATING -> byRating;
            case POWER -> Comparator.comparing(StationSummary::maxPowerKw).reversed();
            case AVAILABILITY -> Comparator.comparing((StationSummary s) -> s.availability().ordinal())
                    .thenComparing(Comparator.comparingInt(StationSummary::availableChargers).reversed());
        };
        // Stable tie-breakers: nearest, then name.
        return primary.thenComparing(byDistance).thenComparing(StationSummary::name);
    }

    private static <E extends Enum<E>> Set<E> toSet(Collection<E> values, Class<E> type) {
        if (values == null || values.isEmpty()) {
            return EnumSet.noneOf(type);
        }
        return values.stream().filter(Objects::nonNull)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(type)));
    }
}
