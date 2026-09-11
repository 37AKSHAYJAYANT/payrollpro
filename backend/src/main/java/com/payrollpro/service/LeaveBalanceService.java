package com.payrollpro.service;

import com.payrollpro.dto.LeaveBalanceResponse;
import com.payrollpro.model.LeaveBalance;
import com.payrollpro.model.LeaveType;
import com.payrollpro.repository.LeaveBalanceRepository;
import com.payrollpro.repository.LeaveTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeaveBalanceService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    public LeaveBalanceService(LeaveTypeRepository leaveTypeRepository,
                               LeaveBalanceRepository leaveBalanceRepository) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
    }

    @Transactional
    public List<LeaveType> initializeDefaultLeaveTypes(Long companyId) {
        List<LeaveType> types = new ArrayList<>();

        if (!leaveTypeRepository.existsByCompanyIdAndCode(companyId, "CL")) {
            types.add(leaveTypeRepository.save(new LeaveType(companyId, "Casual Leave", "CL", 12, false)));
        }
        if (!leaveTypeRepository.existsByCompanyIdAndCode(companyId, "SL")) {
            types.add(leaveTypeRepository.save(new LeaveType(companyId, "Sick Leave", "SL", 6, false)));
        }
        if (!leaveTypeRepository.existsByCompanyIdAndCode(companyId, "EL")) {
            types.add(leaveTypeRepository.save(new LeaveType(companyId, "Earned Leave", "EL", 15, true)));
        }

        return types;
    }

    @Transactional
    public void initializeEmployeeBalances(Long companyId, Long employeeId, int year) {
        List<LeaveType> leaveTypes = leaveTypeRepository.findAllByCompanyId(companyId);
        if (leaveTypes.isEmpty()) {
            leaveTypes = initializeDefaultLeaveTypes(companyId);
        }

        for (LeaveType type : leaveTypes) {
            if (!leaveBalanceRepository.existsByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(
                    companyId, employeeId, type.getId(), year)) {
                BigDecimal quota = BigDecimal.valueOf(type.getAnnualQuota()).setScale(1);
                LeaveBalance balance = new LeaveBalance(companyId, employeeId, type.getId(), year, quota);
                leaveBalanceRepository.save(balance);
            }
        }
    }

    public List<LeaveBalanceResponse> getMyBalances(Long companyId, Long employeeId, int year) {
        // Ensure balances exist for this year
        initializeEmployeeBalances(companyId, employeeId, year);

        List<LeaveType> types = leaveTypeRepository.findAllByCompanyId(companyId);
        Map<Long, LeaveType> typeMap = types.stream().collect(Collectors.toMap(LeaveType::getId, t -> t));

        List<LeaveBalance> balances = leaveBalanceRepository.findAllByCompanyIdAndEmployeeIdAndYear(companyId, employeeId, year);

        return balances.stream().map(b -> {
            LeaveType t = typeMap.get(b.getLeaveTypeId());
            String code = t != null ? t.getCode() : "—";
            String name = t != null ? t.getName() : "—";
            return new LeaveBalanceResponse(
                    b.getId(),
                    b.getLeaveTypeId(),
                    code,
                    name,
                    b.getYear(),
                    b.getTotalBalance(),
                    b.getUsed(),
                    b.getRemaining()
            );
        }).collect(Collectors.toList());
    }

    public BigDecimal getRemainingBalance(Long companyId, Long employeeId, Long leaveTypeId, int year) {
        return leaveBalanceRepository.findByCompanyIdAndEmployeeIdAndLeaveTypeIdAndYear(
                companyId, employeeId, leaveTypeId, year)
                .map(LeaveBalance::getRemaining)
                .orElse(BigDecimal.ZERO);
    }
}
