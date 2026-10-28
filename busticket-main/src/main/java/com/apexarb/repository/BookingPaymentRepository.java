package com.apexarb.repository;

import com.apexarb.entity.BookingPaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingPaymentRepository extends JpaRepository<BookingPaymentEntity, Long> {
    Optional<BookingPaymentEntity> findByMerchantOrderId(String merchantOrderId);
    Optional<BookingPaymentEntity> findByRazorpayOrderId(String razorpayOrderId);
    Optional<BookingPaymentEntity> findByRazorpayPaymentId(String razorpayPaymentId);
    Optional<BookingPaymentEntity> findByBlockKey(String blockKey);
}
