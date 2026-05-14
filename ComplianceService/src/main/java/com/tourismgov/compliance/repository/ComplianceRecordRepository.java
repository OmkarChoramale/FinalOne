package com.tourismgov.compliance.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tourismgov.compliance.entity.ComplianceRecord;
import com.tourismgov.compliance.enums.ComplianceResult;
import com.tourismgov.compliance.enums.ComplianceType;

@Repository
public interface ComplianceRecordRepository
        extends JpaRepository<ComplianceRecord, Long> {

    List<ComplianceRecord> findByEntityIdAndType(
            Long entityId,
            ComplianceType type);

    List<ComplianceRecord> findByResult(
            ComplianceResult result);

    boolean existsByEntityIdAndType(
            Long entityId,
            ComplianceType type);

    List<ComplianceRecord> findTop10ByOrderByDateDesc();

    boolean existsByTypeAndEntityIdAndResult(
            ComplianceType type,
            Long entityId,
            ComplianceResult result);
}