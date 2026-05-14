package com.tourismgov.compliance.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tourismgov.compliance.entity.Audit;
import com.tourismgov.compliance.enums.AuditStatus;

@Repository
public interface AuditRepository extends JpaRepository<Audit, Long> {
    
    // CHANGED: 'officer' object is gone. It's now a flat 'officerId' Long field.
    List<Audit> findByOfficerId(Long officerId);
    
    // Paginated version of findByOfficerId
    Page<Audit> findByOfficerId(Long officerId, Pageable pageable);

    // Added: Filter by strongly typed enum
    List<Audit> findByStatus(AuditStatus status);

    // Added to prevent duplicate audit records 
   
    boolean existsByOfficerIdAndScopeAndDate(Long officerId, String scope, LocalDateTime date);
}