# Manual Code Review Command (/review)

Perform a comprehensive code review across all staged and unstaged changes in the repository.

### Review Focus Areas:
1. **Compliance with AGENTS.md & Architecture Reference**:
   - **NO LOMBOK**: Verify explicit getters/setters/constructors in backend Java.
   - **Tenant Isolation**: Verify `TenantContext.getRequiredCompanyId()` or `getCompanyId()` is strictly enforced on all repository queries and mutations.
   - **Statutory Rules**: Verify Basic Salary (50%), HRA (40%), EPF (12% capped at ₹1,800/mo), PT (₹200/mo), and Net Pay math.
   - **Workflow Integrity**: DRAFT -> MANAGER_REVIEWED -> APPROVED -> LOCKED.
2. **Code Quality & Refactoring Standards**:
   - **DRY (Don't Repeat Yourself)**: Ensure zero duplication of business logic, formulas, or API abstractions.
   - **Keep Functions Small**: Ensure methods are decomposed, single-responsibility, and concise (<30 lines for services, <150 lines for React components).
3. **Bug & Vulnerability Audit**:
   - Potential null pointer exceptions, unhandled promises, race conditions, edge cases.
   - Proper input validation and error handling.
4. **Test & Build Verification**:
   - Verify `mvn test` and `npm run build` pass with zero regressions.
