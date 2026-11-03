
package com.example.EmployeeLeaveManagement.controller;

import com.example.EmployeeLeaveManagement.entity.LeaveRequest;
import com.example.EmployeeLeaveManagement.entity.User;
import com.example.EmployeeLeaveManagement.repository.UserRepository;
import com.example.EmployeeLeaveManagement.service.LeaveRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final UserRepository userRepository;

    public LeaveRequestController(
            LeaveRequestService leaveRequestService,
            UserRepository userRepository) {
        this.leaveRequestService = leaveRequestService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveRequest applyLeave(
            @RequestBody LeaveRequest leaveRequest,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user.getEmployeeId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No employee is linked to this user"
            );
        }

        // Use the employee linked to the logged-in account.
        com.example.EmployeeLeaveManagement.entity.Employee employee =
                new com.example.EmployeeLeaveManagement.entity.Employee();
        employee.setId(user.getEmployeeId());
        leaveRequest.setEmployee(employee);

        return leaveRequestService.applyLeave(leaveRequest);
    }

    @GetMapping
    public List<LeaveRequest> getAllLeaveRequests(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if ("ADMIN".equals(user.getRole())) {
            return leaveRequestService.getAllLeaveRequests();
        }

        if (user.getEmployeeId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No employee is linked to this user"
            );
        }

        return leaveRequestService.getLeaveRequestsByEmployeeId(
                user.getEmployeeId());
    }

    @GetMapping("/{id}")
    public LeaveRequest getLeaveRequestById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        LeaveRequest leave = leaveRequestService.getLeaveRequestById(id);

        if ("ADMIN".equals(user.getRole())) {
            return leave;
        }

        if (user.getEmployeeId() == null
                || !user.getEmployeeId().equals(leave.getEmployee().getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access another employee's leave request"
            );
        }

        return leave;
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public LeaveRequest approveLeave(@PathVariable Long id) {
        return leaveRequestService.approveLeave(id);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public LeaveRequest rejectLeave(@PathVariable Long id) {
        return leaveRequestService.rejectLeave(id);
    }

    private User getLoggedInUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));
    }
}
