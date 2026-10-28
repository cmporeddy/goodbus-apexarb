package com.apexarb.service;

import com.apexarb.entity.RedbusOpCityMapEntity;
import com.apexarb.model.MapRedbusCityRequest;
import com.apexarb.model.MapRedbusCityResultDto;
import com.apexarb.model.Operators;
import com.apexarb.model.RedbusOpCityVerificationResultDto;
import com.apexarb.repository.RedbusOpCityMapRepository;
import com.apexarb.service.impl.MapRedbusOpCityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MapRedbusOpCityServiceTest {

    @Mock
    private OperatorService operatorService;

    @Mock
    private RedBusOAuthService redBusOAuthService;

    @Mock
    private RedbusOpCityMapRepository redbusOpCityMapRepository;

    @InjectMocks
    private MapRedbusOpCityServiceImpl mapRedbusOpCityService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testGetAllMappedCities() {
        RedbusOpCityMapEntity entity = RedbusOpCityMapEntity.builder()
                .id(1L)
                .operatorId("5615")
                .opCityId(1L)
                .redCityId("32665")
                .name("Nellore")
                .isActive("Y")
                .build();

        when(redbusOpCityMapRepository.findAll()).thenReturn(List.of(entity));

        List<RedbusOpCityMapEntity> result = mapRedbusOpCityService.getAllMappedCities();

        assertEquals(1, result.size());
        assertEquals("Nellore", result.get(0).getName());
        verify(redbusOpCityMapRepository, times(1)).findAll();
    }

    @Test
    void testGetMappedCityByOperatorIdAndOpCityId() {
        RedbusOpCityMapEntity entity = RedbusOpCityMapEntity.builder()
                .id(1L)
                .operatorId("5615")
                .opCityId(1L)
                .redCityId("32665")
                .name("Nellore")
                .isActive("Y")
                .build();

        when(redbusOpCityMapRepository.findByOperatorIdAndOpCityId("5615", 1L))
                .thenReturn(Optional.of(entity));

        RedbusOpCityMapEntity result = mapRedbusOpCityService.getMappedCityByOperatorIdAndOpCityId("5615", 1L);

        assertNotNull(result);
        assertEquals("32665", result.getRedCityId());
        verify(redbusOpCityMapRepository, times(1)).findByOperatorIdAndOpCityId("5615", 1L);
    }

    @Test
    void testVerifyCityMappingsByOperatorId_Success() throws Exception {
        RedbusOpCityMapEntity entity = RedbusOpCityMapEntity.builder()
                .id(10L)
                .operatorId("5615")
                .opCityId(1L)
                .redCityId("32665")
                .name("Nellore")
                .isActive("Y")
                .build();

        when(redbusOpCityMapRepository.findByOperatorId("5615")).thenReturn(List.of(entity));
        when(operatorService.getOperatorByOperatorId("5615")).thenReturn(null);
        when(redBusOAuthService.callRedBusApi(any())).thenReturn(null);

        RedbusOpCityVerificationResultDto result = mapRedbusOpCityService.verifyCityMappingsByOperatorId("5615");

        assertNotNull(result);
        assertEquals("5615", result.getOperatorId());
        assertEquals(1, result.getTotalMappings());
        assertEquals(1, result.getMappings().size());
        assertEquals("Nellore", result.getMappings().get(0).getOperatorCityName());
        assertEquals("Unknown / Not Found", result.getMappings().get(0).getRedbusCityName());
        assertFalse(result.getMappings().get(0).getIsMatch());
        assertEquals("RED_CITY_NOT_FOUND", result.getMappings().get(0).getStatus());

        verify(redbusOpCityMapRepository, times(1)).findByOperatorId("5615");
    }

    @Test
    void testVerifyCityMappingsByOperatorId_InvalidOperatorId() {
        assertThrows(IllegalArgumentException.class, () -> mapRedbusOpCityService.verifyCityMappingsByOperatorId(""));
    }
}

