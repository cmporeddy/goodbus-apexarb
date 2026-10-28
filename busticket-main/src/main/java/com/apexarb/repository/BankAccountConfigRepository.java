package com.apexarb.repository;

import com.apexarb.entity.BankAccountConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountConfigRepository extends JpaRepository<BankAccountConfigEntity, Long> {

    Optional<BankAccountConfigEntity> findFirstByIsActiveTrue();

    List<BankAccountConfigEntity> findByIsActiveTrue();

    Optional<BankAccountConfigEntity> findByAccountNumber(String accountNumber);

    List<BankAccountConfigEntity> findAllByOrderByCreatedAtDesc();
}
