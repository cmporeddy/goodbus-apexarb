package com.apexarb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
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
@Table(name = "passenger_details")
public class PassengerDetailsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "op_schedule_id")
    private String opScheduleId;

    @Column(name = "route_id")
    private String routeId;

    @Column(name = "operator_id")
    private String operatorId;

    @Column(name = "name")
    private String name;

    @Column(name = "age")
    private Integer age;

    @Column(name = "gender")
    private String gender;

    @Column(name = "origin_id")
    private Long originId;

    @Column(name = "origin_name")
    private String originName;

    @Column(name = "destination_id")
    private Long destinationId;

    @Column(name = "destination_name")
    private String destinationName;

    @Column(name = "from_to")
    private String fromTo;

    @Column(name = "blocking_time")
    private String blockingTime;

    @Column(name = "seat_fare")
    private String seatFare;

    @Column(name = "ticket_no")
    private String ticketNo;

    @Column(name = "is_eticket")
    private Boolean isEticket;

    @Column(name = "booking_fare")
    private String bookingFare;

    @Column(name = "phone_num")
    private String phoneNum;

    @Column(name = "country_code")
    private String countryCode;

    @Column(name = "boarding_stage", length = 1000)
    private String boardingStage;

    @Column(name = "landmark", length = 1000)
    private String landmark;

    @Column(name = "drop_off_stage", length = 1000)
    private String dropOffStage;

    @Column(name = "seat_no")
    private String seatNo;

    @Column(name = "booked_by")
    private String bookedBy;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Column(name = "can_cancel")
    private Boolean canCancel;

    @Column(name = "can_cancel_ticket_for_user")
    private Boolean canCancelTicketForUser;

    @Column(name = "can_shift_ticket")
    private Boolean canShiftTicket;

    @Column(name = "is_temporary_phone_block")
    private Boolean isTemporaryPhoneBlock;

    @Column(name = "is_phone_block")
    private Boolean isPhoneBlock;

    @Column(name = "no_of_seats")
    private Integer noOfSeats;

    @Column(name = "seat_numbers")
    private String seatNumbers;

    @Column(name = "dep_time")
    private String depTime;

    @Column(name = "travel_date")
    private String travelDate;

    @Column(name = "booked_date")
    private String bookedDate;

    @Column(name = "status")
    private Integer status;

    @Column(name = "is_his_booking")
    private Boolean isHisBooking;

    @Column(name = "booked_by_id")
    private Long bookedById;

    @Column(name = "travel_branch_id")
    private Long travelBranchId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
