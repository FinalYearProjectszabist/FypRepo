package com.evplatform.vehicle;

import com.evplatform.common.ApiException;
import com.evplatform.user.UserRepository;
import com.evplatform.vehicle.dto.VehicleDtos.VehicleRequest;
import com.evplatform.vehicle.dto.VehicleDtos.VehicleResponse;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VehicleService {

    public static final int MAX_VEHICLES = 5;

    private final VehicleRepository vehicles;
    private final UserRepository users;

    public VehicleService(VehicleRepository vehicles, UserRepository users) {
        this.vehicles = vehicles;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> list(Long ownerId) {
        return vehicles.findByOwnerIdOrderByPrimaryVehicleDescIdAsc(ownerId).stream()
                .map(VehicleResponse::from).toList();
    }

    public VehicleResponse create(Long ownerId, VehicleRequest req) {
        if (vehicles.countByOwnerId(ownerId) >= MAX_VEHICLES) {
            throw ApiException.badRequest("You can add at most " + MAX_VEHICLES + " vehicles");
        }
        String plate = normalizePlate(req.licensePlate());
        if (plate != null && vehicles.existsByLicensePlateIgnoreCaseAndOwnerId(plate, ownerId)) {
            throw ApiException.conflict("You already added a vehicle with this registration number");
        }
        Vehicle v = new Vehicle();
        v.setOwner(users.getReferenceById(ownerId));
        apply(v, req, plate);
        // The first vehicle is always primary.
        boolean first = vehicles.countByOwnerId(ownerId) == 0;
        if (first || req.primaryVehicle()) {
            clearPrimary(ownerId);
            v.setPrimaryVehicle(true);
        }
        return VehicleResponse.from(vehicles.save(v));
    }

    public VehicleResponse update(Long ownerId, Long id, VehicleRequest req) {
        Vehicle v = load(ownerId, id);
        String plate = normalizePlate(req.licensePlate());
        if (plate != null && !plate.equalsIgnoreCase(v.getLicensePlate())
                && vehicles.existsByLicensePlateIgnoreCaseAndOwnerId(plate, ownerId)) {
            throw ApiException.conflict("You already added a vehicle with this registration number");
        }
        apply(v, req, plate);
        if (req.primaryVehicle() && !v.isPrimaryVehicle()) {
            clearPrimary(ownerId);
            v.setPrimaryVehicle(true);
        }
        return VehicleResponse.from(v);
    }

    public void delete(Long ownerId, Long id) {
        Vehicle v = load(ownerId, id);
        boolean wasPrimary = v.isPrimaryVehicle();
        vehicles.delete(v);
        vehicles.flush();
        if (wasPrimary) {
            vehicles.findByOwnerIdOrderByPrimaryVehicleDescIdAsc(ownerId).stream().findFirst()
                    .ifPresent(next -> next.setPrimaryVehicle(true));
        }
    }

    private Vehicle load(Long ownerId, Long id) {
        return vehicles.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> ApiException.notFound("Vehicle not found"));
    }

    private void clearPrimary(Long ownerId) {
        vehicles.findByOwnerIdOrderByPrimaryVehicleDescIdAsc(ownerId).forEach(x -> x.setPrimaryVehicle(false));
    }

    private static void apply(Vehicle v, VehicleRequest req, String plate) {
        v.setMake(req.make().trim());
        v.setModel(req.model().trim());
        v.setYear(req.year());
        v.setBatteryCapacityKwh(req.batteryCapacityKwh());
        v.setConnectorType(req.connectorType());
        v.setRangeKm(req.rangeKm());
        v.setCurrentBatteryPercent(req.currentBatteryPercent());
        v.setLicensePlate(plate);
    }

    private static String normalizePlate(String plate) {
        return plate == null || plate.isBlank() ? null : plate.trim().toUpperCase(Locale.ROOT);
    }
}
