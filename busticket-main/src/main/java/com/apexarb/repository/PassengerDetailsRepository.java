package com.apexarb.repository;

import com.apexarb.entity.PassengerDetailsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PassengerDetailsRepository extends JpaRepository<PassengerDetailsEntity, Long> {

    List<PassengerDetailsEntity> findByTravelDate(String travelDate);

    List<PassengerDetailsEntity> findByOperatorIdAndTravelDate(String operatorId, String travelDate);
}
