package com.evplatform.station;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StationRepository extends JpaRepository<Station, Long> {

    /** Rough bounding-box pre-filter; exact distance is computed in StationService. */
    @EntityGraph(attributePaths = {"chargers", "facilities"})
    @Query("select distinct s from Station s where s.latitude between :minLat and :maxLat "
            + "and s.longitude between :minLng and :maxLng")
    List<Station> findInBox(double minLat, double maxLat, double minLng, double maxLng);

    @EntityGraph(attributePaths = {"chargers", "facilities"})
    @Query("select distinct s from Station s")
    List<Station> findAllWithDetails();

    @EntityGraph(attributePaths = {"chargers", "facilities"})
    Optional<Station> findWithDetailsById(Long id);

    @Query("select distinct s.city from Station s order by s.city")
    List<String> findCities();
}
