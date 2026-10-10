package com.evplatform.station;

import com.evplatform.station.dto.StationDtos.FilterOptions;
import com.evplatform.station.dto.StationDtos.SearchParams;
import com.evplatform.station.dto.StationDtos.SearchResponse;
import com.evplatform.station.dto.StationDtos.StationDetail;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Module 2 — Station Discovery. Available to every signed-in user. */
@RestController
@RequestMapping("/api/stations")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    /**
     * Example: /api/stations?lat=33.68&lng=73.04&radiusKm=10&category=PUBLIC&connectors=CCS2,TYPE2
     * &availableOnly=true&minRating=4&facilities=WIFI,CAFE&sort=PRICE
     */
    @GetMapping
    public SearchResponse search(@Valid @ModelAttribute SearchParams params) {
        return stationService.search(params);
    }

    @GetMapping("/filters")
    public FilterOptions filters() {
        return stationService.filterOptions();
    }

    @GetMapping("/{id}")
    public StationDetail get(@PathVariable Long id,
                             @RequestParam(required = false) Double lat,
                             @RequestParam(required = false) Double lng) {
        return stationService.get(id, lat, lng);
    }
}
