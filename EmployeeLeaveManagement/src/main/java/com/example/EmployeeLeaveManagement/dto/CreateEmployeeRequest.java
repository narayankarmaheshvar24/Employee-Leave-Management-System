
package com.example.EmployeeLeaveManagement.dto;

import com.example.EmployeeLeaveManagement.entity.Employee;

public class CreateEmployeeRequest {

    private Employee employee;
    private String username;
    private String password;

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
