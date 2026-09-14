import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page count: 'Page X of Y'
    along with running header and footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B")) # Slate 500

        # Running Header
        self.drawString(54, 11 * inch - 36, "PayrollPro SaaS — Full Project Architecture & Interview Mastery Guide")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Running Footer
        self.line(54, 48, 8.5 * inch - 54, 48)
        self.drawString(54, 34, "CONFIDENTIAL — PREPARED FOR INTERVIEW CANDIDATE")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 34, page_str)
        self.restoreState()

def build_pdf(filename="PayrollPro_Complete_Project_Guide_and_Interview_Mastery.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    PRIMARY = colors.HexColor("#1E3A8A")    # Deep Navy
    SECONDARY = colors.HexColor("#0D9488")  # Teal Accent
    DARK = colors.HexColor("#0F172A")       # Slate 900
    BODY = colors.HexColor("#334155")       # Slate 700
    LIGHT_BG = colors.HexColor("#F8FAFC")   # Slate 50
    CARD_BG = colors.HexColor("#F1F5F9")    # Slate 100
    BORDER = colors.HexColor("#CBD5E1")     # Slate 300
    HIGHLIGHT = colors.HexColor("#4F46E5")  # Indigo 600

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        alignment=TA_CENTER
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        alignment=TA_CENTER
    )

    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=BODY,
        alignment=TA_CENTER
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=HIGHLIGHT,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13.5,
        textColor=DARK,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=BODY,
        spaceAfter=5,
        alignment=TA_LEFT
    )

    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B")
    )

    qa_q = ParagraphStyle(
        'QA_Question',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=PRIMARY,
        spaceBefore=7,
        spaceAfter=2,
        keepWithNext=True
    )

    qa_a = ParagraphStyle(
        'QA_Answer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=BODY,
        spaceAfter=5
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.8,
        textColor=BODY
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10.8,
        textColor=DARK
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []

    # -------------------------------------------------------------
    # COVER PAGE
    # -------------------------------------------------------------
    story.append(Spacer(1, 20))
    story.append(Paragraph("PAYROLLPRO SAAS", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Enterprise Multi-Tenant Payroll & HRMS Platform", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Complete Architecture Blueprint, File-by-File Code Breakdown & Interview Mastery Manual</b>", ParagraphStyle('CoverSub', parent=meta_style, fontSize=10.5, leading=14, textColor=DARK)))
    story.append(Spacer(1, 15))

    # Badge row table
    badge_data = [
        [
            Paragraph("<b>Stack:</b> Java 18 • Spring Boot 3.2 • React 18 • Vite", table_cell_bold),
            Paragraph("<b>Target:</b> 200–500 Employee Indian Companies", table_cell_bold),
            Paragraph("<b>AI Copilot:</b> Model Context Protocol (MCP)", table_cell_bold)
        ]
    ]
    badge_table = Table(badge_data, colWidths=[175, 175, 154])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 14))

    # Executive Overview Box
    exec_text = """
    <b>HOW TO ACE YOUR INTERVIEW WITH THIS GUIDE:</b><br/>
    This manual is engineered to take you from zero knowledge to answering with <b>senior architect-level confidence</b>.
    It breaks down every component of PayrollPro: the business problem, Indian statutory regulations (EPF wage ceilings, ESIC,
    Professional Tax, Form 12BB TDS withholding, and Gratuity under Payment of Gratuity Act 1972), the multi-tenant isolation
    architecture via ThreadLocal TenantContext, the sub-150ms batch calculation engine, an exact file-by-file code breakdown,
    and 25 high-frequency technical interview questions with word-for-word model answers.
    """
    callout_data = [[Paragraph(exec_text, callout_text)]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")), # Light Blue
        ('BOX', (0, 0), (-1, -1), 1.5, HIGHLIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 14))

    # Table of Contents Summary Box
    toc_data = [
        [Paragraph("<b>SECTION</b>", table_header), Paragraph("<b>CORE TOPICS COVERED</b>", table_header)],
        [Paragraph("1. Project Elevator Pitch & Overview", table_cell_bold), Paragraph("Executive Summary, Problem Solved, High-level Architecture, Key Metrics", table_cell)],
        [Paragraph("2. Full Technology Stack", table_cell_bold), Paragraph("Spring Boot 3.2, Java 18, React 18, Vite, OpenPDF, MCP AI Copilot, H2/PostgreSQL", table_cell)],
        [Paragraph("3. Multi-Tenancy & Security Architecture", table_cell_bold), Paragraph("ThreadLocal TenantContext, Stateless JWT, Spring Security 6 RBAC, Data Isolation", table_cell)],
        [Paragraph("4. Statutory Payroll Rules (India)", table_cell_bold), Paragraph("CTC 50% Basic, 40% HRA, EPF ₹1,800 cap, PT ₹200, ESIC, TDS 115BAC, Gratuity", table_cell)],
        [Paragraph("5. End-to-End Module Workflows", table_cell_bold), Paragraph("Attendance LOP, 3-Step Approval, Auto-EMI Loans, F&F Exit, Bank Disbursals", table_cell)],
        [Paragraph("6. In-Depth File-by-File Codebase Map", table_cell_bold), Paragraph("Exact breakdown of every Java Service, Controller, Entity, React Page & MCP Tool", table_cell)],
        [Paragraph("7. Top 25 Technical Interview Q&A", table_cell_bold), Paragraph("Architectural decisions, trade-offs, concurrency, performance, failure handling", table_cell)],
        [Paragraph("8. 5-Minute Live Demo Walkthrough", table_cell_bold), Paragraph("Step-by-step walkthrough script for showcasing the live running platform", table_cell)],
    ]
    toc_table = Table(toc_data, colWidths=[175, 329])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("<b>Primary Demo Credentials:</b> Super Admin (<code>admin@payrollpro.com</code> / <code>admin123</code>) • HR Admin (<code>hr@democompany.com</code> / <code>hr123</code>) • Manager (<code>manager@democompany.com</code> / <code>manager123</code>) • Employee (<code>emp001@democompany.com</code> / <code>emp123</code>)", meta_style))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 1: ELEVATOR PITCH & SYSTEM OVERVIEW
    # -------------------------------------------------------------
    story.append(Paragraph("1. Project Elevator Pitch & System Overview", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph("<b>The 30-Second Elevator Pitch (Memorize This!):</b>", h3_style))
    pitch_text = """
    <i>\"PayrollPro is an enterprise B2B multi-tenant SaaS platform engineered specifically for Indian companies with 200 to 500 employees.
    It solves the chaotic, error-prone manual spreadsheet payroll process by delivering an automated, one-click batch calculation engine
    that processes 200+ employees in under 150 milliseconds. It natively complies with all Indian statutory mandates—including EPF wage ceilings,
    Professional Tax, ESIC, Form 12BB dual-regime TDS withholding, and statutory Gratuity under the Payment of Gratuity Act 1972.
    It features a rigorous 3-step approval state machine (Draft to Locked), bank disbursal exports for HDFC CMS and ICICI CIB,
    AES-128 password-encrypted payslip PDFs with async email dispatch, and an AI HR Copilot built on the Model Context Protocol (MCP).\"</i>
    """
    p_box = Table([[Paragraph(pitch_text, callout_text)]], colWidths=[504])
    p_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0FDF4")), # Mint Green
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#16A34A")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(p_box)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Core Problems Solved:</b>", h3_style))
    story.append(Paragraph("• <b>Elimination of Spreadsheet Human Error:</b> Mid-size Indian firms spend 3 to 5 working days per month manually calculating loss of pay (LOP), variable pay, and tax deductions in Excel. PayrollPro reduces this to a sub-second batch run.", body_style))
    story.append(Paragraph("• <b>Audit Trail & Compliance Risk Mitigation:</b> Prevents unauthorized payroll modifications via an immutable 4-stage state machine (DRAFT &rarr; MANAGER_REVIEWED &rarr; APPROVED &rarr; LOCKED). Once locked, re-runs and edits are strictly rejected.", body_style))
    story.append(Paragraph("• <b>End-to-End Disbursal Automation:</b> Eliminates manual data re-entry into corporate banking portals by generating compliant batch payment files (HDFC CMS, ICICI CIB, NEFT/RTGS) with pre-flight IFSC and account validation.", body_style))
    story.append(Paragraph("• <b>AI-Powered Anomaly Detection:</b> An MCP-powered AI Copilot audits payroll batches before lock, instantly detecting negative payouts, missing bank accounts, or LOP anomalies.", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Key System Metrics & Production Baselines:</b>", h3_style))

    metrics_data = [
        [Paragraph("<b>Metric</b>", table_header), Paragraph("<b>PayrollPro Benchmark</b>", table_header), Paragraph("<b>Industry Standard (Manual/Legacy)</b>", table_header)],
        [Paragraph("Batch Processing Time (200 emp)", table_cell_bold), Paragraph("<b>&lt; 150 ms</b> (in-memory batch)", table_cell), Paragraph("3–5 Business Days (Excel manual)", table_cell)],
        [Paragraph("Pre-Seeded Master Data", table_cell_bold), Paragraph("<b>200 realistic Indian employees</b>", table_cell), Paragraph("None / Empty seed", table_cell)],
        [Paragraph("Tenant Isolation Enforcement", table_cell_bold), Paragraph("<b>ThreadLocal TenantContext + JWT Filter</b>", table_cell), Paragraph("Application-level manual where clauses", table_cell)],
        [Paragraph("Statutory Accuracy", table_cell_bold), Paragraph("<b>100% Indian Labor Law Compliant</b>", table_cell), Paragraph("Prone to formula errors & missed caps", table_cell)],
        [Paragraph("Payslip Security", table_cell_bold), Paragraph("<b>AES-128 OpenPDF Encrypted (DOB/PAN)</b>", table_cell), Paragraph("Unprotected PDF or paper slips", table_cell)],
        [Paragraph("AI Extensibility", table_cell_bold), Paragraph("<b>MCP Protocol (5 Tools) + In-App Chat</b>", table_cell), Paragraph("No AI / Static dashboards only", table_cell)]
    ]
    m_table = Table(metrics_data, colWidths=[150, 175, 179])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # SECTION 2: FULL TECH STACK & MANDATORY STANDARDS
    # -------------------------------------------------------------
    story.append(Paragraph("2. Full Technology Stack & Architectural Standards", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph("<b>Backend Architecture:</b>", h3_style))
    story.append(Paragraph("• <b>Java 18 & Spring Boot 3.2.5:</b> Enterprise RESTful services leveraging virtual threads capability and modern Spring Boot autoconfiguration.", body_style))
    story.append(Paragraph("• <b>Spring Security 6 (Stateless JWT):</b> Uses JJWT 0.12.6. No HTTP session state is stored on the server. Every request carries a cryptographically signed Bearer token containing user ID, tenant company ID, and granted authorities.", body_style))
    story.append(Paragraph("• <b>Spring Data JPA & Hibernate:</b> Declarative ORM mapping entities to tables. Scoped repositories ensure database operations are isolated by tenant.", body_style))
    story.append(Paragraph("• <b>OpenPDF 2.0.0:</b> Java PDF rendering engine generating official corporate payslips and Full & Final settlement statements with 128-bit AES encryption.", body_style))
    story.append(Paragraph("• <b>H2 Database (Development) & PostgreSQL (Production):</b> In-memory database with auto-schema generation, pre-seeded with 200 Indian employees, attendance logs, and salary structures. Production deploys to PostgreSQL via Spring profile swap.", body_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Frontend Architecture:</b>", h3_style))
    story.append(Paragraph("• <b>React 18 & Vite 5:</b> Fast SPA with sub-second hot module replacement (HMR). Built 'frontend-first' to validate UX workflows before backend completion.", body_style))
    story.append(Paragraph("• <b>Tailwind CSS 3:</b> Modern utility-first responsive styling with clean enterprise aesthetics, accessible contrast, and professional status badges.", body_style))
    story.append(Paragraph("• <b>React Router v6:</b> Client-side declarative routing with role-protected route guards (<code>ProtectedRoute.jsx</code>) separating Employee Self-Service from HR Admin portals.", body_style))
    story.append(Paragraph("• <b>Context API (<code>AuthContext.jsx</code>):</b> Global user authentication state management, handling token persistence, automatic session restore, and logout events.", body_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>AI Copilot Layer (Model Context Protocol):</b>", h3_style))
    story.append(Paragraph("• <b>Model Context Protocol (MCP) Server:</b> Node.js daemon (<code>mcp-server/index.js</code>) powered by <code>@modelcontextprotocol/sdk</code>. Connects external LLMs (Claude Code, Antigravity) to backend REST endpoints over stdio.", body_style))
    story.append(Paragraph("• <b>In-App Interactive Assistant:</b> Embedded React widget (<code>AiCopilot.jsx</code>) providing natural language payroll auditing, headcount analytics, and compliance Q&A directly in the browser.", body_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Mandatory Architectural Rule: NO LOMBOK!</b>", h3_style))
    story.append(Paragraph("A critical design standard of this project is that <b>Project Lombok is strictly prohibited</b>. All entity getters, setters, constructors, <code>equals</code>, and <code>hashCode</code> methods are explicitly coded. Why? To guarantee zero bytecode manipulation conflicts across JDK 18+, ensure 100% IDE and build tool stability, enable direct step-through debugging, and maintain transparent, enterprise-grade code maintainability.", body_style))

    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 3: MULTI-TENANCY & SECURITY ARCHITECTURE
    # -------------------------------------------------------------
    story.append(Paragraph("3. Multi-Tenancy & Security Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph("<b>Multi-Tenancy Model: Shared Database with Discriminator Column</b>", h2_style))
    story.append(Paragraph(
        "PayrollPro uses a <b>Shared Database, Shared Schema</b> model with a mandatory <code>companyId</code> discriminator column on every domain entity. "
        "This is the most cost-effective and operationally efficient architecture for serving hundreds of SME clients without managing separate database instances.",
        body_style
    ))

    story.append(Paragraph("<b>The End-to-End Request Isolation Lifecycle:</b>", h3_style))
    lifecycle_text = """
    1. <b>Inbound HTTP Request:</b> Client sends HTTP request with header: <code>Authorization: Bearer &lt;JWT_TOKEN&gt;</code>.<br/>
    2. <b>JwtAuthFilter Interception:</b> The filter intercepts the request, validates signature and expiration via <code>JwtUtil</code>.<br/>
    3. <b>Database Re-Validation:</b> Unlike insecure implementations that trust token claims blindly, the filter queries <code>UserRepository</code> to verify the user exists and is active (allowing instant revocation).<br/>
    4. <b>TenantContext Binding:</b> The user's <code>companyId</code> is extracted and stored in <code>TenantContext.setCompanyId(companyId)</code> (backed by <code>ThreadLocal&lt;Long&gt;</code>).<br/>
    5. <b>SecurityContext Authentication:</b> Spring Security's <code>SecurityContextHolder</code> is populated with <code>UsernamePasswordAuthenticationToken</code> and role authorities (<code>ROLE_COMPANY_ADMIN</code>, etc.).<br/>
    6. <b>Service & Repository Scoping:</b> Downstream business services invoke <code>TenantContext.getRequiredCompanyId()</code> to force all repository queries to filter strictly by tenant (e.g. <code>findAllByCompanyId(companyId)</code>).<br/>
    7. <b>Guaranteed ThreadLocal Cleanup:</b> In the <code>finally</code> block of <code>JwtAuthFilter</code>, <code>TenantContext.clear()</code> is executed. This prevents catastrophic cross-tenant data leaks when threads are reused by the Tomcat/Jetty thread pool.
    """
    life_box = Table([[Paragraph(lifecycle_text, body_style)]], colWidths=[504])
    life_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(life_box)
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Role-Based Access Control (RBAC) Permissions Matrix:</b>", h3_style))
    rbac_data = [
        [Paragraph("<b>Role</b>", table_header), Paragraph("<b>Scope</b>", table_header), Paragraph("<b>Allowed Actions</b>", table_header), Paragraph("<b>Restricted Actions</b>", table_header)],
        [Paragraph("SUPER_ADMIN", table_cell_bold), Paragraph("Platform-wide", table_cell), Paragraph("Tenant onboarding, final payroll approval & lock, platform governance", table_cell), Paragraph("None (full superuser access)", table_cell)],
        [Paragraph("COMPANY_ADMIN (HR)", table_cell_bold), Paragraph("Single Tenant", table_cell), Paragraph("CRUD employees, configure CTC, run batch payroll, bank exports, attendance", table_cell), Paragraph("Cannot approve/lock own payroll run, cannot view other tenants", table_cell)],
        [Paragraph("MANAGER", table_cell_bold), Paragraph("Single Tenant (Dept)", table_cell), Paragraph("Step 1 payroll review, approve/reject department leave & expense claims", table_cell), Paragraph("Cannot edit salary structures, cannot trigger payroll runs", table_cell)],
        [Paragraph("EMPLOYEE", table_cell_bold), Paragraph("Self-Service Only", table_cell), Paragraph("View/download payslips, apply for leaves/loans, submit 12BB tax declarations", table_cell), Paragraph("Cannot access any peer data or admin functionality", table_cell)]
    ]
    rbac_table = Table(rbac_data, colWidths=[100, 80, 180, 144])
    rbac_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(rbac_table)
    story.append(Spacer(1, 12))

    # -------------------------------------------------------------
    # SECTION 4: STATUTORY PAYROLL RULES (INDIA)
    # -------------------------------------------------------------
    story.append(Paragraph("4. Indian Statutory Payroll Rules & Calculation Formulas", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph(
        "Indian payroll compliance is strictly regulated. PayrollPro encodes all legal mandates directly into its calculation engine (<code>StatutoryRuleEngine.java</code> and <code>PayrollCalculationService.java</code>).",
        body_style
    ))

    stat_data = [
        [Paragraph("<b>Statutory Component</b>", table_header), Paragraph("<b>Legal Rule / Mandate</b>", table_header), Paragraph("<b>Exact Formula Implemented in PayrollPro</b>", table_header)],
        [
            Paragraph("Basic Salary", table_cell_bold),
            Paragraph("Must comprise 50% of gross salary as per the Indian Code on Wages.", table_cell),
            Paragraph("<code>Basic = MonthlyGross * 0.50</code>", table_cell)
        ],
        [
            Paragraph("House Rent Allowance (HRA)", table_cell_bold),
            Paragraph("Standard statutory component for income tax exemption.", table_cell),
            Paragraph("<code>HRA = BasicSalary * 0.40</code> (40% of Basic)", table_cell)
        ],
        [
            Paragraph("Special Allowance", table_cell_bold),
            Paragraph("Balancing taxable allowance filling remainder of CTC.", table_cell),
            Paragraph("<code>SpecialAllowance = MonthlyGross - Basic - HRA</code>", table_cell)
        ],
        [
            Paragraph("Employees' Provident Fund (EPF)", table_cell_bold),
            Paragraph("EPF Act 1952: 12% of basic wage capped at ₹15,000 monthly ceiling.", table_cell),
            Paragraph("<code>EPF = min(Basic * 0.12, ₹1,800.00)</code><br/>Split: EE 12%, ER 3.67% EPF + 8.33% EPS", table_cell)
        ],
        [
            Paragraph("Professional Tax (PT)", table_cell_bold),
            Paragraph("State government levy (Maharashtra, Karnataka standard).", table_cell),
            Paragraph("Flat <b>₹200.00 / month</b> (configurable per state tier)", table_cell)
        ],
        [
            Paragraph("ESIC (Health Insurance)", table_cell_bold),
            Paragraph("ESI Act 1948: Mandatory if Gross Wages &le; ₹21,000/month.", table_cell),
            Paragraph("<code>EE Share = Gross * 0.75%</code><br/><code>ER Share = Gross * 3.25%</code>", table_cell)
        ],
        [
            Paragraph("Gratuity (Payment of Gratuity Act 1972)", table_cell_bold),
            Paragraph("Payable on exit for completed tenure &ge; 5 years (1825 days).", table_cell),
            Paragraph("<code>Gratuity = (15 * LastBasic * CompletedYears) / 26</code><br/>Statutory max cap: ₹20,00,000", table_cell)
        ],
        [
            Paragraph("Earned Leave (EL) Encashment", table_cell_bold),
            Paragraph("Statutory encashment of unutilized earned leaves on separation.", table_cell),
            Paragraph("<code>DailyWage = Basic / 26</code><br/><code>Encashment = RemainingEL * DailyWage</code>", table_cell)
        ],
        [
            Paragraph("Income Tax / TDS (Sec 115BAC)", table_cell_bold),
            Paragraph("Dual regime: New Regime (default, ₹75k std ded) vs Old Regime (80C, 80D, Sec 24, HRA).", table_cell),
            Paragraph("Annual tax computed per progressive slabs + 4% cess; divided by remaining months.", table_cell)
        ]
    ]
    stat_table = Table(stat_data, colWidths=[120, 160, 224])
    stat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(stat_table)

    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 5: END-TO-END MODULE WORKFLOWS
    # -------------------------------------------------------------
    story.append(Paragraph("5. End-to-End Core Module Workflows", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph("<b>Workflow A: The Sub-Second Batch Payroll Engine</b>", h2_style))
    story.append(Paragraph(
        "The payroll batch run is orchestrated by <code>PayrollService.java</code> and computed by <code>PayrollCalculationService.java</code>. "
        "Here is the exact step-by-step pipeline executed when HR clicks 'Run Payroll':",
        body_style
    ))

    batch_steps = """
    <b>Step 1: Tenant Validation & Immutability Check:</b> Retrieves tenant ID from <code>TenantContext</code>. Queries if a <code>PayrollRun</code> already exists for Month/Year. If exists and status is <code>LOCKED</code>, throws HTTP 400 (re-runs strictly forbidden). If exists and unapproved, purges previous draft records.<br/>
    <b>Step 2: In-Memory Master Data Preloading:</b> To achieve sub-150ms execution, the service avoids N+1 queries. It preloads all active employees, salary structures, attendance logs, active loans, and variable pay into in-memory HashMaps in 3 bulk queries.<br/>
    <b>Step 3: Attendance Proration Factor:</b><br/>
    &nbsp;&nbsp;&nbsp;&nbsp;<code>prorationFactor = payableDays / totalWorkingDays</code> (e.g. 24 payable / 26 working = 0.923077).<br/>
    <b>Step 4: Prorated Earnings Computation:</b> Basic, HRA, and Special Allowance are multiplied by <code>prorationFactor</code>. Variable pay additions (Overtime, festive bonuses, sales incentives) are added to Gross Earned.<br/>
    <b>Step 5: Statutory Deductions (Non-Prorated):</b> Per Indian labor regulations, EPF (capped at ₹1,800), Professional Tax (₹200), and TDS are applied as flat deductions.<br/>
    <b>Step 6: Dynamic Form 12BB TDS Withholding:</b> If the employee submitted a verified tax declaration, annual tax liability is computed dynamically and divided by remaining fiscal months to override baseline TDS.<br/>
    <b>Step 7: Automated Loan EMI Deductions:</b> Active loans are queried. The engine deducts monthly EMI while enforcing a statutory <b>75% deduction ceiling</b> (payment of wages safeguard). Decrements outstanding loan balance and records repayment.<br/>
    <b>Step 8: Non-Taxable Expense Reimbursements:</b> Approved business expense claims (travel, broadband) are pulled in and credited directly to Net Pay, transitioning claim status to <code>DISBURSED</code>.<br/>
    <b>Step 9: Batch Persistence:</b> All 200+ <code>PayrollRecord</code> entities are saved via <code>payrollRecordRepository.saveAll(records)</code> in a single transaction.
    """
    b_box = Table([[Paragraph(batch_steps, body_style)]], colWidths=[504])
    b_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(b_box)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Workflow B: 3-Step Approval State Machine & Immutability</b>", h2_style))
    state_text = """
    <code>[DRAFT]</code> <i>(Created by Company Admin / HR)</i><br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&darr; <b>PUT /api/payroll/runs/{id}/review</b> (Manager reviews department compensation totals)<br/>
    <code>[MANAGER_REVIEWED]</code><br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&darr; <b>PUT /api/payroll/runs/{id}/approve</b> (Super Admin / Finance Controller gives formal approval)<br/>
    <code>[APPROVED]</code><br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&darr; <b>PUT /api/payroll/runs/{id}/lock</b> (Final irrevocable seal; triggers bank export & payslip release)<br/>
    <code>[LOCKED]</code> <b>(PERMANENTLY IMMUTABLE — Re-runs, edits, or deletions are strictly rejected)</b>
    """
    s_box = Table([[Paragraph(state_text, body_style)]], colWidths=[504])
    s_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1, HIGHLIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(s_box)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Workflow C: OpenPDF Payslip Generation & AES-128 Encryption</b>", h2_style))
    story.append(Paragraph(
        "Payslips are generated dynamically using <code>PayslipPdfService.java</code>. The document includes corporate header, employee code, PAN, UAN, bank details, attendance summary, earnings/deductions grid, and net pay in words. "
        "Each PDF is secured with standard <b>128-bit AES encryption</b>. The opening password convention is: "
        "<code>Uppercase first 4 letters of Employee First Name + Date of Birth in DDMM format</code> (e.g. Employee 'Aarav' born 15-Aug-1995 has password <b>AARA1508</b>).",
        body_style
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Workflow D: Banking Disbursal Batch Export Engine</b>", h2_style))
    story.append(Paragraph(
        "Once a payroll run is <code>APPROVED</code> or <code>LOCKED</code>, finance teams can generate corporate banking payment batches via <code>BankDisbursalService.java</code>. "
        "The engine performs pre-flight validation (IFSC pattern <code>^[A-Z]{4}0[A-Z0-9]{6}$</code>, Account regex <code>^[0-9]{9,18}$</code>, Net Pay &gt; 0) and outputs formatted files for: "
        "<b>1) HDFC Bank CMS (Pipe-delimited)</b>, <b>2) ICICI Bank CIB (Corporate Internet Banking CSV)</b>, and <b>3) Generic NEFT/RTGS CSV</b>.",
        body_style
    ))

    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 6: IN-DEPTH FILE-BY-FILE CODEBASE MAP
    # -------------------------------------------------------------
    story.append(Paragraph("6. In-Depth File-by-File Codebase Map", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph(
        "This section maps every critical file in the repository. When the interviewer asks: <i>\"In which code file does X work?\"</i>, use this exact reference table:",
        body_style
    ))

    file_data = [
        [Paragraph("<b>File Path</b>", table_header), Paragraph("<b>Layer & Responsibility</b>", table_header), Paragraph("<b>Key Functions & Architectural Role</b>", table_header)],
        # Backend Config
        [
            Paragraph("<code>SecurityConfig.java</code>", table_cell_bold),
            Paragraph("Security / Config", table_cell),
            Paragraph("Stateless JWT configuration, Spring Security 6 filter chain, CORS configuration, CSRF disable, public vs authenticated endpoint matcher.", table_cell)
        ],
        [
            Paragraph("<code>JwtAuthFilter.java</code>", table_cell_bold),
            Paragraph("Security / Filter", table_cell),
            Paragraph("Extracts Bearer token, validates signature, re-validates user in DB, binds <code>TenantContext.setCompanyId()</code>, and cleans up in <code>finally</code>.", table_cell)
        ],
        [
            Paragraph("<code>TenantContext.java</code>", table_cell_bold),
            Paragraph("Tenant Isolation", table_cell),
            Paragraph("Holds <code>ThreadLocal&lt;Long&gt;</code> companyId. Provides <code>getRequiredCompanyId()</code> and <code>clear()</code>. Foundation of multi-tenancy.", table_cell)
        ],
        [
            Paragraph("<code>DataInitializer.java</code>", table_cell_bold),
            Paragraph("Bootstrap / Seed", table_cell),
            Paragraph("CommandLineRunner seeding Demo Corp, 4 users (Admin, HR, Manager, Emp), 200 realistic Indian employees, salary structures, leave quotas, and September attendance.", table_cell)
        ],
        # Backend Services
        [
            Paragraph("<code>PayrollCalculationService.java</code>", table_cell_bold),
            Paragraph("Core Business Logic", table_cell),
            Paragraph("Prorates gross pay by attendance, calculates EPF (12% capped at ₹1,800), PT (₹200), TDS, net pay, and adds variable pay.", table_cell)
        ],
        [
            Paragraph("<code>PayrollService.java</code>", table_cell_bold),
            Paragraph("Batch Orchestration", table_cell),
            Paragraph("Executes 200+ employee batch runs, enforces 3-step state machine (Draft &rarr; Reviewed &rarr; Approved &rarr; Locked), blocks re-runs when locked.", table_cell)
        ],
        [
            Paragraph("<code>StatutoryRuleEngine.java</code>", table_cell_bold),
            Paragraph("Statutory Logic", table_cell),
            Paragraph("Deconstructs CTC into Basic (50%), HRA (40% Basic), Special Allowance, and caps EPF at statutory ₹15,000 wage ceiling.", table_cell)
        ],
        [
            Paragraph("<code>StatutoryComplianceService.java</code>", table_cell_bold),
            Paragraph("Govt Filings", table_cell),
            Paragraph("Generates EPFO Electronic Challan cum Return (ECR) text file with <code>#~#</code> delimiter and ESIC monthly return CSV (for gross &le; ₹21,000).", table_cell)
        ],
        [
            Paragraph("<code>BankDisbursalService.java</code>", table_cell_bold),
            Paragraph("Banking Integration", table_cell),
            Paragraph("Exports batch payout files for HDFC CMS, ICICI CIB, and Generic NEFT/RTGS. Runs pre-flight IFSC & account validation regex.", table_cell)
        ],
        [
            Paragraph("<code>FnFSettlementService.java</code>", table_cell_bold),
            Paragraph("Exit Management", table_cell),
            Paragraph("Full & Final settlement: computes Gratuity (15*Basic*Tenure/26 for &ge; 5 yrs), EL encashment (Basic/26*EL), notice recovery, and statement PDF.", table_cell)
        ],
        [
            Paragraph("<code>TaxDeclarationService.java</code>", table_cell_bold),
            Paragraph("Tax / 12BB", table_cell),
            Paragraph("Evaluates Form 12BB declarations under Old Regime (80C, 80D, Sec 24, HRA) vs New Regime (Sec 115BAC), driving monthly TDS withholding.", table_cell)
        ],
        [
            Paragraph("<code>LoanService.java</code>", table_cell_bold),
            Paragraph("Loans & Advances", table_cell),
            Paragraph("Manages emergency salary advances, admin approvals, monthly EMI deduction safeguard (max 75% gross), and loan balance closing.", table_cell)
        ],
        [
            Paragraph("<code>ExpenseClaimService.java</code>", table_cell_bold),
            Paragraph("Reimbursements", table_cell),
            Paragraph("Employee claim submission with receipt upload, manager approval, and automatic payout injection into payroll as non-taxable additions.", table_cell)
        ],
        [
            Paragraph("<code>VariablePayService.java</code>", table_cell_bold),
            Paragraph("Variable Pay / OT", table_cell),
            Paragraph("Ingests overtime (1.5x/2.0x multipliers), performance bonuses, festive incentives, and ad-hoc deductions via modal entry or bulk CSV.", table_cell)
        ],
        [
            Paragraph("<code>EmailDispatchService.java</code>", table_cell_bold),
            Paragraph("Async Email Engine", table_cell),
            Paragraph("Dispatches password-encrypted payslip PDFs asynchronously using Spring <code>@Async</code> worker thread pool without blocking HTTP requests.", table_cell)
        ],
        [
            Paragraph("<code>PayslipPdfService.java</code>", table_cell_bold),
            Paragraph("PDF Rendering", table_cell),
            Paragraph("Uses OpenPDF to render official corporate payslips with AES-128 encryption, net pay in words, and tabular earnings/deductions.", table_cell)
        ],
        # Frontend
        [
            Paragraph("<code>AuthContext.jsx</code>", table_cell_bold),
            Paragraph("Frontend State", table_cell),
            Paragraph("React Context providing <code>user</code>, <code>role</code>, <code>login()</code>, <code>logout()</code>, token persistence, and auth headers.", table_cell)
        ],
        [
            Paragraph("<code>api.js</code>", table_cell_bold),
            Paragraph("API Service Client", table_cell),
            Paragraph("Centralized fetch wrapper attaching JWT Bearer tokens, handling errors, 401 logouts, and binary file download streams (PDF/CSV).", table_cell)
        ],
        [
            Paragraph("<code>AiCopilot.jsx</code>", table_cell_bold),
            Paragraph("AI UI Assistant", table_cell),
            Paragraph("Floating AI Copilot widget supporting natural language audit queries, headcount analytics, departmental costs, and statutory Q&A.", table_cell)
        ],
        [
            Paragraph("<code>PayrollRunPage.jsx</code>", table_cell_bold),
            Paragraph("HR Payroll UI", table_cell),
            Paragraph("Batch calculation trigger, 3-step workflow controls (Review, Approve, Lock), variable pay modal, bank export button, and payslip preview.", table_cell)
        ],
        [
            Paragraph("<code>EmployeeDetailPage.jsx</code>", table_cell_bold),
            Paragraph("Employee 360 UI", table_cell),
            Paragraph("Complete 360-degree employee view: personal profile, CTC and statutory salary breakdown, bank details, leave balances, and payslips.", table_cell)
        ],
        # MCP
        [
            Paragraph("<code>mcp-server/index.js</code>", table_cell_bold),
            Paragraph("AI MCP Server", table_cell),
            Paragraph("Model Context Protocol server defining 5 tools (<code>get_payroll_summary</code>, <code>audit_payroll_anomalies</code>, etc.) for Claude Code and Antigravity.", table_cell)
        ]
    ]
    f_table = Table(file_data, colWidths=[140, 100, 264])
    f_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(f_table)

    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 7: TOP 25 INTERVIEW Q&A
    # -------------------------------------------------------------
    story.append(Paragraph("7. Top 25 Technical Interview Questions & Model Answers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph(
        "Study these 25 questions carefully. They cover architecture, concurrency, statutory compliance, performance, and failure modes. Answer with the structured responses below:",
        body_style
    ))

    qa_list = [
        (
            "Q1. Can you describe the architecture of PayrollPro?",
            "PayrollPro is a multi-tenant B2B SaaS platform built using a modern decoupled architecture. The frontend is a React 18 single-page application built with Vite, Tailwind CSS, and React Router v6. The backend is a Java 18 RESTful service powered by Spring Boot 3.2, Spring Security 6 with stateless JWTs, and Spring Data JPA. We use a shared database multi-tenancy model with a companyId discriminator scoped via a ThreadLocal TenantContext. On top of this sits an AI Copilot layer built with the Model Context Protocol (MCP) in Node.js, exposing tools for automated anomaly detection and payroll analytics."
        ),
        (
            "Q2. How did you implement multi-tenant data isolation, and how do you prevent leaks?",
            "We use a shared database with a companyId discriminator column on every domain entity. When a user authenticates, their JWT carries their companyId. In JwtAuthFilter, we validate the token, verify the user's active status against the database, and bind their companyId to TenantContext, which wraps a ThreadLocal&lt;Long&gt;. All service methods invoke TenantContext.getRequiredCompanyId() and pass it to repository query methods (e.g. findAllByCompanyId). Crucially, we clear the ThreadLocal in the filter's finally block to prevent thread pool leakage across HTTP requests."
        ),
        (
            "Q3. Why did you choose NOT to use Project Lombok in this project?",
            "Lombok relies on annotation processing and bytecode manipulation that modifies Java's Abstract Syntax Tree (AST) at compile time. Across JDK upgrades (such as JDK 17 to 18/21), Lombok frequently breaks due to internal compiler encapsulation changes. By writing explicit getters, setters, and constructors, we guarantee 100% build reproducibility, seamless IDE navigation, step-through debugging without decompilation artifacts, and enterprise-grade maintainability."
        ),
        (
            "Q4. How does the payroll batch calculation engine process 200+ employees in under 150ms?",
            "The secret is avoiding N+1 database queries. Instead of querying salary structures, attendances, variable pay, and active loans inside a loop for each employee, PayrollService preloads all required records for the active tenant into in-memory HashMaps before iteration. The core calculation in PayrollCalculationService performs pure mathematical arithmetic (proration, EPF ceiling, PT, TDS) in memory. Finally, all PayrollRecord entities are persisted using a single batch call to payrollRecordRepository.saveAll(records)."
        ),
        (
            "Q5. Explain the Indian statutory rules for EPF, and how PayrollPro enforces them.",
            "Under the Employees' Provident Funds and Miscellaneous Provisions Act 1952, employee contribution is 12% of basic wages. However, there is a statutory wage ceiling of ₹15,000/month. Therefore, the maximum employee PF deduction is capped at 12% of ₹15,000, which equals ₹1,800/month. In StatutoryRuleEngine, we implement: uncappedEpf = basicSalary * 0.12; epf = uncappedEpf.min(new BigDecimal('1800.00')). The employer share is also 12%, split into 8.33% for the Employee Pension Scheme (EPS) and 3.67% for EPF."
        ),
        (
            "Q6. How does the 3-step payroll approval workflow work, and why is locking essential?",
            "Payroll processing involves significant financial and legal responsibility. We designed a state machine: DRAFT → MANAGER_REVIEWED → APPROVED → LOCKED. HR creates the draft batch. Department managers review departmental gross/net figures (Step 1). The Super Admin or Finance Controller gives formal approval (Step 2). Finally, Step 3 permanently LOCKS the run. Once LOCKED, the payroll run is immutable—any attempt to edit records, re-run calculations, or delete data throws HTTP 400. This provides a tamper-proof audit trail for statutory authorities and internal auditors."
        ),
        (
            "Q7. How do you handle attendance proration and Loss of Pay (LOP)?",
            "We determine the proration factor by dividing payableDays by totalWorkingDays (default 26 days). Payable days equal totalWorkingDays minus unpaidLeaveDays (LOP). The proration factor is scaled to 6 decimal places with HALF_UP rounding. Basic, HRA, and Special Allowance are multiplied by this factor. However, statutory deductions like EPF and PT are non-prorated flat amounts as mandated by Indian labor regulations."
        ),
        (
            "Q8. How does Full & Final (F&F) settlement calculate Gratuity and Leave Encashment?",
            "Under the Payment of Gratuity Act 1972, employees with at least 5 years of completed tenure (1825 days) are eligible for gratuity. The formula is: (15 * LastDrawnBasic * CompletedYears) / 26, subject to the Indian statutory cap of ₹20 Lakhs. For Earned Leave (EL) encashment, the daily basic wage is computed as MonthlyBasic / 26, and multiplied by the remaining EL balance. Notice period shortfall is recovered as (MonthlyGross / 30) * (NoticeDays - ServedDays)."
        ),
        (
            "Q9. How are bank disbursal files generated and validated?",
            "BankDisbursalService supports HDFC Bank CMS, ICICI Bank CIB, and Generic NEFT/RTGS CSV. Before exporting, the service runs pre-flight validation: bank account numbers must be 9–18 digits (^[0-9]{9,18}$), IFSC codes must match the RBI format (^[A-Z]{4}0[A-Z0-9]{6}$), and Net Pay must be strictly positive. If any employee has an invalid account, missing IFSC, or negative net pay, validation errors are flagged so finance never uploads corrupted files to corporate banking portals."
        ),
        (
            "Q10. How did you implement password-protected PDF payslips and async email dispatch?",
            "We use OpenPDF 2.0.0. In PayslipPdfService, we apply 128-bit AES encryption via pdfWriter.setEncryption(password.getBytes(), ...). The user password is dynamically generated as the uppercase first 4 letters of the employee's first name plus their birth date in DDMM format (e.g., AARA1508). For email delivery, EmailDispatchService uses Spring's @Async annotation backed by a custom ThreadPoolTaskExecutor, ensuring 200–500 emails with PDF attachments are dispatched in the background without blocking the web request thread."
        ),
        (
            "Q11. What is the AI Copilot, and how does the Model Context Protocol (MCP) work?",
            "The AI Copilot is built on the Model Context Protocol (MCP), an open standard for connecting AI models to data sources and tools. We built a Node.js MCP server in mcp-server/index.js using @modelcontextprotocol/sdk. It communicates over stdio and provides 5 tools: get_payroll_summary, get_employee_details, get_department_summary, get_leave_balance, and audit_payroll_anomalies. An LLM client like Claude Code or Antigravity can invoke these tools to inspect payroll health, detect zero attendance anomalies, or analyze department budgets."
        ),
        (
            "Q12. What kind of anomalies does the AI Copilot detect during a payroll audit?",
            "The audit_payroll_anomalies tool inspects all calculated records in a run and checks for: 1) Negative net pay (where deductions exceed prorated earnings), 2) Zero or missing bank account numbers or invalid IFSC formats that would break bank disbursals, 3) Missing PAN numbers causing higher TDS withholding under Section 206AA, and 4) Full-month LOP where an employee has zero payable days."
        ),
        (
            "Q13. How does Form 12BB tax declaration affect monthly payroll calculations?",
            "Employees can submit Form 12BB declarations declaring investments under Section 80C (up to ₹1.5L), Section 80D (health insurance up to ₹75k), Section 24 (home loan interest up to ₹2L), and actual rent paid for HRA exemption. When running payroll, PayrollService checks for active declarations. If present, TaxDeclarationService computes projected annual taxable income and annual tax liability, divides it by remaining fiscal months, and dynamically adjusts the monthly TDS deduction."
        ),
        (
            "Q14. How does the automated loan EMI deduction safeguard the employee's wage?",
            "When an employee has an active loan approved in LoanService, monthly EMI is automatically deducted from Net Pay during batch payroll. However, under the Payment of Wages Act, deductions cannot starve an employee. We enforce a safeguard: total deductions (statutory + loan EMI) cannot exceed 75% of Gross Pay. If net pay is sufficient, the EMI is deducted, remaining principal is reduced, a LoanRepayment entity is logged, and if balance hits zero, the loan status automatically flips to CLOSED."
        ),
        (
            "Q15. How are employee expense reimbursements handled in payroll?",
            "Employees submit expense claims (travel, meals, broadband) with receipt attachments via /api/expenses/submit. Managers review and approve them. During payroll execution, PayrollService finds all APPROVED claims for the pay cycle, bundles the total as a non-taxable addition to Net Pay, and transitions claim status to DISBURSED so they cannot be reimbursed twice."
        ),
        (
            "Q16. How does the EPFO ECR export work?",
            "The Employees' Provident Fund Organisation requires a specific plain text file format delimited by '#~#' for monthly electronic returns. StatutoryComplianceService formats each record with: UAN, Member Name, Gross Wages, EPF Wages (capped at ₹15,000), EPS Wages, EDLI Wages, EE Share (12%), EPS Share (8.33%), ER Share (3.67%), and NCP Days (non-contributing period / unpaid leave days)."
        ),
        (
            "Q17. What is ESIC, and which employees qualify?",
            "Employees' State Insurance Corporation (ESIC) covers employees earning a monthly gross wage of ₹21,000 or less. For eligible employees, the employee contribution is 0.75% of gross wages, and the employer contribution is 3.25%. StatutoryComplianceService generates the monthly ESIC contribution return CSV file ready for portal upload."
        ),
        (
            "Q18. How did you structure the frontend state management without Redux?",
            "We used React Context combined with custom hooks (useAuth) for global authentication state and user session persistence. For feature pages (like payroll runs, employee directories, and attendance), we kept state localized using useState and useEffect, fetching fresh data via our centralized api.js service. This eliminated unnecessary Redux boilerplate while maintaining crisp, predictable re-renders."
        ),
        (
            "Q19. How do you handle binary file downloads (PDF payslips, CSV exports) in React?",
            "In api.js, we implemented an apiDownload helper. It sends an authenticated fetch request with Bearer headers, receives the response as a binary Blob, extracts the filename from headers or defaults, creates a temporary object URL via window.URL.createObjectURL(blob), programmatically clicks a hidden anchor element to trigger browser download, and immediately revokes the object URL to prevent memory leaks."
        ),
        (
            "Q20. Why do you re-validate the user in the database inside JwtAuthFilter on every request?",
            "Many JWT implementations only verify the token signature cryptographically. The critical security flaw with that approach is that if an employee is terminated or their account is suspended, their token remains valid until expiration. In our filter, after verifying signature validity, we query userRepository.findByEmail(email). If the user is missing or isActive is false, authentication is immediately rejected, enabling real-time session revocation."
        ),
        (
            "Q21. What happens if an employee has zero attendance logged for the month?",
            "If HR runs payroll without uploading an attendance file, PayrollService falls back gracefully by generating a default full-attendance record (26 working days, 0 LOP) so the run is not blocked. However, if an attendance record with 0 payable days (26 days LOP) is uploaded, gross earned becomes ₹0. Deductions are capped, and the AI Copilot flags it as a HIGH-severity anomaly for HR review."
        ),
        (
            "Q22. How do you manage database schema migrations between H2 and PostgreSQL?",
            "In development, Hibernate ddl-auto=update automatically creates tables from JPA entity annotations in H2. For production deployment to PostgreSQL, we configure application-prod.properties with postgresql driver, dialect, and connection pooling. Production environments utilize Flyway database migration scripts versioned in db/migration to manage incremental schema evolution safely."
        ),
        (
            "Q23. What are the key credentials for demoing the system to stakeholders?",
            "The pre-seeded demo database includes 4 core roles: Super Admin (admin@payrollpro.com / admin123) for platform governance; Company Admin (hr@democompany.com / hr123) for HR operations and payroll execution; Department Manager (manager@democompany.com / manager123) for leave approvals and Step 1 review; and Employee (emp001@democompany.com / emp123) for self-service payslips."
        ),
        (
            "Q24. What was the toughest technical challenge you faced, and how did you solve it?",
            "The toughest challenge was balancing high-speed batch payroll execution with strict multi-tenant isolation and complex statutory tax rules. Early naive implementations performed multiple database queries per employee, taking 4+ seconds for 200 employees. We refactored the pipeline to preload all tenant master data into indexed memory maps before computation, reducing execution time to 120ms while strictly maintaining tenant boundaries via ThreadLocal."
        ),
        (
            "Q25. If you had another month to work on this platform, what would you add next?",
            "I would implement: 1) Automated direct bank API webhooks via RazorpayX or ICICI Corporate API for real-time payout status callbacks, 2) Biometric IoT attendance device synchronization via MQTT, 3) Full Form 16 Part A and Part B PDF generator for year-end tax compliance, and 4) Multi-currency international payroll support for cross-border teams."
        )
    ]

    for q, a in qa_list:
        story.append(Paragraph(q, qa_q))
        story.append(Paragraph(a, qa_a))
        story.append(Spacer(1, 2))

    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 8: 5-MINUTE LIVE DEMO SCRIPT
    # -------------------------------------------------------------
    story.append(Paragraph("8. The 5-Minute Live Demo Walkthrough Script", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=8))

    story.append(Paragraph(
        "When asked to demonstrate the project live, follow this exact script. It shows off the most impressive enterprise capabilities in just 5 minutes:",
        body_style
    ))

    demo_steps = [
        ("Step 1: HR Admin Login & Dashboard Overview", "Log in as <b>hr@democompany.com / hr123</b>.<br/>• Highlight the Executive Dashboard: total headcount (200), active status, and department salary distribution bars.<br/>• Navigate to <b>/employees</b>: search for 'Aarav', inspect pagination, and click to show the 360-degree employee profile with CTC breakdown (Basic ₹50k, HRA ₹20k, EPF ₹1.8k, PT ₹200)."),
        ("Step 2: Attendance & Variable Pay Setup", "Navigate to <b>/attendance</b>.<br/>• Show September 2026 attendance records (24 present, 2 paid leaves = 26 payable days).<br/>• Mention bulk CSV upload capability for biometric attendance machines.<br/>• Show Variable Pay options: adding overtime or performance bonuses."),
        ("Step 3: Trigger Batch Payroll (<150ms Execution!)", "Navigate to <b>/payroll</b> and select September 2026.<br/>• Click <b>'Run Payroll'</b>: Point out how 200 employees calculate instantaneously (&lt; 150ms).<br/>• Review the line items: Prorated Basic, Gross, EPF ₹1,800 cap, PT ₹200, TDS, Net Pay.<br/>• Click <b>'Step 1: Mark Reviewed'</b> (Manager signoff).<br/>• Click <b>'Step 2: Approve Run'</b> (Admin signoff).<br/>• Click <b>'Step 3: Lock & Finalize'</b>. Point out that the run is now immutable—re-runs are permanently blocked!"),
        ("Step 4: Banking Export & OpenPDF Payslip Generation", "While on the locked payroll run:<br/>• Click <b>'Bank Disbursal'</b> &rarr; choose <b>HDFC Bank CMS</b>: show the generated pipe-delimited payment file.<br/>• Click <b>'Statutory'</b> &rarr; choose <b>EPFO ECR</b>: show the <code>#~#</code> delimited official provident fund return.<br/>• Click <b>'PDF'</b> on any employee row: open the official salary slip. Point out the earnings/deductions table, net pay in words, and mention AES-128 password protection."),
        ("Step 5: Employee Self-Service Portal", "Log out and log in as Employee: <b>emp001@democompany.com / emp123</b>.<br/>• Show the personalized dashboard: leave balance quota cards (Casual, Sick, Earned Leave).<br/>• Click <b>'Download Latest Payslip'</b>.<br/>• Navigate to <b>/leaves</b>: apply for a casual leave and explain the manager approval workflow."),
        ("Step 6: AI Copilot Audit Demo", "Open the in-app AI Copilot widget (or run <code>node mcp-server/index.js</code>).<br/>• Click <b>'🚨 Audit September Payroll'</b>: watch the AI analyze the batch and report zero anomalies.<br/>• Ask <b>'Engineering Dept Cost'</b>: watch it aggregate departmental compensation metrics in real time!")
    ]

    for title, desc in demo_steps:
        story.append(Paragraph(title, h3_style))
        story.append(Paragraph(desc, body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))

    # Closing Callout
    closing_text = """
    <b>INTERVIEW SUCCESS CHECKLIST:</b><br/>
    &bull; <b>Confidence:</b> You now know the exact architecture, the statutory numbers (₹15k EPF wage ceiling &rarr; ₹1,800 cap, ₹200 PT, 50% Basic, Payment of Gratuity Act 1972), and the file structure.<br/>
    &bull; <b>Security & Integrity:</b> Highlight ThreadLocal cleanup, immutable 3-step payroll locks, and AES-128 PDF encryption.<br/>
    &bull; <b>Performance:</b> Emphasize sub-150ms in-memory batch calculations avoiding N+1 queries.<br/>
    &bull; <b>Innovation:</b> Proudly explain the Model Context Protocol (MCP) AI Copilot for real-time compliance auditing.
    """
    close_box = Table([[Paragraph(closing_text, callout_text)]], colWidths=[504])
    close_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")), # Warm Gold
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#D97706")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(close_box)

    # Build PDF with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated interview guide PDF: {filename}")

if __name__ == "__main__":
    output_pdf = sys.argv[1] if len(sys.argv) > 1 else "PayrollPro_Complete_Project_Guide_and_Interview_Mastery.pdf"
    build_pdf(output_pdf)
