const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

let loggedInUsername = "";
let loggedInPassword = "";

function getAuthHeaders() {
    return {
        Authorization: "Basic " +
            btoa(loggedInUsername + ":" + loggedInPassword)
    };
}

// EMPLOYEE PROFILE
async function loadMyProfile() {
    try {
        const response = await fetch("/api/employees/my-profile", {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            console.error("Profile error:", response.status);
            return;
        }

        const employee = await response.json();

        const name = document.getElementById("employeeName");
        const email = document.getElementById("employeeEmail");
        const department = document.getElementById("employeeDepartment");
        const balance = document.getElementById("leaveBalance");

        if (name) name.textContent = employee.name ?? "";
        if (email) email.textContent = employee.email ?? "";
        if (department) department.textContent = employee.department ?? "";
        if (balance) balance.textContent = employee.leaveBalance ?? 0;

    } catch (error) {
        console.error("Profile error:", error);
    }
}

// DASHBOARD STATISTICS
async function loadDashboardStats() {
    try {
        const response = await fetch("/api/leaves", {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            console.error("Statistics error:", response.status);
            return;
        }

        const leaves = await response.json();

        const total = leaves.length;
        const pending = leaves.filter(x => x.status === "PENDING").length;
        const approved = leaves.filter(x => x.status === "APPROVED").length;
        const rejected = leaves.filter(x => x.status === "REJECTED").length;

        const totalElement = document.getElementById("totalLeaves");
        const pendingElement = document.getElementById("pendingLeaves");
        const approvedElement = document.getElementById("approvedLeaves");
        const rejectedElement = document.getElementById("rejectedLeaves");

        if (totalElement) totalElement.textContent = total;
        if (pendingElement) pendingElement.textContent = pending;
        if (approvedElement) approvedElement.textContent = approved;
        if (rejectedElement) rejectedElement.textContent = rejected;

    } catch (error) {
        console.error("Statistics error:", error);
    }
}
// LOGIN
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Checking login...";

    try {
        const response = await fetch("/api/leaves", {
            headers: {
                Authorization: "Basic " + btoa(username + ":" + password)
            }
        });

        if (!response.ok) {
            message.textContent =
                response.status === 401
                    ? "Invalid username or password."
                    : "Login failed. Status: " + response.status;

            message.style.color = "red";

            sessionStorage.removeItem("loggedInUsername");
            sessionStorage.removeItem("loggedInPassword");
            return;
        }

        loggedInUsername = username;
        loggedInPassword = password;

        // SAVE LOGIN SESSION
        sessionStorage.setItem("loggedInUsername", username);
        sessionStorage.setItem("loggedInPassword", password);

        const isAdmin = username.toLowerCase() === "admin";

        document.querySelector(".login-container").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        const title = document.querySelector("#dashboard > h1");

        if (title) {
            title.textContent = isAdmin
                ? "Admin Dashboard"
                : "Employee Dashboard";
        }

        const profile = document.getElementById("profileSection");
        const employeeActions = document.getElementById("employeeActions");
        const adminActions = document.getElementById("adminActions");

        if (profile) profile.style.display = isAdmin ? "none" : "block";
        if (employeeActions) employeeActions.style.display = isAdmin ? "none" : "flex";
        if (adminActions) adminActions.style.display = isAdmin ? "flex" : "none";

        if (!isAdmin) {
            await loadMyProfile();
        }

        await loadDashboardStats();

        message.textContent = "";

    } catch (error) {
        console.error("Login error:", error);
        message.textContent = "Cannot connect to server.";
        message.style.color = "red";
    }
});


// RESTORE LOGIN AFTER REFRESH
const savedUsername = sessionStorage.getItem("loggedInUsername");
const savedPassword = sessionStorage.getItem("loggedInPassword");

if (savedUsername && savedPassword) {
    document.getElementById("username").value = savedUsername;
    document.getElementById("password").value = savedPassword;

    loginForm.requestSubmit();
}

