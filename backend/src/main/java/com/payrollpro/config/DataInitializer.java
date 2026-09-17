package com.payrollpro.config;

import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import com.payrollpro.model.ExpenseCategory;
import com.payrollpro.model.ExpenseClaim;
import com.payrollpro.model.ExpenseClaimStatus;
import com.payrollpro.model.LeaveRequest;
import com.payrollpro.model.LeaveRequestStatus;
import com.payrollpro.model.LeaveType;
import com.payrollpro.model.LoanRecord;
import com.payrollpro.model.LoanStatus;
import com.payrollpro.model.Role;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.model.User;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.ExpenseClaimRepository;
import com.payrollpro.repository.LeaveRequestRepository;
import com.payrollpro.repository.LeaveTypeRepository;
import com.payrollpro.repository.LoanRecordRepository;
import com.payrollpro.repository.SalaryStructureRepository;
import com.payrollpro.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.payrollpro.service.LeaveBalanceService leaveBalanceService;
    private final com.payrollpro.service.StatutoryRuleEngine statutoryRuleEngine;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LoanRecordRepository loanRecordRepository;
    private final ExpenseClaimRepository expenseClaimRepository;
    private final LeaveTypeRepository leaveTypeRepository;

    public DataInitializer(CompanyRepository companyRepository,
                           UserRepository userRepository,
                           EmployeeRepository employeeRepository,
                           SalaryStructureRepository salaryStructureRepository,
                           PasswordEncoder passwordEncoder,
                           com.payrollpro.service.LeaveBalanceService leaveBalanceService,
                           com.payrollpro.service.StatutoryRuleEngine statutoryRuleEngine,
                           LeaveRequestRepository leaveRequestRepository,
                           LoanRecordRepository loanRecordRepository,
                           ExpenseClaimRepository expenseClaimRepository,
                           LeaveTypeRepository leaveTypeRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.passwordEncoder = passwordEncoder;
        this.leaveBalanceService = leaveBalanceService;
        this.statutoryRuleEngine = statutoryRuleEngine;
        this.leaveRequestRepository = leaveRequestRepository;
        this.loanRecordRepository = loanRecordRepository;
        this.expenseClaimRepository = expenseClaimRepository;
        this.leaveTypeRepository = leaveTypeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@payrollpro.com")) {
            log.info("Demo data already seeded, skipping initialization.");
            return;
        }

        log.info("Starting PayrollPro demo data initialization...");
        Company demoCompany = seedDemoCompany();
        Long companyId = demoCompany.getId();
        leaveBalanceService.initializeDefaultLeaveTypes(companyId);

        List<Employee> seededEmployees = seedEmployeesAndStructures(companyId);
        seedLeaveBalances(companyId, seededEmployees);
        List<User> users = seedDemoUsers(companyId, seededEmployees);
        seedDemoWorkflows(companyId, seededEmployees, users);
    }

    private Company seedDemoCompany() {
        Company demoCompany = new Company();
        demoCompany.setName("Demo Company Inc.");
        demoCompany.setRegistrationNumber("CIN-U72200MH2020PTC123456");
        demoCompany.setAddress("123 Tech Park, BKC, Mumbai, Maharashtra 400051");
        demoCompany.setGstin("27AABCU9603R1ZM");
        demoCompany.setIsActive(true);
        return companyRepository.save(demoCompany);
    }

    private List<Employee> seedEmployeesAndStructures(Long companyId) {
        String[] firstNames = {
                "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
                "Shaurya", "Atharva", "Dhruv", "Kabir", "Rohan", "Ananya", "Diya", "Isha", "Rhea", "Pooja",
                "Saanvi", "Aadhya", "Kiara", "Myra", "Pari", "Akshay", "Priyanka", "Vikram", "Sneha", "Rahul",
                "Deepak", "Neha", "Amit", "Kavita", "Suresh", "Sunita", "Rajesh", "Pooja", "Manish", "Meera",
                "Gaurav", "Swati", "Nikhil", "Divya", "Karan", "Tanvi", "Alok", "Shreya", "Sachin", "Simran"
        };

        String[] lastNames = {
                "Sharma", "Verma", "Patel", "Mehta", "Iyer", "Nair", "Reddy", "Rao", "Joshi", "Kulkarni",
                "Deshmukh", "Chopra", "Malhotra", "Kapoor", "Bhatia", "Sen", "Chatterjee", "Banerjee", "Das", "Ghosh",
                "Gupta", "Agarwal", "Mishra", "Pandey", "Trivedi", "Patil", "Pawar", "Shinde", "More", "Gaikwad",
                "Singh", "Kaur", "Yadav", "Chauhan", "Rathore", "Kumar", "Prasad", "Sinha", "Thakur", "Jha"
        };

        String[] departments = {"Engineering", "Marketing", "Finance", "Operations", "HR"};
        String[][] designations = {
                {"Software Engineer", "Senior Software Engineer", "Tech Lead", "QA Engineer", "DevOps Engineer"},
                {"Marketing Specialist", "Content Strategist", "SEO Analyst", "Growth Manager", "Brand Lead"},
                {"Financial Analyst", "Accountant", "Payroll Specialist", "Audit Associate", "Finance Manager"},
                {"Operations Coordinator", "Logistics Executive", "Process Analyst", "Operations Manager", "Supply Planner"},
                {"HR Executive", "Recruiter", "HRBP", "Training Specialist", "HR Operations Lead"}
        };

        String[] bankNames = {"HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"};
        String[] ifscPrefixes = {"HDFC000", "ICIC000", "SBIN000", "UTIB000", "KKBK000"};

        List<Employee> seededEmployees = new ArrayList<>(200);
        List<SalaryStructure> seededStructures = new ArrayList<>(200);

        long ctcMin = 300000L;
        long ctcMax = 2500000L;
        long ctcStep = 50000L;
        long totalCtcSteps = (ctcMax - ctcMin) / ctcStep;

        for (int i = 1; i <= 200; i++) {
            String empCode = String.format("EMP-%03d", i);
            String fName = firstNames[(i - 1) % firstNames.length];
            String lName = lastNames[(i - 1) % lastNames.length];
            String email = String.format("%s.%s%d@democompany.com", fName.toLowerCase(), lName.toLowerCase(), i);
            String phone = String.format("98%08d", 10000000 + i);

            int deptIdx = (i - 1) % departments.length;
            String dept = departments[deptIdx];
            String desig = designations[deptIdx][(i - 1) % designations[deptIdx].length];
            LocalDate doj = LocalDate.of(2023, 1, 1).plusDays((i * 5) % 1000);

            Employee employee = new Employee();
            employee.setCompanyId(companyId);
            employee.setEmpCode(empCode);
            employee.setFirstName(fName);
            employee.setLastName(lName);
            employee.setEmail(email);
            employee.setPhone(phone);
            employee.setDepartment(dept);
            employee.setDesignation(desig);
            employee.setDateOfJoining(doj);
            employee.setDateOfBirth(LocalDate.of(1990 + (i % 12), 1 + (i % 12), 1 + (i % 28)));
            employee.setPanNumber(String.format("ABCDE%04dF", 1000 + i));
            employee.setAadhaarNumber(String.format("38%010d", 1000000000L + i));
            int bankIdx = (i - 1) % bankNames.length;
            employee.setBankName(bankNames[bankIdx]);
            employee.setIfscCode(ifscPrefixes[bankIdx] + String.format("%04d", 100 + bankIdx));
            employee.setBankAccountNumber(String.format("91%012d", 200000000000L + i));
            employee.setStatus(EmployeeStatus.ACTIVE);

            employee = employeeRepository.save(employee);
            seededEmployees.add(employee);

            long annualCtcValue = ctcMin + ((i % totalCtcSteps) * ctcStep);
            BigDecimal annualCTC = BigDecimal.valueOf(annualCtcValue).setScale(2, RoundingMode.HALF_UP);
            BigDecimal professionalTax = new BigDecimal("200.00");
            BigDecimal monthlyTds = BigDecimal.valueOf(1000 + ((i * 37) % 4000)).setScale(2, RoundingMode.HALF_UP);

            SalaryStructure structure = statutoryRuleEngine.computeSalaryStructure(
                    annualCTC, professionalTax, monthlyTds, doj);
            structure.setCompanyId(companyId);
            structure.setEmployeeId(employee.getId());
            seededStructures.add(structure);
        }

        salaryStructureRepository.saveAll(seededStructures);
        log.info("200 employees seeded with salary structures.");
        return seededEmployees;
    }

    private void seedLeaveBalances(Long companyId, List<Employee> seededEmployees) {
        int currentYear = LocalDate.now().getYear();
        for (Employee emp : seededEmployees) {
            leaveBalanceService.initializeEmployeeBalances(companyId, emp.getId(), currentYear);
        }
        log.info("Leave balances initialized for 200 employees.");
    }

    private List<User> seedDemoUsers(Long companyId, List<Employee> seededEmployees) {
        Employee firstEmployee = seededEmployees.get(0);
        Employee hrEmp = seededEmployees.stream()
                .filter(e -> "HR".equalsIgnoreCase(e.getDepartment()))
                .findFirst()
                .orElse(firstEmployee);
        Employee managerEmp = seededEmployees.stream()
                .filter(e -> "Engineering".equalsIgnoreCase(e.getDepartment()))
                .findFirst()
                .orElse(firstEmployee);

        User superAdmin = new User();
        superAdmin.setCompanyId(companyId);
        superAdmin.setEmail("admin@payrollpro.com");
        superAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
        superAdmin.setRole(Role.SUPER_ADMIN);
        superAdmin.setIsActive(true);

        User companyAdmin = new User();
        companyAdmin.setCompanyId(companyId);
        companyAdmin.setEmail("hr@democompany.com");
        companyAdmin.setPasswordHash(passwordEncoder.encode("hr123"));
        companyAdmin.setRole(Role.COMPANY_ADMIN);
        companyAdmin.setEmployeeId(hrEmp.getId());
        companyAdmin.setIsActive(true);

        User manager = new User();
        manager.setCompanyId(companyId);
        manager.setEmail("manager@democompany.com");
        manager.setPasswordHash(passwordEncoder.encode("manager123"));
        manager.setRole(Role.MANAGER);
        manager.setEmployeeId(managerEmp.getId());
        manager.setIsActive(true);

        User empUser = new User();
        empUser.setCompanyId(companyId);
        empUser.setEmail("emp001@democompany.com");
        empUser.setPasswordHash(passwordEncoder.encode("emp123"));
        empUser.setRole(Role.EMPLOYEE);
        empUser.setEmployeeId(firstEmployee.getId());
        empUser.setIsActive(true);

        List<User> savedUsers = userRepository.saveAll(List.of(superAdmin, companyAdmin, manager, empUser));
        log.info("Demo users seeded: admin@payrollpro.com, hr@democompany.com, manager@democompany.com, emp001@democompany.com");
        return savedUsers;
    }

    private void seedDemoWorkflows(Long companyId, List<Employee> seededEmployees, List<User> users) {
        User hrUser = users.stream().filter(u -> u.getRole() == Role.COMPANY_ADMIN).findFirst().orElse(null);
        User managerUser = users.stream().filter(u -> u.getRole() == Role.MANAGER).findFirst().orElse(null);
        Long approverId = (hrUser != null) ? hrUser.getId() : (managerUser != null ? managerUser.getId() : null);

        List<LeaveType> leaveTypes = leaveTypeRepository.findAllByCompanyId(companyId);
        LeaveType clType = leaveTypes.stream().filter(t -> "CL".equalsIgnoreCase(t.getCode())).findFirst()
                .orElse(leaveTypes.isEmpty() ? null : leaveTypes.get(0));
        LeaveType slType = leaveTypes.stream().filter(t -> "SL".equalsIgnoreCase(t.getCode())).findFirst()
                .orElse(clType);
        LeaveType elType = leaveTypes.stream().filter(t -> "EL".equalsIgnoreCase(t.getCode())).findFirst()
                .orElse(clType);

        LocalDate now = LocalDate.now();

        // 1. Seed Sample Leave Requests (Approved, Rejected, Pending)
        if (clType != null && seededEmployees.size() > 3) {
            // Approved Leave
            LeaveRequest req1 = new LeaveRequest(companyId, seededEmployees.get(1).getId(), clType.getId(),
                    now.minusDays(10), now.minusDays(9), new BigDecimal("2.0"), "Personal family event in hometown");
            req1.setStatus(LeaveRequestStatus.APPROVED);
            req1.setApproverId(approverId);
            req1.setApprovedAt(now.minusDays(11).atTime(10, 30));
            req1.setRemarks("Approved. Work handover verified.");

            // Rejected Leave
            LeaveRequest req2 = new LeaveRequest(companyId, seededEmployees.get(2).getId(), slType.getId(),
                    now.minusDays(5), now.minusDays(3), new BigDecimal("3.0"), "Severe viral fever and recovery");
            req2.setStatus(LeaveRequestStatus.REJECTED);
            req2.setApproverId(approverId);
            req2.setApprovedAt(now.minusDays(6).atTime(14, 15));
            req2.setRemarks("Rejected: Medical certificate not submitted for leave exceeding 2 consecutive days.");

            // Pending Leave
            LeaveRequest req3 = new LeaveRequest(companyId, seededEmployees.get(3).getId(), elType.getId(),
                    now.plusDays(7), now.plusDays(10), new BigDecimal("4.0"), "Annual scheduled family vacation");
            req3.setStatus(LeaveRequestStatus.PENDING);

            leaveRequestRepository.saveAll(List.of(req1, req2, req3));
            log.info("Demo leave requests seeded: 1 APPROVED, 1 REJECTED, 1 PENDING.");
        }

        // 2. Seed Sample Loan Records (Active, Rejected with remarks, Requested)
        if (seededEmployees.size() > 6) {
            // Active Loan
            LoanRecord loan1 = new LoanRecord();
            loan1.setCompanyId(companyId);
            loan1.setEmployeeId(seededEmployees.get(4).getId());
            loan1.setPrincipalAmount(new BigDecimal("50000.00"));
            loan1.setTenureMonths(10);
            loan1.setMonthlyEmi(new BigDecimal("5000.00"));
            loan1.setRemainingPrincipal(new BigDecimal("40000.00"));
            loan1.setStatus(LoanStatus.ACTIVE);
            loan1.setReason("Medical treatment and hospitalization advance");
            loan1.setDisbursedDate(now.minusMonths(2));
            loan1.setRemarks("Approved under emergency medical credit scheme.");

            // Rejected Loan
            LoanRecord loan2 = new LoanRecord();
            loan2.setCompanyId(companyId);
            loan2.setEmployeeId(seededEmployees.get(5).getId());
            loan2.setPrincipalAmount(new BigDecimal("150000.00"));
            loan2.setTenureMonths(12);
            loan2.setMonthlyEmi(new BigDecimal("12500.00"));
            loan2.setRemainingPrincipal(new BigDecimal("150000.00"));
            loan2.setStatus(LoanStatus.REJECTED);
            loan2.setReason("Down payment assistance for two-wheeler purchase");
            loan2.setRemarks("Rejected: Requested loan amount exceeds corporate ceiling of 3x basic monthly wages.");

            // Requested (Pending) Loan
            LoanRecord loan3 = new LoanRecord();
            loan3.setCompanyId(companyId);
            loan3.setEmployeeId(seededEmployees.get(6).getId());
            loan3.setPrincipalAmount(new BigDecimal("30000.00"));
            loan3.setTenureMonths(6);
            loan3.setMonthlyEmi(new BigDecimal("5000.00"));
            loan3.setRemainingPrincipal(new BigDecimal("30000.00"));
            loan3.setStatus(LoanStatus.REQUESTED);
            loan3.setReason("Relocation allowance and security deposit for city transfer");

            loanRecordRepository.saveAll(List.of(loan1, loan2, loan3));
            log.info("Demo loans seeded: 1 ACTIVE, 1 REJECTED, 1 REQUESTED.");
        }

        // 3. Seed Sample Expense Claims (Pending, Approved, Rejected)
        if (seededEmployees.size() > 9) {
            // Pending Claim
            ExpenseClaim claim1 = new ExpenseClaim();
            claim1.setCompanyId(companyId);
            claim1.setEmployeeId(seededEmployees.get(7).getId());
            claim1.setCategory(ExpenseCategory.TRAVEL);
            claim1.setAmount(new BigDecimal("2850.00"));
            claim1.setMerchant("Uber Technologies");
            claim1.setClaimDate(now.minusDays(2));
            claim1.setDescription("Airport round-trip cab charges for Bangalore client audit meeting");
            claim1.setStatus(ExpenseClaimStatus.PENDING);

            // Approved Claim
            ExpenseClaim claim2 = new ExpenseClaim();
            claim2.setCompanyId(companyId);
            claim2.setEmployeeId(seededEmployees.get(8).getId());
            claim2.setCategory(ExpenseCategory.BROADBAND);
            claim2.setAmount(new BigDecimal("1299.00"));
            claim2.setMerchant("Airtel Fiber");
            claim2.setClaimDate(now.minusDays(15));
            claim2.setDescription("Monthly high-speed broadband reimbursement for remote work");
            claim2.setStatus(ExpenseClaimStatus.APPROVED);
            claim2.setApprovedAt(now.minusDays(12).atTime(11, 0));
            claim2.setRemarks("Verified bill with GST number. Approved.");

            // Rejected Claim
            ExpenseClaim claim3 = new ExpenseClaim();
            claim3.setCompanyId(companyId);
            claim3.setEmployeeId(seededEmployees.get(9).getId());
            claim3.setCategory(ExpenseCategory.MEALS);
            claim3.setAmount(new BigDecimal("6500.00"));
            claim3.setMerchant("The Oberoi Grill");
            claim3.setClaimDate(now.minusDays(8));
            claim3.setDescription("Informal team dinner following project sprint release");
            claim3.setStatus(ExpenseClaimStatus.REJECTED);
            claim3.setRemarks("Rejected: Meal claims above ₹2,500 require prior department head budget pre-clearance.");

            expenseClaimRepository.saveAll(List.of(claim1, claim2, claim3));
            log.info("Demo expense claims seeded: 1 PENDING, 1 APPROVED, 1 REJECTED.");
        }
    }
}
