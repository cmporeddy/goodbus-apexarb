package com.apexarb.controller;

import com.apexarb.entity.BankAccountConfigEntity;
import com.apexarb.service.BankAccountConfigService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AdminBankConfigController {

    private static final Logger log = LoggerFactory.getLogger(AdminBankConfigController.class);

    public static final String ADMIN_SECURITY_PIN = "329527";

    private final BankAccountConfigService bankAccountConfigService;

    /**
     * Admin PIN Verification Endpoint (PIN: 329527)
     */
    @PostMapping(value = "/admin/verify-pin", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> verifyPin(@RequestBody Map<String, Object> req) {
        String enteredPin = req.get("pin") != null ? req.get("pin").toString().trim() : "";
        if (ADMIN_SECURITY_PIN.equals(enteredPin)) {
            log.info("Admin PIN verification successful.");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "authenticated", true,
                    "message", "Admin access granted."
            ));
        }

        log.warn("Admin PIN verification failed for input: {}", enteredPin.replaceAll(".", "*"));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "authenticated", false,
                "error", "Invalid Admin PIN. Access denied."
        ));
    }

    /**
     * Get all configured bank accounts
     */
    @GetMapping(value = "/admin/bank-accounts", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getAllBankAccounts() {
        List<BankAccountConfigEntity> accounts = bankAccountConfigService.getAllAccounts();
        Optional<BankAccountConfigEntity> active = bankAccountConfigService.getActiveAccount();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "accounts", accounts,
                "activeAccount", active.orElse(null)
        ));
    }

    /**
     * Public endpoint for checkout portal to get the currently active receiving UPI VPA & Merchant Name
     */
    @GetMapping(value = "/active-payment-config", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getActivePaymentConfig() {
        Optional<BankAccountConfigEntity> activeOpt = bankAccountConfigService.getActiveAccount();
        if (activeOpt.isPresent()) {
            BankAccountConfigEntity active = activeOpt.get();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "upiId", active.getUpiId(),
                    "payeeName", active.getPayeeName() != null ? active.getPayeeName() : "GoodBus",
                    "bankName", active.getBankName(),
                    "accountNumber", active.getAccountNumber()
            ));
        }

        // Safe fallback if database has not populated yet
        return ResponseEntity.ok(Map.of(
                "success", true,
                "upiId", "cmporeddy-9@okaxis",
                "payeeName", "Reddy",
                "bankName", "DBS Bank",
                "accountNumber", "4657"
        ));
    }

    /**
     * Create a new bank account profile
     */
    @PostMapping(value = "/admin/bank-accounts", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> createBankAccount(@RequestBody BankAccountConfigEntity entity) {
        if (entity.getBankName() == null || entity.getBankName().trim().isEmpty() ||
                entity.getAccountNumber() == null || entity.getAccountNumber().trim().isEmpty() ||
                entity.getUpiId() == null || entity.getUpiId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Bank Name, Account Number, and UPI ID are required."
            ));
        }

        BankAccountConfigEntity saved = bankAccountConfigService.saveAccount(entity);
        log.info("Admin created new bank account profile: ID={}, bank={}, acc={}, upi={}, active={}",
                saved.getId(), saved.getBankName(), saved.getAccountNumber(), saved.getUpiId(), saved.getIsActive());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Bank account profile created successfully.",
                "account", saved
        ));
    }

    /**
     * Update an existing bank account profile
     */
    @PutMapping(value = "/admin/bank-accounts/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> updateBankAccount(
            @PathVariable Long id,
            @RequestBody BankAccountConfigEntity entity) {

        try {
            BankAccountConfigEntity updated = bankAccountConfigService.updateAccount(id, entity);
            log.info("Admin updated bank account profile ID={}: bank={}, acc={}, upi={}, active={}",
                    id, updated.getBankName(), updated.getAccountNumber(), updated.getUpiId(), updated.getIsActive());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Bank account profile updated successfully.",
                    "account", updated
            ));
        } catch (Exception e) {
            log.error("Failed to update bank account profile ID={}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Delete a bank account profile
     */
    @DeleteMapping(value = "/admin/bank-accounts/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> deleteBankAccount(@PathVariable Long id) {
        try {
            bankAccountConfigService.deleteAccount(id);
            log.info("Admin deleted bank account profile ID={}", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Bank account profile deleted successfully."
            ));
        } catch (Exception e) {
            log.error("Failed to delete bank account profile ID={}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Set a bank account profile as active
     */
    @PostMapping(value = "/admin/bank-accounts/{id}/activate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> activateBankAccount(@PathVariable Long id) {
        try {
            BankAccountConfigEntity activated = bankAccountConfigService.activateAccount(id);
            log.info("Admin activated bank account profile ID={}: bank={}, acc={}, upi={}",
                    id, activated.getBankName(), activated.getAccountNumber(), activated.getUpiId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Bank account profile set as active payment method.",
                    "account", activated
            ));
        } catch (Exception e) {
            log.error("Failed to activate bank account profile ID={}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Test / Validate an SMS text against the active configuration (or against a custom test SMS)
     */
    @PostMapping(value = "/admin/test-sms", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> testSms(@RequestBody Map<String, Object> req) {
        String smsBody = req.get("sms") != null ? req.get("sms").toString().trim() :
                (req.get("body") != null ? req.get("body").toString().trim() : "");

        Long accountId = req.get("accountId") != null ? Long.parseLong(req.get("accountId").toString()) : null;

        BankAccountConfigEntity targetConfig = null;
        if (accountId != null) {
            targetConfig = bankAccountConfigService.getAllAccounts().stream()
                    .filter(a -> a.getId().equals(accountId))
                    .findFirst()
                    .orElse(null);
        }

        Map<String, Object> parseResult = bankAccountConfigService.parseAndValidateSms(smsBody, targetConfig);
        return ResponseEntity.ok(parseResult);
    }
}
