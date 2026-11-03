
package com.example.EmployeeLeaveManagement.controller;

import com.example.EmployeeLeaveManagement.entity.Employee;
import com.example.EmployeeLeaveManagement.entity.User;
import com.example.EmployeeLeaveManagement.repository.UserRepository;
import com.example.EmployeeLeaveManagement.service.EmployeeService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.example.EmployeeLeaveManagement.dto.CreateEmployeeRequest;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final UserRepository userRepository;

    public EmployeeController(
            EmployeeService employeeService,
            UserRepository userRepository) {
        this.employeeService = employeeService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Employee createEmployee(
            @RequestBody CreateEmployeeRequest request) {

        if (request.getEmployee() == null
                || request.getUsername() == null
                || request.getPassword() == null
                || request.getUsername().isBlank()
                || request.getPassword().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Employee details, username and password are required"
            );
        }

        if (request.getPassword().length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters"
            );
        }

        return employeeService.saveEmployee(
                request.getEmployee(),
                request.getUsername().trim(),
                request.getPassword()
        );
    }

    // ADMIN: Get All Employees
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    // EMPLOYEE: Get Own Profile
    @GetMapping("/my-profile")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public Employee getMyProfile(Authentication authentication) {

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        ));

        if (user.getEmployeeId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No employee linked to this account"
            );
        }

        return employeeService.getEmployeeById(user.getEmployeeId());
    }

    // ADMIN: Get Employee By ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Employee getEmployeeById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id);
    }

    // ADMIN: Delete Employee
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
    }
}
