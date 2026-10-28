package com.apexarb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

import lombok.ToString;

@Entity
@Table(name = "operators")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperatorsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "operator_id", nullable = false)
    private String operatorId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "operator_url")
    private String operatorUrl;

    @Column(name = "api_key", nullable = false)
    @ToString.Exclude
    private String apiKey;

    @Column(name = "active")
    @Builder.Default
    private String active = "Y";

    @Column(name = "created_at")
    private Timestamp createdAt;

    @Column(name = "updated_at")
    private Timestamp updatedAt;
}
