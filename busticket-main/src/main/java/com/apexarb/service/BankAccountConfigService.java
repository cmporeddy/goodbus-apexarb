package com.apexarb.service;

import com.apexarb.entity.BankAccountConfigEntity;
import com.apexarb.repository.BankAccountConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class BankAccountConfigService {

    private static final Logger log = LoggerFactory.getLogger(BankAccountConfigService.class);

    private final BankAccountConfigRepository repository;

    private static final Pattern DEBIT_PATTERN = Pattern.compile("(?i)\\b(debited|withdrawn|deducted|spent|paid\\s+rs|sent\\s+rs)\\b");
    private static final Pattern CREDIT_PATTERN = Pattern.compile("(?i)\\b(credited|received|deposit|deposited|payment\\s+received|money\\s+received|added\\s+to)\\b");
    private static final Pattern UTR_12_DIGIT_PATTERN = Pattern.compile("\\b(\\d{12})\\b");

    @PostConstruct
    public void initDefaults() {
        if (repository.count() == 0) {
            log.info("No bank account configurations found in database. Initializing default DBS Bank 4657 config...");
            BankAccountConfigEntity defaultDbs = BankAccountConfigEntity.builder()
                    .bankName("DBS Bank")
                    .accountNumber("4657")
                    .upiId("cmporeddy-9@okaxis")
                    .payeeName("Reddy")
                    .sampleSms("Dear Customer, your DBS account no XXXXXXXXXXXX4657 is credited with INR 1.00 on 28-Oct-2026 and is subject to clearance. Current Balance is INR 8559.24.")
                    .matchRegex("(?i)(?:your\\s+)?DBS\\s+account\\s+(?:no\\.?|number)?\\s*[X*x]*4657\\s+is\\s+credited\\s+with\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)")
                    .senderFilter("JM-DBSBNK-S")
                    .isActive(true)
                    .build();
            repository.save(defaultDbs);
            log.info("Default DBS Bank 4657 configuration initialized successfully with ID: {}", defaultDbs.getId());
        }
    }

    public List<BankAccountConfigEntity> getAllAccounts() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<BankAccountConfigEntity> getActiveAccount() {
        return repository.findFirstByIsActiveTrue();
    }

    @Transactional
    public BankAccountConfigEntity saveAccount(BankAccountConfigEntity entity) {
        if (entity.getMatchRegex() == null || entity.getMatchRegex().trim().isEmpty()) {
            entity.setMatchRegex(buildAutoRegex(entity.getBankName(), entity.getAccountNumber()));
        }

        if (Boolean.TRUE.equals(entity.getIsActive())) {
            deactivateAll();
        } else if (repository.count() == 0) {
            entity.setIsActive(true);
        }

        return repository.save(entity);
    }

    @Transactional
    public BankAccountConfigEntity updateAccount(Long id, BankAccountConfigEntity updated) {
        BankAccountConfigEntity existing = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Bank account profile not found with ID: " + id));

        existing.setBankName(updated.getBankName());
        existing.setAccountNumber(updated.getAccountNumber());
        existing.setUpiId(updated.getUpiId());
        existing.setPayeeName(updated.getPayeeName());
        existing.setSampleSms(updated.getSampleSms());
        existing.setSenderFilter(updated.getSenderFilter());

        if (updated.getMatchRegex() != null && !updated.getMatchRegex().trim().isEmpty()) {
            existing.setMatchRegex(updated.getMatchRegex().trim());
        } else {
            existing.setMatchRegex(buildAutoRegex(updated.getBankName(), updated.getAccountNumber()));
        }

        if (Boolean.TRUE.equals(updated.getIsActive())) {
            deactivateAll();
            existing.setIsActive(true);
        }

        return repository.save(existing);
    }

    @Transactional
    public void deleteAccount(Long id) {
        BankAccountConfigEntity existing = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Bank account profile not found with ID: " + id));

        boolean wasActive = Boolean.TRUE.equals(existing.getIsActive());
        repository.delete(existing);

        // If the deleted account was active, pick the most recent one as active
        if (wasActive) {
            List<BankAccountConfigEntity> remaining = repository.findAllByOrderByCreatedAtDesc();
            if (!remaining.isEmpty()) {
                remaining.get(0).setIsActive(true);
                repository.save(remaining.get(0));
            }
        }
    }

    @Transactional
    public BankAccountConfigEntity activateAccount(Long id) {
        BankAccountConfigEntity target = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Bank account profile not found with ID: " + id));

        deactivateAll();
        target.setIsActive(true);
        return repository.save(target);
    }

    @Transactional
    protected void deactivateAll() {
        List<BankAccountConfigEntity> all = repository.findAll();
        for (BankAccountConfigEntity b : all) {
            b.setIsActive(false);
        }
        repository.saveAll(all);
    }

    /**
     * Generates a resilient regex pattern for bank credit SMS based on bank name and account number.
     */
    public String buildAutoRegex(String bankName, String accountNumber) {
        String cleanAcc = (accountNumber != null) ? accountNumber.replaceAll("[^0-9a-zA-Z]", "") : "";
        String cleanBank = (bankName != null) ? bankName.replaceAll("[^0-9a-zA-Z]", "") : "Bank";

        if (cleanBank.equalsIgnoreCase("Federal") || cleanBank.toLowerCase().contains("federal")) {
            return "(?i)(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)\\s+(?:is\\s+)?credited\\s+to\\s+(?:your\\s+)?(?:A\\/c|account|acct)\\s*[xX*]*" + cleanAcc;
        }

        if (cleanBank.equalsIgnoreCase("DBS") || cleanBank.toLowerCase().contains("dbs")) {
            return "(?i)(?:your\\s+)?DBS\\s+account\\s+(?:no\\.?|number)?\\s*[X*x]*" + cleanAcc + "\\s+is\\s+credited\\s+with\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)";
        }

        if (cleanBank.equalsIgnoreCase("HDFC") || cleanBank.toLowerCase().contains("hdfc")) {
            return "(?i)(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)\\s+credited\\s+to\\s+HDFC\\s+Bank\\s+A\\/c\\s*[xX*]*" + cleanAcc;
        }

        if (cleanBank.equalsIgnoreCase("SBI") || cleanBank.toLowerCase().contains("state bank")) {
            return "(?i)(?:account|A\\/c)\\s*[xX*]*" + cleanAcc + "\\s+credited\\s+by\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)";
        }

        if (cleanBank.equalsIgnoreCase("ICICI") || cleanBank.toLowerCase().contains("icici")) {
            return "(?i)(?:account|A\\/c)\\s*[xX*]*" + cleanAcc + "\\s+credited\\s+with\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)";
        }

        // Universal resilient bank pattern: supports amount before credited, after credited, and around account number
        return "(?i)(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)\\s+(?:is\\s+)?credited.*?(?:a\\/c|account|acct|acc)\\s*[xX*]*" + cleanAcc +
                "|(?:a\\/c|account|acct|acc)\\s*(?:no\\.?|number)?\\s*[xX*]*" + cleanAcc + ".*?(?:is\\s+|has\\s+been\\s+)?credited\\s+(?:with|by|for)?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)" +
                "|(?:credited|received|deposit|deposited)\\s+(?:with|by|for)?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?).*?(?:a\\/c|account|acct|acc)\\s*[xX*]*" + cleanAcc;
    }

    /**
     * Parses and validates an incoming SMS body against a bank configuration.
     */
    public Map<String, Object> parseAndValidateSms(String body, BankAccountConfigEntity config) {
        Map<String, Object> result = new HashMap<>();

        if (body == null || body.trim().isEmpty()) {
            result.put("success", false);
            result.put("status", "EMPTY_SMS");
            result.put("message", "SMS text body is empty");
            return result;
        }

        // 1. Guard against Debit alerts
        boolean isDebit = DEBIT_PATTERN.matcher(body).find();
        boolean isCredit = CREDIT_PATTERN.matcher(body).find();
        if (isDebit && !isCredit) {
            result.put("success", false);
            result.put("status", "IGNORED_DEBIT");
            result.put("message", "Debit notifications cannot confirm merchant payments (money left the account).");
            return result;
        }

        if (config == null) {
            Optional<BankAccountConfigEntity> activeOpt = getActiveAccount();
            if (activeOpt.isEmpty()) {
                result.put("success", false);
                result.put("status", "NO_ACTIVE_BANK_CONFIG");
                result.put("message", "No active bank account configuration found.");
                return result;
            }
            config = activeOpt.get();
        }

        // 2. Account verification
        String targetAcc = config.getAccountNumber() != null ? config.getAccountNumber().trim() : "";
        if (!targetAcc.isEmpty() && !body.contains(targetAcc)) {
            result.put("success", false);
            result.put("status", "REJECTED_ACCOUNT_MISMATCH");
            result.put("message", String.format("SMS does not reference the active account ending in '%s'.", targetAcc));
            return result;
        }

        // 3. Match regex and extract amount
        String regexStr = config.getMatchRegex();
        if (regexStr == null || regexStr.trim().isEmpty()) {
            regexStr = buildAutoRegex(config.getBankName(), config.getAccountNumber());
        }

        Pattern pattern;
        try {
            pattern = Pattern.compile(regexStr);
        } catch (Exception e) {
            log.error("Invalid regex in bank config {}: {}", config.getId(), regexStr, e);
            pattern = Pattern.compile(buildAutoRegex(config.getBankName(), config.getAccountNumber()));
        }

        Matcher matcher = pattern.matcher(body);
        Double extractedRupees = null;

        if (matcher.find()) {
            for (int i = 1; i <= matcher.groupCount(); i++) {
                String groupVal = matcher.group(i);
                if (groupVal != null && !groupVal.trim().isEmpty()) {
                    try {
                        extractedRupees = Double.parseDouble(groupVal.replace(",", "").trim());
                        break;
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        // Fallback: If custom regex group didn't catch amount but credit pattern is evident
        if (extractedRupees == null) {
            Pattern fallbackAmount = Pattern.compile("(?i)(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)\\s+(?:is\\s+)?credited|(?:credited\\s+with|credited\\s+by|credited|deposit)\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)");
            Matcher fallbackMatcher = fallbackAmount.matcher(body);
            if (fallbackMatcher.find()) {
                String val = fallbackMatcher.group(1) != null ? fallbackMatcher.group(1) : fallbackMatcher.group(2);
                if (val != null) {
                    try {
                        extractedRupees = Double.parseDouble(val.replace(",", "").trim());
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        if (extractedRupees == null) {
            result.put("success", false);
            result.put("status", "AMOUNT_EXTRACTION_FAILED");
            result.put("message", "Could not extract credited amount using the configured bank pattern.");
            return result;
        }

        long amountPaise = Math.round(extractedRupees * 100.0);

        // 4. Extract or synthesize UTR
        String utr = null;
        Matcher utrMatcher = UTR_12_DIGIT_PATTERN.matcher(body);
        if (utrMatcher.find()) {
            utr = utrMatcher.group(1);
        } else {
            String prefix = config.getBankName() != null ? config.getBankName().replaceAll("[^0-9a-zA-Z]", "").toUpperCase() : "BANK";
            utr = prefix + "-" + targetAcc + "-" + (System.currentTimeMillis() % 10000000L);
        }

        result.put("success", true);
        result.put("status", "CONFIRMED");
        result.put("bankName", config.getBankName());
        result.put("accountNumber", config.getAccountNumber());
        result.put("upiId", config.getUpiId());
        result.put("amountRupees", extractedRupees);
        result.put("amountPaise", amountPaise);
        result.put("utr", utr);
        result.put("message", "SMS successfully validated against active bank configuration.");

        return result;
    }
}
