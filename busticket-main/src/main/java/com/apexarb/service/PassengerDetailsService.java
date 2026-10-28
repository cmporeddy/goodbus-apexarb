package com.apexarb.service;

import com.apexarb.entity.PassengerDetailsEntity;

import java.util.List;

public interface PassengerDetailsService {

    /**
     * Fetch schedules from operators, filter unique routes & available seats, map city IDs via MapBitOpCityService,
     * retrieve passenger details from service_details endpoint, and save records to database.
     *
     * @return List of saved PassengerDetailsEntity records.
     */
    List<PassengerDetailsEntity> processPassengerDetailsForToday();

    /**
     * Retrieve all saved passenger details for today.
     *
     * @return List of PassengerDetailsEntity records for today's travel date.
     */
    List<PassengerDetailsEntity> getPassengerDetailsForToday();
}
