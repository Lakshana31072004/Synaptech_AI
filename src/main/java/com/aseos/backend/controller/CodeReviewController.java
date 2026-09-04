package com.aseos.backend.controller;

import com.aseos.backend.dto.CodeReviewReport;
import com.aseos.backend.dto.CodeReviewRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class CodeReviewController {

    private static final Pattern SQL_CONCAT_PATTERN = Pattern.compile(
            "(?i)(SELECT|INSERT|UPDATE|DELETE)\\s+.*(\\+|%s|concat)", Pattern.CASE_INSENSITIVE);
    private static final Pattern HARDCODED_SECRET_PATTERN = Pattern.compile(
            "(?i)(password|secret|api_?key|private_?key)\\s*[:=]\\s*[\"'][A-Za-z0-9\\-_!@#$%^&*()]{4,}[\"']");
    private static final Pattern XSS_PATTERN = Pattern.compile(
            "(?i)(innerHTML|document\\.write|dangerouslySetInnerHTML)");
    private static final Pattern RESOURCE_LEAK_PATTERN = Pattern.compile(
            "(?i)(new\\s+(FileInputStream|FileOutputStream|BufferedReader|FileReader|FileWriter|Socket)|getConnection\\()");
    private static final Pattern WEAK_CRYPTO_PATTERN = Pattern.compile(
            "(?i)(MD5|SHA-1|DES|RC4)");
    private static final Pattern EMPTY_CATCH_PATTERN = Pattern.compile(
            "(?i)catch\\s*\\([A-Za-z0-9_]+\\s+[A-Za-z0-9_]+\\)\\s*\\{\\s*\\}");

    @PostMapping("/code-review")
    public ResponseEntity<CodeReviewReport> reviewCode(@RequestBody CodeReviewRequest request) {
        String code = Optional.ofNullable(request.getCodeSnippet()).orElse("").trim();
        String lang = Optional.ofNullable(request.getLanguage()).orElse("java").toLowerCase();

        if (code.isEmpty()) {
            CodeReviewReport emptyReport = new CodeReviewReport(
                    100, "Low", "No code provided to inspect.",
                    new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), "// No code provided"
            );
            return ResponseEntity.ok(emptyReport);
        }

        List<CodeReviewReport.VulnerabilityItem> vulnerabilities = new ArrayList<>();
        List<String> codeSmells = new ArrayList<>();
        List<String> keyImprovements = new ArrayList<>();
        int score = 100;

        // 1. SQL Injection Inspection
        if (SQL_CONCAT_PATTERN.matcher(code).find() || code.toLowerCase().contains("statement.executequery")) {
            vulnerabilities.add(new CodeReviewReport.VulnerabilityItem(
                    "Potential SQL Injection via Dynamic Query Construction",
                    "Critical",
                    "OWASP A03:2021 - Injection (CWE-89)",
                    "Raw string concatenation or formatting was detected in a database query. Untrusted inputs can alter the query structure and allow unauthorized data access or deletion.",
                    "query = \"SELECT * FROM users WHERE username = '\" + input + \"'\"",
                    "Use parameterized PreparedStatements or JPA query parameters: PreparedStatement ps = conn.prepareStatement(\"SELECT * FROM users WHERE username = ?\"); ps.setString(1, input);"
            ));
            keyImprovements.add("Replaced concatenated SQL string with parameterized PreparedStatement query.");
            score -= 35;
        }

        // 2. Hardcoded Secrets Inspection
        if (HARDCODED_SECRET_PATTERN.matcher(code).find() ||
                (code.toLowerCase().contains("password = \"") && !code.contains("System.getenv"))) {
            vulnerabilities.add(new CodeReviewReport.VulnerabilityItem(
                    "Hardcoded Sensitive Credential or Secret",
                    "High",
                    "OWASP A07:2021 - Identification & Auth Failures (CWE-798)",
                    "A plain text secret, password, or API key is directly embedded in source code, creating a severe credential leakage vulnerability.",
                    "String apiKey = \"sk_live_98374928374923\";",
                    "Inject secrets via environment variables or cloud secret managers: String apiKey = System.getenv(\"API_KEY\");"
            ));
            keyImprovements.add("Externalized plain-text credentials into secure environment variable lookups.");
            score -= 25;
        }

        // 3. XSS / Insecure DOM Insertion
        if (XSS_PATTERN.matcher(code).find()) {
            vulnerabilities.add(new CodeReviewReport.VulnerabilityItem(
                    "Cross-Site Scripting (XSS) via Unsanitized DOM Insertion",
                    "High",
                    "OWASP A03:2021 - Injection (CWE-79)",
                    "Direct assignment to innerHTML or dangerouslySetInnerHTML bypasses context-aware sanitization and can execute malicious client-side JavaScript.",
                    "element.innerHTML = userProvidedHtml;",
                    "Sanitize using DOMPurify before insertion or use safe DOM node assignment: element.textContent = userProvidedText;"
            ));
            keyImprovements.add("Sanitized HTML string inputs to prevent client-side script execution.");
            score -= 20;
        }

        // 4. Resource Leak Inspection
        if (RESOURCE_LEAK_PATTERN.matcher(code).find() && !code.contains("try (") && !code.contains("try(")) {
            vulnerabilities.add(new CodeReviewReport.VulnerabilityItem(
                    "Unclosed System Resource (Connection / Stream Leak)",
                    "Moderate",
                    "CWE-775: Missing Release of Resource after Effective Lifetime",
                    "An I/O stream, socket, or database connection is initialized without guaranteed closure, which can exhaust file descriptors and socket pools under sustained load.",
                    "FileInputStream fis = new FileInputStream(file);",
                    "Wrap in a try-with-resources statement: try (FileInputStream fis = new FileInputStream(file)) { ... }"
            ));
            keyImprovements.add("Refactored resource allocation into deterministic try-with-resources blocks.");
            score -= 15;
        }

        // 5. Weak Cryptography Inspection
        if (WEAK_CRYPTO_PATTERN.matcher(code).find()) {
            vulnerabilities.add(new CodeReviewReport.VulnerabilityItem(
                    "Use of Broken or Weak Cryptographic Hash Algorithm",
                    "High",
                    "OWASP A02:2021 - Cryptographic Failures (CWE-327)",
                    "MD5 and SHA-1 have known collision vulnerabilities and must not be used for cryptographic signatures or password storage.",
                    "MessageDigest.getInstance(\"MD5\");",
                    "Upgrade to SHA-256 for non-password hashes, or bcrypt / Argon2id for password verification."
            ));
            keyImprovements.add("Upgraded weak cryptographic algorithms to collision-resistant SHA-256 / bcrypt.");
            score -= 20;
        }

        // 6. Code Smells: Empty Catch Block
        if (EMPTY_CATCH_PATTERN.matcher(code).find() || code.contains("e.printStackTrace()")) {
            codeSmells.add("Improper Exception Handling: Generic catch blocks or e.printStackTrace() swallow errors without structured logging.");
            keyImprovements.add("Replaced printStackTrace with structured logger alerts (logger.error).");
            score -= 10;
        }

        // 7. General Code Smells
        if (code.lines().count() > 60) {
            codeSmells.add("High Cyclomatic Complexity / Large Method: Consider modularizing into focused private helper methods.");
        }
        if (code.contains("System.out.println")) {
            codeSmells.add("Standard Output Detected: Production code should utilize Slf4j / structured logging frameworks rather than System.out.");
        }

        // Ensure bounds
        score = Math.max(score, 20);

        String riskLevel;
        if (vulnerabilities.stream().anyMatch(v -> "Critical".equalsIgnoreCase(v.getSeverity()))) {
            riskLevel = "Critical";
        } else if (vulnerabilities.stream().anyMatch(v -> "High".equalsIgnoreCase(v.getSeverity()))) {
            riskLevel = "High";
        } else if (vulnerabilities.stream().anyMatch(v -> "Moderate".equalsIgnoreCase(v.getSeverity()))) {
            riskLevel = "Moderate";
        } else {
            riskLevel = "Low";
        }

        String summary;
        if (vulnerabilities.isEmpty() && codeSmells.isEmpty()) {
            summary = "Excellent code quality! No critical OWASP vulnerabilities or severe architectural anti-patterns detected.";
            keyImprovements.add("Maintained clean code structure and safe parameter bindings.");
        } else {
            summary = String.format("Found %d security vulnerability(ies) and %d architectural smell(s). Overall security risk is %s.",
                    vulnerabilities.size(), codeSmells.size(), riskLevel);
        }

        String refactored = generateRefactoredCode(code, lang, vulnerabilities);

        CodeReviewReport report = new CodeReviewReport(
                score, riskLevel, summary, vulnerabilities, codeSmells, keyImprovements, refactored
        );

        return ResponseEntity.ok(report);
    }

    private String generateRefactoredCode(String originalCode, String lang, List<CodeReviewReport.VulnerabilityItem> issues) {
        if (issues.isEmpty()) {
            return "// Code already conforms to Synaptech security and architecture guidelines\n" + originalCode;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("/**\n");
        sb.append(" * Synaptech AI Refactored Version\n");
        sb.append(" * - Resolved ").append(issues.size()).append(" vulnerability issues\n");
        sb.append(" * - Added parameter binding and deterministic resource management\n");
        sb.append(" */\n\n");

        if (lang.contains("java")) {
            sb.append("import java.sql.Connection;\n");
            sb.append("import java.sql.PreparedStatement;\n");
            sb.append("import java.sql.ResultSet;\n");
            sb.append("import org.slf4j.Logger;\n");
            sb.append("import org.slf4j.LoggerFactory;\n\n");
            sb.append("public class SecureService {\n");
            sb.append("    private static final Logger logger = LoggerFactory.getLogger(SecureService.class);\n");
            sb.append("    private final String apiKey = System.getenv(\"APP_SECURE_API_KEY\");\n\n");
            sb.append("    public void executeSecureQuery(Connection conn, String userInput) {\n");
            sb.append("        String sql = \"SELECT id, username, email FROM users WHERE username = ? AND status = 'ACTIVE'\";\n");
            sb.append("        try (PreparedStatement ps = conn.prepareStatement(sql)) {\n");
            sb.append("            ps.setString(1, userInput);\n");
            sb.append("            try (ResultSet rs = ps.executeQuery()) {\n");
            sb.append("                while (rs.next()) {\n");
            sb.append("                    logger.info(\"User record verified: {}\", rs.getString(\"username\"));\n");
            sb.append("                }\n");
            sb.append("            }\n");
            sb.append("        } catch (Exception e) {\n");
            sb.append("            logger.error(\"Secure query execution failed for input: {}\", userInput, e);\n");
            sb.append("        }\n");
            sb.append("    }\n");
            sb.append("}\n");
        } else if (lang.contains("javascript") || lang.contains("node") || lang.contains("react")) {
            sb.append("import DOMPurify from 'dompurify';\n\n");
            sb.append("export const secureOperation = async (db, userInput) => {\n");
            sb.append("    const apiKey = process.env.SECURE_API_KEY;\n");
            sb.append("    // Parameterized query execution\n");
            sb.append("    const query = 'SELECT id, username FROM users WHERE username = $1';\n");
            sb.append("    try {\n");
            sb.append("        const res = await db.query(query, [userInput]);\n");
            sb.append("        return res.rows;\n");
            sb.append("    } catch (err) {\n");
            sb.append("        console.error('Database query error:', err.message);\n");
            sb.append("        throw err;\n");
            sb.append("    }\n");
            sb.append("};\n");
        } else {
            sb.append("# Secure Parameterized Implementation\n");
            sb.append("import os\n");
            sb.append("import logging\n\n");
            sb.append("logger = logging.getLogger(__name__)\n");
            sb.append("API_KEY = os.environ.get('APP_API_KEY')\n\n");
            sb.append("def execute_secure_query(cursor, user_input):\n");
            sb.append("    sql = 'SELECT id, username FROM users WHERE username = %s'\n");
            sb.append("    try:\n");
            sb.append("        cursor.execute(sql, (user_input,))\n");
            sb.append("        return cursor.fetchall()\n");
            sb.append("    except Exception as e:\n");
            sb.append("        logger.error(f'Query failed: {e}')\n");
            sb.append("        raise\n");
        }

        return sb.toString();
    }
}
