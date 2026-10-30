package com.apexarb.repository;

import com.apexarb.entity.ProcessedRouteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcessedRouteRepository extends JpaRepository<ProcessedRouteEntity, Long> {

    boolean existsByRouteIdAndTravelDate(String routeId, String travelDate);

    Optional<ProcessedRouteEntity> findByRouteIdAndTravelDate(String routeId, String travelDate);
}
