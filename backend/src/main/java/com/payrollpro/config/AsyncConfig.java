package com.payrollpro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("PayrollAsync-");
        executor.setTaskDecorator(runnable -> {
            Long companyId = TenantContext.getCompanyId();
            return () -> {
                try {
                    if (companyId != null) {
                        TenantContext.setCompanyId(companyId);
                    }
                    runnable.run();
                } finally {
                    TenantContext.clear();
                }
            };
        });
        executor.initialize();
        return executor;
    }
}
