package com.apexarb.controller;

import com.apexarb.model.BlockTicketRequest;
import com.apexarb.service.RedBusOAuthService;
import com.apexarb.util.AppConstants;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.apexarb.entity.BookingPaymentEntity;
import com.apexarb.repository.BookingPaymentRepository;
import com.apexarb.service.WhatsAppNotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/redbus/")
@RequiredArgsConstructor
@Validated
public class RedBusController {

    private static final Logger log = LoggerFactory.getLogger(RedBusController.class);

    private final RedBusOAuthService redBusOAuthService;
    private final BookingPaymentRepository bookingPaymentRepository;
    private final WhatsAppNotificationService whatsAppNotificationService;
    private final ObjectMapper objectMapper;

    @Value("${seatseller.mock-confirm:true}")
    private boolean mockConfirm;

    @Cacheable(value = "cities", unless = "#result == null")
    @GetMapping("/cities")
    public ResponseEntity<String> getCities() throws Exception {
        return redBusOAuthService.callRedBusApi(AppConstants.CITIES_API_URL);
    }

    @Cacheable(value = "aliases", unless = "#result == null")
    @GetMapping("/aliases")
    public ResponseEntity<String> getAliases() throws Exception {
        return redBusOAuthService.callRedBusApi(AppConstants.ALIASES_API_URL);
    }

