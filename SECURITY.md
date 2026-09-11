# Security & Code Protection Policy

## 🔒 Codebase Access & Modification Policy

1. **Proprietary Software:**  
   This repository and all its constituent source files (frontend, backend, MCP layer, tests, and configuration) are proprietary.

2. **No Unauthorized Modifications:**  
   - External pull requests and direct branch pushes are **strictly forbidden**.
   - No contributor or collaborator may modify, delete, or overwrite production or development branches without explicit authorization from the repository owner.

3. **Branch Protection Guidelines on GitHub:**  
   To enforce this rule mechanically on GitHub:
   - Go to **Repository Settings** ➔ **Branches**.
   - Under **Branch protection rules**, click **Add branch protection rule**.
   - Branch name pattern: `main`.
   - Enable:
     - ☑️ **Require a pull request before merging** (Require approvals = 1).
     - ☑️ **Do not allow bypassing the above settings** (Applies to repository admins as well).
     - ☑️ **Restrict who can push to matching branches** (Select only yourself / owner).
     - ☑️ **Require status checks to pass before merging**.

4. **Reporting Security Vulnerabilities:**  
   If you discover any vulnerability or security defect, please report it directly to the repository maintainer.
