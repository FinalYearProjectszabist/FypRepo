package com.evplatform.vehicle;

import com.evplatform.security.AuthUser;
import com.evplatform.vehicle.dto.VehicleDtos.VehicleRequest;
import com.evplatform.vehicle.dto.VehicleDtos.VehicleResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Vehicle management — DRIVER role only (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<VehicleResponse> list(@AuthenticationPrincipal AuthUser me) {
        return vehicleService.list(me.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse create(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody VehicleRequest req) {
        return vehicleService.create(me.id(), req);
    }

    @PutMapping("/{id}")
    public VehicleResponse update(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                  @Valid @RequestBody VehicleRequest req) {
        return vehicleService.update(me.id(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        vehicleService.delete(me.id(), id);
    }
}
