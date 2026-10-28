package com.apexarb.repository;

import com.apexarb.entity.OperatorsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorRepository extends JpaRepository<OperatorsEntity, Integer> {

    Optional<OperatorsEntity> findByOperatorId(String operatorId);

    List<OperatorsEntity> findByActive(String active);

    List<OperatorsEntity> findByNameContainingIgnoreCase(String name);

    List<OperatorsEntity> findByNameContainingIgnoreCaseAndActive(String name, String active);
}
