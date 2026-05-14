package com.tourismgov.compliance.entity;

import java.time.LocalDateTime;

import com.tourismgov.compliance.enums.AuditStatus;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "audits",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_officer_scope_date", 
            columnNames = {"officer_id", "scope", "audit_date"}
        )
    }
)
@Getter              
@Setter              
@NoArgsConstructor
public class Audit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    // Cross-service ID reference (User Service)
    @Column(name = "officer_id", nullable = false)
    private Long officerId;

    @Column(length = 100)
    private String scope;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @CreationTimestamp
    @Column(name = "audit_date", updatable = false)
    private LocalDateTime date;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AuditStatus status = AuditStatus.PLANNED;
}