// DASHBOARD BUTTONS
const applyLeaveBtn = document.getElementById("applyLeaveBtn");
const myLeavesBtn = document.getElementById("myLeavesBtn");
const applyLeaveForm = document.getElementById("applyLeaveForm");
const dashboardContent = document.getElementById("dashboardContent");

if (applyLeaveBtn) {
    applyLeaveBtn.addEventListener("click", function () {
        if (!dashboardContent || !applyLeaveForm) return;

        dashboardContent.innerHTML = "";
        dashboardContent.appendChild(applyLeaveForm);
        applyLeaveForm.style.display = "block";
    });
}

if (myLeavesBtn) {
    myLeavesBtn.addEventListener("click", loadMyLeaves);
}


// APPLY LEAVE
const leaveForm = document.getElementById("leaveForm");
const leaveMessage = document.getElementById("leaveMessage");

if (leaveForm) {
    leaveForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const leaveType = document.getElementById("leaveType").value;
        const reason = document.getElementById("reason").value.trim();

        if (!startDate || !endDate || !leaveType || !reason) {
            leaveMessage.textContent = "Please fill all required fields.";
            leaveMessage.style.color = "red";
            return;
        }

        if (endDate < startDate) {
            leaveMessage.textContent =
                "Please select valid start and end dates.";
            leaveMessage.style.color = "red";
            return;
        }

        leaveMessage.textContent = "Submitting leave request...";
        leaveMessage.style.color = "#2563eb";

        try {
            const response = await fetch("/api/leaves", {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    leaveType,
                    reason
                })
            });

            if (response.ok) {
                leaveMessage.textContent =
                    "Leave request submitted successfully!";
                leaveMessage.style.color = "green";

                leaveForm.reset();
                await loadDashboardStats();

            } else {
                const errorText = await response.text();

                let friendlyMessage =
                    "Something went wrong. Please try again.";

                if (errorText.includes("Insufficient leave balance")) {
                    friendlyMessage =
                        "You don't have enough leave balance.";
                } else if (errorText.includes("already have a pending")) {
                    friendlyMessage =
                        "Leave already exists for these dates.";
                } else if (errorText.includes("End date cannot be before")) {
                    friendlyMessage =
                        "End date cannot be before start date.";
                } else if (errorText.includes("Past dates")) {
                    friendlyMessage =
                        "Past dates are not allowed.";
                } else if (response.status === 401 ||
                           response.status === 403) {
                    friendlyMessage =
                        "You are not authorized. Please login again.";
                }

                leaveMessage.textContent = friendlyMessage;
                leaveMessage.style.color = "red";
            }

        } catch (error) {
            console.error(error);

            leaveMessage.textContent =
                "Cannot connect to server. Please try again.";

            leaveMessage.style.color = "red";
        }
    });
}

