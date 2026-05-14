package com.tourismgov.program.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tourismgov.program.entity.Resource;
import com.tourismgov.program.enums.ResourceStatus;
import com.tourismgov.program.enums.ResourceType;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
	List<Resource> findByProgram_ProgramId(Long programId);

    // OPTIMIZATION: Calculate sums entirely in the database
    @Query("SELECT COALESCE(SUM(r.quantity), 0.0) FROM Resource r WHERE r.program.programId = :programId AND r.type = :type AND r.status IN :statuses")
    Double calculateTotalQuantityByStatus(
        @Param("programId") Long programId, 
        @Param("type") ResourceType type, 
        @Param("statuses") List<ResourceStatus> statuses
    );

    // OPTIMIZATION: Count equipment without loading objects
    @Query("SELECT COUNT(r) FROM Resource r WHERE r.program.programId = :programId AND r.type = :type AND r.status != 'CANCELLED'")
    long countActiveResourcesByType(
        @Param("programId") Long programId, 
        @Param("type") ResourceType type
    );

    // Resolves the 'calculateTotalSpent' error. Calculates the budget sum strictly at the DB level.
    @Query("SELECT COALESCE(SUM(r.quantity), 0.0) FROM Resource r WHERE r.program.programId = :programId AND r.type = :type AND r.status = :status")
    Double calculateTotalSpent(@Param("programId") Long programId, @Param("type") ResourceType type, @Param("status") ResourceStatus status);

    // Resolves the 'cancelActiveResources' error. Performs a bulk update.
    @Modifying
    @Query("UPDATE Resource r SET r.status = 'CANCELLED' WHERE r.program.programId = :programId AND r.status != 'RELEASED'")
    void cancelActiveResources(@Param("programId") Long programId);
}