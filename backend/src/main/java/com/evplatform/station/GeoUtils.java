package com.evplatform.station;

/** Great-circle distance helpers. */
public final class GeoUtils {

    private static final double EARTH_RADIUS_KM = 6371.0088;

    private GeoUtils() {}

    /** Haversine distance in km. */
    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
    }

    /** Degrees of latitude covering the given km. */
    public static double latDelta(double km) {
        return km / 111.32;
    }

    /** Degrees of longitude covering the given km at a latitude. */
    public static double lngDelta(double km, double atLat) {
        double cos = Math.cos(Math.toRadians(atLat));
        return cos < 1e-6 ? 180 : km / (111.32 * cos);
    }
}