// MY LEAVES
async function loadMyLeaves() {
    if (!dashboardContent) return;

    dashboardContent.innerHTML =
        "<h2>My Leave Requests</h2><p>Loading...</p>";

    try {
        const response = await fetch("/api/leaves", {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            dashboardContent.innerHTML =
                "<p>Could not load requests. Status: " +
                response.status + "</p>";
            return;
        }

        const leaves = await response.json();

        dashboardContent.innerHTML = "<h2>My Leave Requests</h2>";

        if (leaves.length === 0) {
            dashboardContent.innerHTML += "<p>No leave requests found.</p>";
            return;
        }

        const table = document.createElement("table");

        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");

        leaves.forEach(leave => {
            const row = document.createElement("tr");

            [
                leave.id,
                leave.startDate,
                leave.endDate,
                leave.leaveType,
                leave.reason,
                leave.status
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        dashboardContent.appendChild(table);

    } catch (error) {
        console.error(error);
        dashboardContent.innerHTML = "<p>Error loading leave requests.</p>";
    }
}


const allRequestsBtn = document.getElementById("allRequestsBtn");

// ADMIN: LOAD ALL LEAVE REQUESTS
async function loadAllLeaveRequests() {
    if (!dashboardContent) return;

    dashboardContent.innerHTML =
        "<h2>All Leave Requests</h2><p>Loading...</p>";

    try {
        const response = await fetch("/api/leaves", {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            dashboardContent.innerHTML =
                "<p>Unable to load requests. Status: " +
                response.status + "</p>";
            return;
        }

        const leaves = await response.json();

        dashboardContent.innerHTML = "<h2>All Leave Requests</h2>";

        if (leaves.length === 0) {
            dashboardContent.innerHTML += "<p>No leave requests found.</p>";
            return;
        }

        const table = document.createElement("table");

        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");

        leaves.forEach(leave => {
            const row = document.createElement("tr");

            const values = [
                leave.id,
                leave.employee?.name ?? "Employee",
                leave.startDate,
                leave.endDate,
                leave.leaveType,
                leave.reason,
                leave.status
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            if (leave.status === "PENDING") {
                const approveBtn = document.createElement("button");
                approveBtn.textContent = "Approve";
                approveBtn.type = "button";

                approveBtn.addEventListener("click", () => {
                    updateLeaveStatus(leave.id, "approve");
                });

                const rejectBtn = document.createElement("button");
                rejectBtn.textContent = "Reject";
                rejectBtn.type = "button";

                rejectBtn.addEventListener("click", () => {
                    updateLeaveStatus(leave.id, "reject");
                });

                actionCell.appendChild(approveBtn);
                actionCell.appendChild(rejectBtn);
            } else {
                actionCell.textContent = "No Action";
            }

            row.appendChild(actionCell);
            tbody.appendChild(row);
        });

        dashboardContent.appendChild(table);

    } catch (error) {
        console.error("Admin requests error:", error);
        dashboardContent.innerHTML =
            "<p>Error loading leave requests.</p>";
    }
}

// ADMIN: APPROVE OR REJECT
async function updateLeaveStatus(id, action) {
    const confirmed = confirm(
        "Are you sure you want to " + action + " this leave request?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `/api/leaves/${id}/${action}`,
            {
                method: "PUT",
                headers: getAuthHeaders()
            }
        );

        if (response.ok) {
            alert("Leave request " + action + "d successfully!");

            await loadDashboardStats();
            await loadAllLeaveRequests();

        } else {
            const errorText = await response.text();

            alert(
                "Failed to " + action +
                ". Status: " + response.status +
                "\n" + errorText
            );
        }

    } catch (error) {
        console.error("Update status error:", error);
        alert("Cannot connect to server.");
    }
}

// ADMIN BUTTON
if (allRequestsBtn) {
    allRequestsBtn.addEventListener("click", loadAllLeaveRequests);
}


const manageEmployeesBtn = document.getElementById("manageEmployeesBtn");

// LOAD ALL EMPLOYEES
async function loadEmployees() {
    dashboardContent.innerHTML =
        "<h2>Manage Employees</h2><p>Loading employees...</p>";

    try {
        const response = await fetch("/api/employees", {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            dashboardContent.innerHTML =
                "<p>Unable to load employees. Status: " +
                response.status + "</p>";
            return;
        }

        const employees = await response.json();

        dashboardContent.innerHTML = `
            <h2>Manage Employees</h2>
            <button id="addEmployeeBtn">+ Add Employee</button>
            <div id="employeeFormContainer"></div>
            <div id="employeeTableContainer"></div>
        `;

        document.getElementById("addEmployeeBtn")
            .addEventListener("click", showAddEmployeeForm);

        const container =
            document.getElementById("employeeTableContainer");

        if (employees.length === 0) {
            container.innerHTML = "<p>No employees found.</p>";
            return;
        }

        const table = document.createElement("table");

        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Leave Balance</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");

        employees.forEach(employee => {
            const row = document.createElement("tr");

            [
                employee.id,
                employee.name,
                employee.email,
                employee.department,
                employee.leaveBalance
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            const viewBtn = document.createElement("button");
            viewBtn.textContent = "View";
            viewBtn.addEventListener("click", () => {
                alert(
                    "Employee: " + employee.name +
                    "\nEmail: " + employee.email +
                    "\nDepartment: " + employee.department +
                    "\nLeave Balance: " + employee.leaveBalance
                );
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => {
                deleteEmployee(employee.id);
            });

            actionCell.appendChild(viewBtn);
            actionCell.appendChild(deleteBtn);
            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

        container.appendChild(table);

    } catch (error) {
        console.error("Employee loading error:", error);
        dashboardContent.innerHTML =
            "<p>Error loading employees.</p>";
    }
}


// SHOW ADD EMPLOYEE FORM
function showAddEmployeeForm() {
    const formContainer =
        document.getElementById("employeeFormContainer");

    formContainer.innerHTML = `
        <h3>Add New Employee</h3>

        <form id="newEmployeeForm">

            <label>Name</label>
            <input type="text" id="newEmployeeName" required>

            <label>Email</label>
            <input type="email" id="newEmployeeEmail" required>

            <label>Department</label>
            <input type="text" id="newEmployeeDepartment" required>

            <label>Leave Balance</label>
            <input type="number" id="newEmployeeBalance"
                   value="12" min="0" required>

            <label>Username</label>
            <input type="text" id="newEmployeeUsername"
                   minlength="3" required>

            <label>Password</label>
            <input type="password" id="newEmployeePassword"
                   minlength="8" required>

            <button type="submit">Save Employee</button>
        </form>
    `;

    document.getElementById("newEmployeeForm")
        .addEventListener("submit", async function(event) {

            event.preventDefault();

            const employee = {
                name: document.getElementById("newEmployeeName").value.trim(),
                email: document.getElementById("newEmployeeEmail").value.trim(),
                department: document.getElementById("newEmployeeDepartment").value.trim(),
                leaveBalance: Number(
                    document.getElementById("newEmployeeBalance").value
                )
            };

            const requestData = {
                employee: employee,
                username: document.getElementById("newEmployeeUsername").value.trim(),
                password: document.getElementById("newEmployeePassword").value
            };

            try {
                const response = await fetch("/api/employees", {
                    method: "POST",
                    headers: {
                        ...getAuthHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                });

                if (response.ok) {
                    alert("Employee and Login Account created successfully!");
                    await loadEmployees();
                } else {
                    alert(
                        "Failed to add employee. Status: " +
                        response.status + "\n" +
                        await response.text()
                    );
                }

            } catch (error) {
                console.error(error);
                alert("Cannot connect to server.");
            }
        });
}

// DELETE EMPLOYEE
async function deleteEmployee(id) {
    if (!confirm("Are you sure you want to delete this employee?")) {
        return;
    }

    try {
        const response = await fetch("/api/employees/" + id, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert("Employee deleted successfully!");
            await loadEmployees();
        } else {
            alert(
                "Unable to delete employee. Status: " +
                response.status + "\n" +
                await response.text()
            );
        }

    } catch (error) {
        console.error(error);
        alert("Cannot connect to server.");
    }
}

// MANAGE EMPLOYEES BUTTON
if (manageEmployeesBtn) {
    manageEmployeesBtn.addEventListener("click", loadEmployees);
}

// LOGOUT
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        loggedInUsername = "";
        loggedInPassword = "";

        sessionStorage.removeItem("loggedInUsername");
        sessionStorage.removeItem("loggedInPassword");

        if (applyLeaveForm) applyLeaveForm.style.display = "none";
        if (dashboardContent) dashboardContent.innerHTML = "";

        document.getElementById("dashboard").style.display = "none";
        document.querySelector(".login-container").style.display = "block";

        loginForm.reset();
        message.textContent = "";
    });
}
