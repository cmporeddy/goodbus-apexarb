package com.apexarb.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "booking_payments")
public class BookingPaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "merchant_order_id", nullable = false, unique = true, length = 100)
    private String merchantOrderId;

    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @Column(name = "block_key", length = 100)
    private String blockKey;

    @Column(name = "amount", nullable = false)
    private Long amount; // in paise

    @Column(name = "payment_state", nullable = false, length = 50)
    private String paymentState; // PENDING, COMPLETED, FAILED, EXPIRED

    @Column(name = "payment_mode", length = 50)
    private String paymentMode;

    @Column(name = "tin", length = 100)
    private String tin;

    @Column(name = "pnr", length = 100)
    private String pnr;

    @Column(name = "trip_id", length = 100)
    private String tripId;

    @Column(name = "source_city", length = 100)
    private String sourceCity;

    @Column(name = "dest_city", length = 100)
    private String destCity;

    @Column(name = "doj", length = 50)
    private String doj;

    @Column(name = "contact_mobile", length = 20)
    private String contactMobile;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(name = "bus_type", length = 100)
    private String busType;

    @Column(name = "boarding_point", length = 255)
    private String boardingPoint;

    @Column(name = "departure_time", length = 50)
    private String departureTime;

    @Column(name = "seat_numbers", length = 100)
    private String seatNumbers;

    @Column(name = "refund_id", length = 100)
    private String refundId;

    @Column(name = "refund_amount")
    private Long refundAmount;

    @Column(name = "refund_status", length = 50)
    private String refundStatus;

    @Column(name = "whatsapp_status", length = 50)
    private String whatsappStatus;

    @Column(name = "whatsapp_message_id", length = 100)
    private String whatsappMessageId;

    @Lob
    @Column(name = "booking_payload", columnDefinition = "TEXT")
    private String bookingPayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
