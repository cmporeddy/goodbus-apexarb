package com.apexarb.service.impl;

import com.apexarb.entity.OperatorsEntity;
import com.apexarb.exception.OperatorServiceException;
import com.apexarb.exception.ResourceNotFoundException;
import com.apexarb.model.Operators;
import com.apexarb.repository.OperatorRepository;
import com.apexarb.service.OperatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperatorServiceImpl implements OperatorService {

    private final OperatorRepository operatorRepository;

    @Override
    public List<Operators> getAllOperators() {
        log.info("Fetching all active operators from database");
        try {
            List<OperatorsEntity> entities = operatorRepository.findByActive("Y");
            log.info("Successfully fetched {} active operators from database", entities.size());
            return entities.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to fetch operators from database", e);
            throw new OperatorServiceException("Error occurred while fetching operators from database", e);
        }
    }

    @Override
    public Operators getOperatorById(Integer id) {
        log.info("Fetching operator from database with ID: {}", id);
        try {
            OperatorsEntity entity = operatorRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + id));
            log.info("Successfully fetched operator: {} for ID: {}", entity.getName(), id);
            return convertToDto(entity);
        } catch (ResourceNotFoundException e) {
            log.warn("Operator not found for ID: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch operator with ID: {}", id, e);
            throw new OperatorServiceException("Error occurred while fetching operator with ID: " + id, e);
        }
    }

    @Override
    public Operators getOperatorByOperatorId(String operatorId) {
        log.info("Fetching operator from database with operator_id: {}", operatorId);
        try {
            OperatorsEntity entity = operatorRepository.findByOperatorId(operatorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Operator not found with operator_id: " + operatorId));
            log.info("Successfully fetched operator: {} for operator_id: {}", entity.getName(), operatorId);
            return convertToDto(entity);
        } catch (ResourceNotFoundException e) {
            log.warn("Operator not found for operator_id: {}", operatorId);
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch operator with operator_id: {}", operatorId, e);
            throw new OperatorServiceException("Error occurred while fetching operator with operator_id: " + operatorId, e);
        }
    }

    @Override
    public List<Operators> searchOperatorsByName(String name) {
        log.info("Searching active operators in database with name containing: {}", name);
        try {
            List<OperatorsEntity> entities = operatorRepository.findByNameContainingIgnoreCaseAndActive(name, "Y");
            log.info("Found {} active operators matching name: {}", entities.size(), name);
            return entities.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to search operators with name: {}", name, e);
            throw new OperatorServiceException("Error occurred while searching operators with name: " + name, e);
        }
    }

    private Operators convertToDto(OperatorsEntity entity) {
        if (entity == null) {
            return null;
        }
        return Operators.builder()
                .id(entity.getId())
                .operatorId(entity.getOperatorId())
                .name(entity.getName())
                .operatorUrl(entity.getOperatorUrl())
                .apiKey(entity.getApiKey())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .build();
    }
}
