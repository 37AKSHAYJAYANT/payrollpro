package com.payrollpro.config;

import com.payrollpro.model.Company;
import com.payrollpro.model.Employee;
import com.payrollpro.model.EmployeeStatus;
import com.payrollpro.model.Role;
import com.payrollpro.model.SalaryStructure;
import com.payrollpro.model.User;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.EmployeeRepository;
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

    public DataInitializer(CompanyRepository companyRepository,
                           UserRepository userRepository,
                           EmployeeRepository employeeRepository,
                           SalaryStructureRepository salaryStructureRepository,
                           PasswordEncoder passwordEncoder,
                           com.payrollpro.service.LeaveBalanceService leaveBalanceService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.passwordEncoder = passwordEncoder;
        this.leaveBalanceService = leaveBalanceService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@payrollpro.com")) {
            log.info("Demo data already seeded, skipping initialization.");
            return;
        }

        log.info("Starting PayrollPro demo data initialization...");

        // 1. Create Demo Company
        Company demoCompany = new Company();
        demoCompany.setName("Demo Company Inc.");
        demoCompany.setRegistrationNumber("CIN-U72200MH2020PTC123456");
        demoCompany.setAddress("123 Tech Park, BKC, Mumbai, Maharashtra 400051");
        demoCompany.setGstin("27AABCU9603R1ZM");
        demoCompany.setIsActive(true);
        demoCompany = companyRepository.save(demoCompany);
        Long companyId = demoCompany.getId();

        // Auto-create default leave types (CL, SL, EL)
        leaveBalanceService.initializeDefaultLeaveTypes(companyId);

        // 2. First Names and Last Names pools for generating realistic 200 Indian employees
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

        // 3. Seed 200 Employees and Salary Structures
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

            // Join date spread across the past 3 years
            LocalDate doj = LocalDate.of(2023, 1, 1).plusDays((i * 5) % 1000);

            String panNumber = String.format("ABCDE%04dF", 1000 + i);
            String aadhaarNumber = String.format("38%010d", 1000000000L + i);
            int bankIdx = (i - 1) % bankNames.length;
            String bankName = bankNames[bankIdx];
            String ifscCode = ifscPrefixes[bankIdx] + String.format("%04d", 100 + bankIdx);
            String bankAccountNumber = String.format("91%012d", 200000000000L + i);

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
            employee.setPanNumber(panNumber);
            employee.setAadhaarNumber(aadhaarNumber);
            employee.setBankName(bankName);
            employee.setIfscCode(ifscCode);
            employee.setBankAccountNumber(bankAccountNumber);
            employee.setStatus(EmployeeStatus.ACTIVE);

            employee = employeeRepository.save(employee);
            seededEmployees.add(employee);

            // Calculate SalaryStructure
            long annualCtcValue = ctcMin + ((i % totalCtcSteps) * ctcStep);
            BigDecimal annualCTC = BigDecimal.valueOf(annualCtcValue).setScale(2, RoundingMode.HALF_UP);
            BigDecimal monthlyGross = annualCTC.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
            BigDecimal basicSalary = monthlyGross.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal hra = basicSalary.multiply(new BigDecimal("0.40")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal specialAllowance = monthlyGross.subtract(basicSalary).subtract(hra).setScale(2, RoundingMode.HALF_UP);
            BigDecimal epfEmployee = basicSalary.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal epfEmployer = basicSalary.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal professionalTax = new BigDecimal("200.00");
            BigDecimal monthlyTds = annualCtcValue > 1000000L ? new BigDecimal("2500.00") : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

            SalaryStructure salaryStructure = new SalaryStructure(
                    companyId,
                    employee.getId(),
                    annualCTC,
                    monthlyGross,
                    basicSalary,
                    hra,
                    specialAllowance,
                    epfEmployee,
                    epfEmployer,
                    professionalTax,
                    monthlyTds,
                    doj
            );
            seededStructures.add(salaryStructure);
        }

        salaryStructureRepository.saveAll(seededStructures);
        log.info("200 employees seeded with salary structures.");

        int currentYear = LocalDate.now().getYear();
        for (Employee emp : seededEmployees) {
            leaveBalanceService.initializeEmployeeBalances(companyId, emp.getId(), currentYear);
        }
        log.info("Leave balances initialized for 200 employees.");

        // 4. Create 4 Demo Users (as specified in README.md)
        Employee firstEmployee = seededEmployees.get(0);

        // Super Admin
        User superAdmin = new User();
        superAdmin.setCompanyId(companyId);
        superAdmin.setEmail("admin@payrollpro.com");
        superAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
        superAdmin.setRole(Role.SUPER_ADMIN);
        superAdmin.setIsActive(true);

        // Company Admin (HR)
        User companyAdmin = new User();
        companyAdmin.setCompanyId(companyId);
        companyAdmin.setEmail("hr@democompany.com");
        companyAdmin.setPasswordHash(passwordEncoder.encode("hr123"));
        companyAdmin.setRole(Role.COMPANY_ADMIN);
        companyAdmin.setIsActive(true);

        // Manager
        User manager = new User();
        manager.setCompanyId(companyId);
        manager.setEmail("manager@democompany.com");
        manager.setPasswordHash(passwordEncoder.encode("manager123"));
        manager.setRole(Role.MANAGER);
        manager.setIsActive(true);

        // Employee
        User empUser = new User();
        empUser.setCompanyId(companyId);
        empUser.setEmail("emp001@democompany.com");
        empUser.setPasswordHash(passwordEncoder.encode("emp123"));
        empUser.setRole(Role.EMPLOYEE);
        empUser.setEmployeeId(firstEmployee.getId());
        empUser.setIsActive(true);

        userRepository.saveAll(List.of(superAdmin, companyAdmin, manager, empUser));
        log.info("Demo users seeded: admin@payrollpro.com, hr@democompany.com, manager@democompany.com, emp001@democompany.com");
    }
}
