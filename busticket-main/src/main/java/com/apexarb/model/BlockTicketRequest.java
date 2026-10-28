package com.apexarb.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BlockTicketRequest {
    private String availableTripId;
    private String boardingPointId;
    private String droppingPointId;
    private String source;
    private String destination;
    private String operator;
    private List<InventoryItem> inventoryItems;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class InventoryItem {
        private String fare;
        private String ladiesSeat;
        private String seatName;
        private Passenger passenger;
        private PassengerGSTDetails passengerGSTDetails;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Passenger {
        private Integer age;
        private Gender gender;
        private String mobile;
        private String name;
        private Boolean primary;
        private String title;
        private String email;
        private String address;
        private String idType;
        private String idNumber;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PassengerGSTDetails {
        private String registrationName;
        private String gstId;
        private String address;
        private String emailId;
    }

    public enum Gender {
        MALE, FEMALE, OTHER;

        @JsonCreator
        public static Gender fromString(String key) {
            if (key == null) return null;
            try {
                return Gender.valueOf(key.toUpperCase());
            } catch (Exception e) {
                return OTHER;
            }
        }

        @JsonValue
        public String toValue() {
            return this.name();
        }
    }
}
