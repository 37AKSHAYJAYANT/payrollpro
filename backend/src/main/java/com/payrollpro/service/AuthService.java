package com.payrollpro.service;

import com.payrollpro.config.JwtUtil;
import com.payrollpro.dto.AuthResponse;
import com.payrollpro.dto.LoginRequest;
import com.payrollpro.dto.RegisterRequest;
import com.payrollpro.model.Company;
import com.payrollpro.model.Role;
import com.payrollpro.model.User;
import com.payrollpro.repository.CompanyRepository;
import com.payrollpro.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.payrollpro.dto.UserProfileResponse;
import com.payrollpro.model.Employee;
import com.payrollpro.repository.EmployeeRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LeaveBalanceService leaveBalanceService;

    public AuthService(CompanyRepository companyRepository,
                       UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       LeaveBalanceService leaveBalanceService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.leaveBalanceService = leaveBalanceService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered");
        }

        Company company = new Company(request.getCompanyName());
        company = companyRepository.save(company);

        // Auto-create default leave types (CL, SL, EL)
        leaveBalanceService.initializeDefaultLeaveTypes(company.getId());

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(company.getId(), request.getAdminEmail(), encodedPassword, Role.COMPANY_ADMIN);
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), company.getId(), user.getRole().name(), user.getEmail());
        return new AuthResponse(token, user.getRole().name(), company.getId(), company.getName(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is disabled");
        }

        String companyName = companyRepository.findById(user.getCompanyId())
                .map(Company::getName)
                .orElse("Company Workspace");

        String token = jwtUtil.generateToken(user.getId(), user.getCompanyId(), user.getRole().name(), user.getEmail());
        return new AuthResponse(token, user.getRole().name(), user.getCompanyId(), companyName, user.getEmail());
    }

    public UserProfileResponse getCurrentUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        UserProfileResponse profile = new UserProfileResponse();
        profile.setId(user.getId());
        profile.setEmail(user.getEmail());
        profile.setRole(user.getRole().name());
        profile.setCompanyId(user.getCompanyId());

        companyRepository.findById(user.getCompanyId()).ifPresent(c -> profile.setCompanyName(c.getName()));

        if (user.getEmployeeId() != null) {
            employeeRepository.findById(user.getEmployeeId()).ifPresent(emp -> {
                profile.setEmployeeId(emp.getId());
                profile.setEmpCode(emp.getEmpCode());
                profile.setFullName(emp.getFirstName() + " " + emp.getLastName());
                profile.setDepartment(emp.getDepartment());
                profile.setDesignation(emp.getDesignation());
            });
        }

        return profile;
    }
}
