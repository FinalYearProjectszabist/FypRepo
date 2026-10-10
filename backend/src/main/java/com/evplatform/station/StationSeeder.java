package com.evplatform.station;

import com.evplatform.vehicle.ConnectorType;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Demo stations across Pakistan so Station Discovery has data before the Owner Management
 * module exists. Runs only when the stations table is empty. Names are fictional.
 * Disable with app.seed.stations=false.
 */
@Component
@Order(10)
@ConditionalOnProperty(name = "app.seed.stations", havingValue = "true", matchIfMissing = true)
public class StationSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StationSeeder.class);

    private final StationRepository stations;

    public StationSeeder(StationRepository stations) {
        this.stations = stations;
    }

    /** Charger spec: "CONNECTOR:kW:PKR-per-kWh:A|O|X" (Available / Occupied / out of service). */
    private record Seed(String name, StationCategory category, String address, String city, double lat, double lng,
                        StationStatus status, String hours, double rating, int reviews, List<Facility> facilities,
                        List<String> chargers, String description) {}

    private static final StationCategory P = StationCategory.PUBLIC;
    private static final StationCategory B = StationCategory.BUSINESS;
    private static final StationCategory H = StationCategory.HOME;
    private static final StationStatus OK = StationStatus.OPERATIONAL;

    private static final List<Seed> SEEDS = List.of(
            // ---------- Islamabad ----------
            new Seed("Blue Area Supercharge Hub", P, "Jinnah Avenue, Blue Area", "Islamabad", 33.7086, 73.0551, OK,
                    "24h", 4.6, 212, List.of(Facility.WIFI, Facility.RESTROOM, Facility.CAFE, Facility.PARKING, Facility.CCTV),
                    List.of("CCS2:120:105:A", "CCS2:120:105:O", "CHADEMO:50:98:A", "TYPE2:22:72:A"),
                    "Flagship DC fast-charging hub in the heart of Islamabad's business district."),
            new Seed("F-7 Markaz Café Charge", B, "Jinnah Super Market, F-7 Markaz", "Islamabad", 33.7208, 73.0560, OK,
                    "09:00-23:30", 4.4, 98, List.of(Facility.WIFI, Facility.CAFE, Facility.RESTROOM, Facility.WAITING_LOUNGE),
                    List.of("TYPE2:22:70:A", "TYPE2:11:65:O"),
                    "Charge while you enjoy coffee — two AC points in the café parking."),
            new Seed("Centaurus Mall EV Point", B, "Jinnah Avenue, F-8/4", "Islamabad", 33.7077, 73.0498, OK,
                    "10:00-22:00", 4.2, 154, List.of(Facility.SHOPPING, Facility.RESTAURANT, Facility.RESTROOM,
                            Facility.PARKING, Facility.PRAYER_AREA, Facility.WHEELCHAIR_ACCESS, Facility.CCTV),
                    List.of("CCS2:60:99:O", "CCS2:60:99:O", "TYPE2:22:75:A"),
                    "Basement level B2 chargers — shop while your car charges."),
            new Seed("F-6 Super Market Charging", P, "Kohsar Market Road, F-6", "Islamabad", 33.7294, 73.0753, OK,
                    "07:00-23:00", 4.0, 61, List.of(Facility.PARKING, Facility.CAFE),
                    List.of("CCS2:50:95:A", "TYPE2:22:70:A"), null),
            new Seed("G-9 Markaz Quick Charge", P, "Karachi Company, G-9 Markaz", "Islamabad", 33.6939, 73.0303, OK,
                    "24h", 3.8, 47, List.of(Facility.PARKING, Facility.RESTROOM),
                    List.of("CCS2:60:96:O", "CHADEMO:50:92:X"), null),
            new Seed("F-10 Markaz Green Plug", P, "Main Double Road, F-10 Markaz", "Islamabad", 33.6950, 73.0137,
                    StationStatus.MAINTENANCE, "06:00-24:00", 4.1, 39, List.of(Facility.PARKING, Facility.CCTV),
                    List.of("CCS2:50:94:X", "TYPE2:22:70:X"), "Temporarily closed for charger upgrades."),
            new Seed("I-8 Markaz Neighbourhood Charger", P, "I-8 Markaz Commercial", "Islamabad", 33.6687, 73.0758, OK,
                    "08:00-22:00", 4.3, 73, List.of(Facility.PARKING, Facility.PRAYER_AREA, Facility.RESTAURANT),
                    List.of("TYPE2:22:68:A", "CCS2:60:97:A"), null),
            new Seed("E-11 Home Charger (Ahmed)", H, "Street 5, E-11/3", "Islamabad", 33.6995, 72.9790, OK,
                    "08:00-21:00", 4.8, 22, List.of(Facility.PARKING, Facility.CCTV),
                    List.of("TYPE2:7.4:55:A"), "Covered driveway, please message before arriving."),
            new Seed("DHA Phase 2 Home Wallbox", H, "Sector D, DHA Phase 2", "Islamabad", 33.5293, 73.1580, OK,
                    "09:00-20:00", 4.7, 15, List.of(Facility.PARKING),
                    List.of("TYPE2:11:58:O"), null),
            new Seed("Bahria Town Civic Centre EV", P, "Civic Centre, Bahria Town Phase 4", "Islamabad", 33.5280, 73.0980,
                    OK, "24h", 4.5, 128, List.of(Facility.RESTAURANT, Facility.RESTROOM, Facility.PARKING,
                            Facility.SHOPPING, Facility.CCTV),
                    List.of("CCS2:150:110:A", "CCS2:150:110:A", "CHADEMO:50:98:O", "TYPE2:22:72:A"),
                    "Ultra-fast 150 kW chargers next to the Civic Centre food court."),
            new Seed("Airport Road Rapid Charge", P, "Srinagar Highway, near New Islamabad Airport", "Islamabad",
                    33.5600, 72.8516, OK, "24h", 4.0, 84, List.of(Facility.RESTROOM, Facility.CAFE, Facility.PRAYER_AREA),
                    List.of("CCS2:120:108:A", "CCS2:120:108:O"), null),
            new Seed("Serene Gym & Spa Charging", B, "Park Road, Chak Shahzad", "Islamabad", 33.6720, 73.1390, OK,
                    "06:00-23:00", 4.1, 29, List.of(Facility.WIFI, Facility.RESTROOM, Facility.WAITING_LOUNGE, Facility.PARKING),
                    List.of("TYPE2:22:66:A"), "Free for members during workout hours."),

            // ---------- Rawalpindi ----------
            new Seed("Saddar Rawalpindi EV Station", P, "Bank Road, Saddar", "Rawalpindi", 33.5973, 73.0479, OK,
                    "08:00-23:00", 3.9, 66, List.of(Facility.PARKING, Facility.RESTAURANT),
                    List.of("CCS2:60:95:A", "TYPE2:22:69:O"), null),
            new Seed("Satellite Town Charging Point", P, "Commercial Market, Satellite Town", "Rawalpindi", 33.6380,
                    73.0660, StationStatus.OFFLINE, "09:00-22:00", 3.5, 18, List.of(Facility.PARKING),
                    List.of("TYPE2:22:68:X"), "Offline — power supply issue reported."),

            // ---------- Lahore ----------
            new Seed("Liberty Market Supercharge", P, "Liberty Roundabout, Gulberg III", "Lahore", 31.5100, 74.3440, OK,
                    "24h", 4.5, 240, List.of(Facility.CAFE, Facility.RESTROOM, Facility.SHOPPING, Facility.PARKING, Facility.CCTV),
                    List.of("CCS2:120:104:A", "CCS2:120:104:O", "CHADEMO:50:96:A", "TYPE2:22:71:A"), null),
            new Seed("DHA Phase 5 EV Plaza", P, "Main Boulevard, DHA Phase 5", "Lahore", 31.4640, 74.4080, OK,
                    "24h", 4.7, 175, List.of(Facility.WIFI, Facility.CAFE, Facility.RESTROOM, Facility.WAITING_LOUNGE,
                            Facility.PRAYER_AREA, Facility.CCTV, Facility.WHEELCHAIR_ACCESS),
                    List.of("CCS2:150:112:A", "CCS2:150:112:A", "CCS2:60:98:O", "TYPE2:22:72:A"),
                    "Premium lounge with Wi-Fi while you charge."),
            new Seed("Johar Town Hotel Charger", B, "Khayaban-e-Firdousi, Johar Town", "Lahore", 31.4697, 74.2728, OK,
                    "24h", 4.2, 57, List.of(Facility.RESTAURANT, Facility.WIFI, Facility.RESTROOM, Facility.PARKING),
                    List.of("TYPE2:22:74:O", "CCS2:60:100:A"), null),
            new Seed("Mall Road Heritage Charging", P, "Mall Road, near Charing Cross", "Lahore", 31.5600, 74.3290, OK,
                    "07:00-23:00", 4.0, 92, List.of(Facility.PARKING, Facility.CAFE),
                    List.of("CCS2:50:95:O", "CCS2:50:95:O"), null),
            new Seed("Packages Mall EV Bay", B, "Walton Road, Nishtar Town", "Lahore", 31.4712, 74.3553, OK,
                    "11:00-22:00", 4.3, 133, List.of(Facility.SHOPPING, Facility.RESTAURANT, Facility.RESTROOM,
                            Facility.PRAYER_AREA, Facility.PARKING, Facility.WHEELCHAIR_ACCESS),
                    List.of("CCS2:60:99:A", "TYPE2:22:73:A", "TYPE2:22:73:O"), null),
            new Seed("Model Town Home Charger", H, "Block G, Model Town", "Lahore", 31.4830, 74.3260, OK,
                    "10:00-20:00", 4.6, 11, List.of(Facility.PARKING),
                    List.of("TYPE2:7.4:52:A"), null),
            new Seed("Thokar Niaz Baig Motorway Link", P, "M-2 Motorway Entry, Thokar Niaz Baig", "Lahore", 31.4730,
                    74.2410, OK, "24h", 4.1, 110, List.of(Facility.RESTROOM, Facility.RESTAURANT, Facility.PRAYER_AREA),
                    List.of("CCS2:120:106:A", "CHADEMO:50:97:A"), null),

            // ---------- Motorway M-2 ----------
            new Seed("Bhera Service Area Fast Charge", P, "M-2 Motorway, Bhera Service Area", "Bhera", 32.4810, 72.9100,
                    OK, "24h", 4.4, 301, List.of(Facility.RESTAURANT, Facility.RESTROOM, Facility.PRAYER_AREA,
                            Facility.CAFE, Facility.PARKING, Facility.CCTV),
                    List.of("CCS2:150:115:O", "CCS2:150:115:A", "CHADEMO:50:100:A"),
                    "Halfway between Islamabad and Lahore — top up during your break."),

            // ---------- Karachi ----------
            new Seed("Clifton Seaview Charging Hub", P, "Sea View Road, Clifton Block 2", "Karachi", 24.8138, 67.0300, OK,
                    "24h", 4.3, 188, List.of(Facility.CAFE, Facility.RESTROOM, Facility.PARKING, Facility.CCTV),
                    List.of("CCS2:120:107:A", "CCS2:120:107:O", "TYPE2:22:74:A"), null),
            new Seed("DHA Phase 6 EV Lounge", P, "Khayaban-e-Ittehad, DHA Phase 6", "Karachi", 24.8000, 67.0600, OK,
                    "24h", 4.6, 142, List.of(Facility.WIFI, Facility.WAITING_LOUNGE, Facility.CAFE, Facility.RESTROOM,
                            Facility.CCTV, Facility.WHEELCHAIR_ACCESS),
                    List.of("CCS2:150:112:A", "CHADEMO:50:99:A", "TYPE2:22:73:O"), null),
            new Seed("Gulshan-e-Iqbal Charge Stop", P, "University Road, Gulshan-e-Iqbal Block 13", "Karachi", 24.9220,
                    67.0940, OK, "07:00-24:00", 3.9, 74, List.of(Facility.PARKING, Facility.RESTAURANT),
                    List.of("CCS2:60:97:O", "TYPE2:22:70:O"), null),
            new Seed("Shahrah-e-Faisal Business Tower", B, "Shahrah-e-Faisal, PECHS", "Karachi", 24.8800, 67.1000, OK,
                    "08:00-20:00", 4.0, 35, List.of(Facility.PARKING, Facility.CCTV, Facility.WIFI),
                    List.of("TYPE2:22:72:A", "TYPE2:22:72:A"), "Visitor parking level 1."),
            new Seed("PECHS Home Charger (Sana)", H, "Block 6, PECHS", "Karachi", 24.8700, 67.0640, OK,
                    "10:00-21:00", 4.9, 9, List.of(Facility.PARKING),
                    List.of("TYPE2:7.4:55:A"), null)
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (stations.count() > 0) {
            return;
        }
        for (Seed seed : SEEDS) {
            stations.save(toStation(seed));
        }
        log.info("Seeded {} demo charging stations", SEEDS.size());
    }

    private static Station toStation(Seed seed) {
        Station s = new Station();
        s.setName(seed.name());
        s.setCategory(seed.category());
        s.setAddress(seed.address());
        s.setCity(seed.city());
        s.setLatitude(seed.lat());
        s.setLongitude(seed.lng());
        s.setStatus(seed.status());
        s.setDescription(seed.description());
        if ("24h".equals(seed.hours())) {
            s.setOpen24Hours(true);
        } else {
            String[] parts = seed.hours().split("-");
            s.setOpensAt(parseTime(parts[0]));
            s.setClosesAt(parseTime(parts[1]));
        }
        s.setRating(BigDecimal.valueOf(seed.rating()));
        s.setReviewCount(seed.reviews());
        s.setFacilities(seed.facilities().isEmpty() ? EnumSet.noneOf(Facility.class) : EnumSet.copyOf(seed.facilities()));
        int bay = 1;
        for (String spec : seed.chargers()) {
            String[] c = spec.split(":");
            ChargerStatus status = switch (c[3]) {
                case "O" -> ChargerStatus.OCCUPIED;
                case "X" -> ChargerStatus.OUT_OF_SERVICE;
                default -> ChargerStatus.AVAILABLE;
            };
            s.addCharger(new Charger("Bay " + bay++, ConnectorType.valueOf(c[0]), new BigDecimal(c[1]),
                    new BigDecimal(c[2]), status));
        }
        return s;
    }

    /** "24:00" means end of day. */
    private static LocalTime parseTime(String hhmm) {
        return "24:00".equals(hhmm) ? LocalTime.MAX.withNano(0) : LocalTime.parse(hhmm);
    }
}
