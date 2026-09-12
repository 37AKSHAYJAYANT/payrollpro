package com.payrollpro.dto;

import java.util.ArrayList;
import java.util.List;

public class VariablePayUploadSummary {

    private int processed = 0;
    private int errors = 0;
    private List<String> errorDetails = new ArrayList<>();

    public VariablePayUploadSummary() {
    }

    public VariablePayUploadSummary(int processed, int errors, List<String> errorDetails) {
        this.processed = processed;
        this.errors = errors;
        this.errorDetails = errorDetails != null ? errorDetails : new ArrayList<>();
    }

    public int getProcessed() {
        return processed;
    }

    public void setProcessed(int processed) {
        this.processed = processed;
    }

    public int getErrors() {
        return errors;
    }

    public void setErrors(int errors) {
        this.errors = errors;
    }

    public List<String> getErrorDetails() {
        return errorDetails;
    }

    public void setErrorDetails(List<String> errorDetails) {
        this.errorDetails = errorDetails;
    }
}
