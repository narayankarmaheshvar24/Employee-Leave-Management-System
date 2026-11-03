
package com.example.EmployeeLeaveManagement.repository;

import com.example.EmployeeLeaveManagement.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LeaveRequestRepository
        extends JpaRepository<LeaveRequest, Long> {

    @Query("""
        SELECT COUNT(l)
        FROM LeaveRequest l
        WHERE l.employee.id = :employeeId
          AND l.status IN ('PENDING', 'APPROVED')
          AND l.startDate <= :endDate
          AND l.endDate >= :startDate
        """)
    long countOverlappingLeaves(
            @Param("employeeId") Long employeeId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate
    );

    List<LeaveRequest> findByEmployee_Id(Long employeeId);
}
