package com.payrollpro.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/",
            "/login",
            "/register",
            "/dashboard",
            "/dashboard/**",
            "/employees",
            "/employees/**",
            "/leaves",
            "/leaves/**",
            "/loans",
            "/loans/**",
            "/expenses",
            "/expenses/**",
            "/settlements",
            "/settlements/**",
            "/tax",
            "/tax/**",
            "/attendance",
            "/attendance/**",
            "/payroll",
            "/payroll/**",
            "/employee/**",
            "/my-payslips",
            "/my-payslips/**"
    })
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
