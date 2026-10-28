package com.apexarb.service;

import com.apexarb.model.Operators;

import java.util.List;

public interface OperatorService {

    List<Operators> getAllOperators();

    Operators getOperatorById(Integer id);

    Operators getOperatorByOperatorId(String operatorId);

    List<Operators> searchOperatorsByName(String name);

}