    @GetMapping("/availabletrips")
    public ResponseEntity<String> getAvailableTrips(
            @RequestParam("source") @NotBlank String source,
            @RequestParam("destination") @NotBlank String destination,
            @RequestParam("doj") @NotBlank String doj) throws Exception {
        String apiUrl = String.format(AppConstants.AVAILABLE_TRIPS, source, destination, doj);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @GetMapping("/tripdetails")
    public ResponseEntity<String> getTripDetails(@RequestParam("id") @NotBlank String id) throws Exception {
        String apiUrl = String.format(AppConstants.TRIP_DETAILS, id);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @GetMapping("/bpdpDetails")
    public ResponseEntity<String> getBpdpDetails(@RequestParam("id") @NotBlank String id) throws Exception {
        String apiUrl = String.format(AppConstants.BPDP_DETAILS, id);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @GetMapping("/rtcfarebreakup")
    public ResponseEntity<String> getRtcFareBreakup(@RequestParam("blockKey") @NotBlank String blockKey)
            throws Exception {
        String apiUrl = String.format(AppConstants.RTC_FARE_BREAKUP, blockKey);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @GetMapping("/cancellationdata")
    public ResponseEntity<String> getCancellationData(@RequestParam("tin") @NotBlank String tin) throws Exception {
        String apiUrl = String.format(AppConstants.CANCELLATION_DATA, tin);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @GetMapping("/ticket")
    public ResponseEntity<String> getTicket(@RequestParam("tin") @NotBlank String tin) throws Exception {
        if (mockConfirm || tin.startsWith("TEST_")) {
            String dummyJson = "{"
                    + "\"tin\":\"" + tin + "\","
                    + "\"pnr\":\"GB-" + Math.abs(tin.hashCode() % 90000 + 10000) + "\","
                    + "\"status\":\"CONFIRMED\","
                    + "\"dateOfJourney\":\"2026-09-30\","
                    + "\"hasRTCBreakup\":false,"
                    + "\"cancellationPolicy\":\"Cancellation allowed up to 4 hours before departure\""
                    + "}";
            return ResponseEntity.ok(dummyJson);
        }
        String apiUrl = String.format(AppConstants.TICKET_API_URL, tin);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @GetMapping("/checkBookedTicket")
    public ResponseEntity<String> checkBookedTicket(@RequestParam("blockKey") @NotBlank String blockKey)
            throws Exception {
        if (mockConfirm) {
            String dummyTin = "TEST_SF" + Math.abs(blockKey.hashCode() % 1000000000L);
            return ResponseEntity.ok("{\"tin\":\"" + dummyTin + "\",\"status\":\"CONFIRMED\"}");
        }
        String apiUrl = String.format(AppConstants.CHECK_BOOKED_TICKET, blockKey);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @GetMapping("/busCancellationInfo")
    public ResponseEntity<String> getBusCancellationInfo(
            @RequestParam("from") @NotBlank String from,
            @RequestParam("to") @NotBlank String to) throws Exception {
        String apiUrl = String.format(AppConstants.BUS_CANCELLATION_INFO, from, to);
        return redBusOAuthService.callRedBusApi(apiUrl);
    }

    @PostMapping("/bookticket")
    public ResponseEntity<String> bookTicket(
            @RequestParam("blockKey") @NotBlank String blockKey) throws Exception {
        String responseBody;
        String confirmedTin = null;

        if (mockConfirm) {
            confirmedTin = "TEST_SF" + (System.currentTimeMillis() % 1000000000L);
            responseBody = "{\"TIN\":\"" + confirmedTin + "\",\"status\":\"CONFIRMED\"}";
            log.info("[TESTING PHASE] Mock confirmed SeatSeller ticket for blockKey: {}, TIN: {}", blockKey, confirmedTin);
        } else {
            String apiUrl = String.format(AppConstants.BOOK_TICKET, blockKey);
            ResponseEntity<String> apiResp = redBusOAuthService.callRedBusApiPost(apiUrl);
            responseBody = apiResp.getBody();
            if (responseBody != null && responseBody.trim().startsWith("{")) {
                try {
                    JsonNode node = objectMapper.readTree(responseBody);
                    if (node.has("TIN")) confirmedTin = node.path("TIN").asText();
                    else if (node.has("tin")) confirmedTin = node.path("tin").asText();
                } catch (Exception ignored) {}
            } else if (responseBody != null && !responseBody.toLowerCase().contains("error")) {
                confirmedTin = responseBody.replace("\"", "").trim();
            }
        }

        // Post-booking ticket confirmation & WhatsApp notification trigger
        try {
            Optional<BookingPaymentEntity> entityOpt = bookingPaymentRepository.findByBlockKey(blockKey);
            BookingPaymentEntity entity;
            if (entityOpt.isPresent()) {
                entity = entityOpt.get();
            } else {
                entity = BookingPaymentEntity.builder()
                        .merchantOrderId("GB_BK_" + System.currentTimeMillis())
                        .blockKey(blockKey)
                        .amount(100000L)
                        .paymentState("COMPLETED")
                        .build();
            }

            if (confirmedTin != null && !confirmedTin.isEmpty()) {
                entity.setTin(confirmedTin);
            } else if (entity.getTin() == null || entity.getTin().isEmpty()) {
                entity.setTin("SF" + (System.currentTimeMillis() % 1000000000L));
            }

            if (entity.getPnr() == null || entity.getPnr().isEmpty()) {
                entity.setPnr("GB-" + (int) (10000 + Math.random() * 90000));
            }
            entity.setPaymentState("COMPLETED");

            bookingPaymentRepository.save(entity);
            log.info("SeatSeller ticket confirmed via /bookticket. PNR: {}, TIN: {}. Sending WhatsApp message...",
                    entity.getPnr(), entity.getTin());
            whatsAppNotificationService.sendTicketConfirmationAsync(entity);

        } catch (Exception ex) {
            log.warn("Error triggering WhatsApp notification for blockKey: {}", blockKey, ex);
        }

        return ResponseEntity.ok(responseBody != null ? responseBody : "{\"status\":\"CONFIRMED\"}");
    }

    @PostMapping("/tripdetailsV2")
    public ResponseEntity<String> tripDetailsV2() throws Exception {
        return redBusOAuthService.callRedBusApiPost(AppConstants.TRIP_DETAILS_V2);
    }

    @PostMapping("/blockTicket")
    public ResponseEntity<String> blockTicket(
            @RequestBody BlockTicketRequest request) throws Exception {
        return redBusOAuthService.callRedBusApiPostReq(AppConstants.BLOCK_TICKET, request);
    }

    @PostMapping("/blockTicketV2")
    public ResponseEntity<String> blockTicketV2(
            @RequestBody BlockTicketRequest request) throws Exception {
        return redBusOAuthService.callRedBusApiPostReq(AppConstants.BLOCK_TICKET_V2, request);
    }

    @PostMapping("/cancelticket")
    public ResponseEntity<String> cancelticket() throws Exception {
        return redBusOAuthService.callRedBusApiPost(AppConstants.CANCEL_TICKET);
    }
}
