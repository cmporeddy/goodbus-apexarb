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
@Table(name = "bank_account_configs")
public class BankAccountConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName; // e.g. "DBS Bank", "HDFC Bank", "SBI", "ICICI Bank"

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber; // e.g. "4657", "8821"

    @Column(name = "upi_id", nullable = false, length = 100)
    private String upiId; // e.g. "cmporeddy-9@okaxis"

    @Column(name = "payee_name", length = 100)
    private String payeeName; // e.g. "Reddy", "GoodBus"

    @Lob
    @Column(name = "sample_sms", columnDefinition = "TEXT")
    private String sampleSms;

    @Lob
    @Column(name = "match_regex", columnDefinition = "TEXT")
    private String matchRegex; // custom or auto-generated regex

    @Column(name = "sender_filter", length = 50)
    private String senderFilter; // e.g. "JM-DBSBNK-S", or empty

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
