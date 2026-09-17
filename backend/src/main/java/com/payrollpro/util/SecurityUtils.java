package com.payrollpro.util;

import com.payrollpro.model.Employee;
import com.payrollpro.model.User;
import com.payrollpro.repository.EmployeeRepository;
import com.payrollpro.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

public final class SecurityUtils {

    private SecurityUtils() {
        // Utility class
    }

    public static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().trim().isEmpty() || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return auth.getName();
    }

    public static User getCurrentUser(UserRepository userRepository) {
        String email = getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public static Employee getCurrentEmployee(UserRepository userRepository,
                                             EmployeeRepository employeeRepository,
                                             Long companyId) {
        return getCurrentEmployeeWithFallback(userRepository, employeeRepository, companyId);
    }

    public static java.util.Optional<Employee> findCurrentEmployeeOptional(UserRepository userRepository,
                                                                         EmployeeRepository employeeRepository,
                                                                         Long companyId) {
        User user = getCurrentUser(userRepository);
        if (user.getEmployeeId() != null) {
            return employeeRepository.findByCompanyIdAndId(companyId, user.getEmployeeId());
        }
        return employeeRepository.findAllByCompanyId(companyId).stream()
                .filter(e -> e.getEmail().equalsIgnoreCase(user.getEmail()))
                .findFirst();
    }

    public static Employee getCurrentEmployeeWithFallback(UserRepository userRepository,
                                                          EmployeeRepository employeeRepository,
                                                          Long companyId) {
        return findCurrentEmployeeOptional(userRepository, employeeRepository, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee record not found"));
    }
}

