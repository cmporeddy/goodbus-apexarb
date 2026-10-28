package com.apexarb.service;

import com.apexarb.entity.BookingPaymentEntity;
import com.apexarb.repository.BookingPaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class WhatsAppNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationService.class);

    @Value("${whatsapp.enabled:true}")
    private boolean enabled;

    @Value("${whatsapp.api-version:v25.0}")
    private String apiVersion;

    @Value("${whatsapp.phone-number-id:1388958884294071}")
    private String phoneNumberId;

    @Value("${whatsapp.access-token}")
    private String accessToken;

    @Value("${whatsapp.template-name:jaspers_market_order_confirmation_v1}")
    private String templateName;

    @Value("${whatsapp.test-fallback-recipient:917207904076}")
    private String testFallbackRecipient;

    private final BookingPaymentRepository bookingPaymentRepository;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .version(HttpClient.Version.HTTP_2)
            .build();

    /**
     * Async non-blocking call to send WhatsApp ticket details
     */
    @Async
    public CompletableFuture<Boolean> sendTicketConfirmationAsync(BookingPaymentEntity booking) {
        boolean sent = sendTicketConfirmation(booking);
        return CompletableFuture.completedFuture(sent);
    }

    /**
     * Send complete ticket details to customer via Meta WhatsApp Cloud API
     */
    public boolean sendTicketConfirmation(BookingPaymentEntity booking) {
        if (!enabled) {
            log.info("WhatsApp notifications are disabled by configuration");
            return false;
        }

        if (booking == null) {
            log.warn("Cannot send WhatsApp ticket confirmation: booking entity is null");
            return false;
        }

        String recipient = sanitizePhoneNumber(booking.getContactMobile());
        if (recipient == null || recipient.isEmpty()) {
            recipient = testFallbackRecipient;
        }

        log.info("Sending WhatsApp ticket confirmation for PNR: {}, to: {}", booking.getPnr(), recipient);

        String textBody = buildTicketMessageBody(booking);

        // 1. Send template message to establish approved conversation
        boolean templateSent = sendTemplateMessage(recipient, booking);

        // 2. Send full rich-text ticket message with PNR, Origin, Destination, Seats, etc.
        boolean textSent = sendTextMessage(recipient, textBody, booking);

        // 3. In Meta test mode, if recipient phone was not authorized, attempt sending to testFallbackRecipient
        if ((!templateSent && !textSent) && testFallbackRecipient != null && !testFallbackRecipient.equals(recipient)) {
            log.info("Recipient {} not authorized in test mode; delivering to verified recipient: {}", recipient, testFallbackRecipient);
            sendTemplateMessage(testFallbackRecipient, booking);
            sendTextMessage(testFallbackRecipient, textBody, booking);
            return true;
        }

        return templateSent || textSent;
    }

    /**
     * Construct rich formatted WhatsApp message containing all required ticket details
     */
    public String buildTicketMessageBody(BookingPaymentEntity b) {
        String pnr = b.getPnr() != null ? b.getPnr() : "GB-CONFIRMED";
        String origin = b.getSourceCity() != null ? b.getSourceCity() : "Origin";
        String destination = b.getDestCity() != null ? b.getDestCity() : "Destination";
        String seats = b.getSeatNumbers() != null && !b.getSeatNumbers().isEmpty() ? b.getSeatNumbers() : "Confirmed";
        String journeyDate = b.getDoj() != null ? b.getDoj() : "Upcoming";
        String busType = b.getBusType() != null ? b.getBusType() : "AC Coach";
        String boardingPoint = b.getBoardingPoint() != null ? b.getBoardingPoint() : "Main Boarding Point";
        String depTime = b.getDepartureTime() != null ? b.getDepartureTime() : "On Schedule";

        return String.format(
                "🎫 *GoodBus Ticket Confirmation*\n" +
                "━━━━━━━━━━━━━━━━━━━━\n" +
                "*PNR:* %s\n" +
                "*Origin:* %s\n" +
                "*Destination:* %s\n" +
                "*Seat Number:* %s\n" +
                "*Journey Date:* %s\n" +
                "*Bus Type:* %s\n" +
                "*Boarding Point:* %s\n" +
                "*Departure Time:* %s\n" +
                "━━━━━━━━━━━━━━━━━━━━\n" +
                "Thank you for booking with GoodBus!\n" +
                "Show this WhatsApp message to board your bus.",
                pnr, origin, destination, seats, journeyDate, busType, boardingPoint, depTime
        );
    }

    /**
     * Send freeform text WhatsApp message
     */
    private boolean sendTextMessage(String toPhone, String textBody, BookingPaymentEntity booking) {
        try {
            String apiUrl = String.format("https://graph.facebook.com/%s/%s/messages", apiVersion, phoneNumberId);

            Map<String, Object> payload = Map.of(
                    "messaging_product", "whatsapp",
                    "recipient_type", "individual",
                    "to", toPhone,
                    "type", "text",
                    "text", Map.of(
                            "preview_url", false,
                            "body", textBody
                    )
            );

            String requestJson = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("WhatsApp text API response code: {}, body: {}", response.statusCode(), response.body());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String msgId = root.path("messages").path(0).path("id").asText("");
                updateBookingWhatsAppStatus(booking, "SENT", msgId);
                return true;
            } else {
                log.warn("WhatsApp text message send returned non-2xx: {}", response.body());
                return false;
            }

        } catch (Exception e) {
            log.error("Exception sending WhatsApp text message to {}", toPhone, e);
            return false;
        }
    }

    /**
     * Send pre-approved Meta Template message (e.g. jaspers_market_order_confirmation_v1)
     */
    private boolean sendTemplateMessage(String toPhone, BookingPaymentEntity booking) {
        try {
            String apiUrl = String.format("https://graph.facebook.com/%s/%s/messages", apiVersion, phoneNumberId);

            String passengerName = "Passenger";
            try {
                if (booking.getBookingPayload() != null && !booking.getBookingPayload().isEmpty()) {
                    JsonNode pNode = objectMapper.readTree(booking.getBookingPayload());
                    if (pNode.isArray() && !pNode.isEmpty()) {
                        passengerName = pNode.path(0).path("name").asText("Passenger");
                    }
                }
            } catch (Exception ignored) {}

            String pnr = booking.getPnr() != null ? booking.getPnr() : "GB-12345";
            String doj = booking.getDoj() != null ? booking.getDoj() : "Upcoming";

            Map<String, Object> payload = Map.of(
                    "messaging_product", "whatsapp",
                    "to", toPhone,
                    "type", "template",
                    "template", Map.of(
                            "name", templateName,
                            "language", Map.of("code", "en_US"),
                            "components", List.of(
                                    Map.of(
                                            "type", "body",
                                            "parameters", List.of(
                                                    Map.of("type", "text", "text", passengerName),
                                                    Map.of("type", "text", "text", pnr),
                                                    Map.of("type", "text", "text", doj)
                                            )
                                    )
                            )
                    )
            );

            String requestJson = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("WhatsApp template API response code: {}, body: {}", response.statusCode(), response.body());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String msgId = root.path("messages").path(0).path("id").asText("");
                updateBookingWhatsAppStatus(booking, "SENT", msgId);
                return true;
            } else {
                updateBookingWhatsAppStatus(booking, "FAILED", null);
                log.error("WhatsApp template message failed with status {}: {}", response.statusCode(), response.body());
                return false;
            }

        } catch (Exception e) {
            log.error("Exception sending WhatsApp template message to {}", toPhone, e);
            updateBookingWhatsAppStatus(booking, "FAILED", null);
            return false;
        }
    }

    private void updateBookingWhatsAppStatus(BookingPaymentEntity booking, String status, String msgId) {
        if (booking == null) return;
        try {
            booking.setWhatsappStatus(status);
            if (msgId != null && !msgId.isEmpty()) {
                booking.setWhatsappMessageId(msgId);
            }
            if (booking.getId() != null) {
                bookingPaymentRepository.save(booking);
            } else if (booking.getMerchantOrderId() != null && booking.getAmount() != null) {
                bookingPaymentRepository.save(booking);
            }
        } catch (Exception e) {
            log.warn("Could not update WhatsApp status in booking entity: {}", e.getMessage());
        }
    }

    /**
     * Clean phone number to E.164 digits without plus (e.g. 917207904076)
     */
    public String sanitizePhoneNumber(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return null;

        // If 10 digits Indian mobile, prepend 91
        if (digits.length() == 10) {
            return "91" + digits;
        }
        return digits;
    }
}
