
package com.example.EmployeeLeaveManagement.service;

import com.example.EmployeeLeaveManagement.entity.Employee;
import com.example.EmployeeLeaveManagement.entity.LeaveRequest;
import com.example.EmployeeLeaveManagement.repository.EmployeeRepository;
import com.example.EmployeeLeaveManagement.repository.LeaveRequestRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;

    public LeaveRequestService(
            LeaveRequestRepository leaveRequestRepository,
            EmployeeRepository employeeRepository) {

        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public LeaveRequest applyLeave(LeaveRequest leaveRequest) {

        if (leaveRequest.getStartDate() == null
                || leaveRequest.getEndDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Start date and end date are required");
        }

        if (leaveRequest.getEndDate()
                .isBefore(leaveRequest.getStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End date cannot be before start date");
        }

        if (leaveRequest.getStartDate().isBefore(
                java.time.LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Past dates are not allowed");
        }

        if (leaveRequest.getLeaveType() == null
                || leaveRequest.getLeaveType().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Leave type is required");
        }

        if (leaveRequest.getReason() == null
                || leaveRequest.getReason().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reason is required");
        }

        if (leaveRequest.getEmployee() == null
                || leaveRequest.getEmployee().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Employee ID is required");
        }

        Long employeeId = leaveRequest.getEmployee().getId();

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found"));

        long leaveDays = ChronoUnit.DAYS.between(
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate()) + 1;

        if (employee.getLeaveBalance() == null
                || employee.getLeaveBalance() < leaveDays) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient leave balance");
        }

        long overlappingLeaves =
                leaveRequestRepository.countOverlappingLeaves(
                        employeeId,
                        leaveRequest.getStartDate(),
                        leaveRequest.getEndDate());

        if (overlappingLeaves > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You already have a pending or approved leave for these dates");
        }

        leaveRequest.setEmployee(employee);
        leaveRequest.setStatus("PENDING");

        return leaveRequestRepository.save(leaveRequest);
    }

    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAll();
    }

    public List<LeaveRequest> getLeaveRequestsByEmployeeId(
            Long employeeId) {
        return leaveRequestRepository.findByEmployee_Id(employeeId);
    }

    public LeaveRequest getLeaveRequestById(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Leave request not found"));
    }

    @Transactional
    public LeaveRequest approveLeave(Long id) {

        LeaveRequest leaveRequest = getLeaveRequestById(id);

        if (!"PENDING".equals(leaveRequest.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending leave requests can be approved");
        }

        Employee employee = leaveRequest.getEmployee();

        long leaveDays = ChronoUnit.DAYS.between(
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate()) + 1;

        if (employee.getLeaveBalance() == null
                || employee.getLeaveBalance() < leaveDays) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient leave balance");
        }

        employee.setLeaveBalance(
                employee.getLeaveBalance() - (int) leaveDays);

        employeeRepository.save(employee);

        leaveRequest.setStatus("APPROVED");

        return leaveRequestRepository.save(leaveRequest);
    }

    @Transactional
    public LeaveRequest rejectLeave(Long id) {

        LeaveRequest leaveRequest = getLeaveRequestById(id);

        if (!"PENDING".equals(leaveRequest.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending leave requests can be rejected");
        }

        leaveRequest.setStatus("REJECTED");

        return leaveRequestRepository.save(leaveRequest);
    }
}
