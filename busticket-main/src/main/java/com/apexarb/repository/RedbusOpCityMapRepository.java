package com.apexarb.repository;

import com.apexarb.entity.RedbusOpCityMapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RedbusOpCityMapRepository extends JpaRepository<RedbusOpCityMapEntity, Long> {

    boolean existsByOperatorIdAndOpCityId(String operatorId, Long opCityId);

    Optional<RedbusOpCityMapEntity> findByOperatorIdAndOpCityId(String operatorId, Long opCityId);

    List<RedbusOpCityMapEntity> findByOperatorId(String operatorId);

    Optional<RedbusOpCityMapEntity> findByOperatorIdAndRedCityId(String operatorId, String redCityId);
}
