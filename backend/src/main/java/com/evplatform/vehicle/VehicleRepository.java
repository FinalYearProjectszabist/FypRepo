package com.evplatform.vehicle;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByOwnerIdOrderByPrimaryVehicleDescIdAsc(Long ownerId);

    Optional<Vehicle> findByIdAndOwnerId(Long id, Long ownerId);

    long countByOwnerId(Long ownerId);

    boolean existsByLicensePlateIgnoreCaseAndOwnerId(String licensePlate, Long ownerId);
}
