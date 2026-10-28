package com.apexarb.controller;

import com.apexarb.model.Operators;
import com.apexarb.model.ApiResponse;
import com.apexarb.service.OperatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller to handle fetching operator data from DB
 */
@Slf4j
@RestController
@RequestMapping("/api/operators")
@RequiredArgsConstructor
public class OperatorController {

    private final OperatorService operatorService;

    @GetMapping
    public ResponseEntity<ApiResponse> getAllOperators() {
        log.info("REST request to fetch all operators");
        List<Operators> operators = operatorService.getAllOperators();
        return ResponseEntity.ok(ApiResponse.success(operators, "Fetched all operators successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getOperatorById(@PathVariable Integer id) {
        log.info("REST request to fetch operator by ID: {}", id);
        Operators operator = operatorService.getOperatorById(id);
        return ResponseEntity.ok(ApiResponse.success(operator, "Fetched operator successfully"));
    }

    @GetMapping("/operator-id/{operatorId}")
    public ResponseEntity<ApiResponse> getOperatorByOperatorId(@PathVariable String operatorId) {
        log.info("REST request to fetch operator by operator_id: {}", operatorId);
        Operators operator = operatorService.getOperatorByOperatorId(operatorId);
        return ResponseEntity.ok(ApiResponse.success(operator, "Fetched operator successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse> searchOperatorsByName(@RequestParam String name) {
        log.info("REST request to search operators by name: {}", name);
        List<Operators> operators = operatorService.searchOperatorsByName(name);
        return ResponseEntity.ok(ApiResponse.success(operators, "Search completed successfully"));
    }
}
