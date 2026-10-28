package com.apexarb.repository;

import com.apexarb.entity.BitOpCityMapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BitOpCityMapRepository extends JpaRepository<BitOpCityMapEntity, Long> {

    boolean existsByOperatorIdAndOpCityId(String operatorId, Long opCityId);

    Optional<BitOpCityMapEntity> findByOperatorIdAndOpCityId(String operatorId, Long opCityId);

    List<BitOpCityMapEntity> findByOperatorId(String operatorId);

    Optional<BitOpCityMapEntity> findByOperatorIdAndBitCityId(String operatorId, Long bitCityId);
}
