package com.aseos.backend.controller;

import com.aseos.backend.dto.CopilotChatRequest;
import com.aseos.backend.dto.CopilotChatResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class CopilotController {

    @PostMapping("/copilot/chat")
    public ResponseEntity<CopilotChatResponse> chatWithCopilot(@RequestBody CopilotChatRequest request) {
        String msg = Optional.ofNullable(request.getMessage()).orElse("").trim().toLowerCase();

        String reply;
        List<String> suggestions = new ArrayList<>();

        if (msg.contains("monolith") || msg.contains("microservices") || msg.contains("modular")) {
            reply = "### Architecture Guidance: Modular Monolith vs Microservices\n\n" +
                    "For most growing applications with under 15 developers, a **Modular Monolith** (Clean/Hexagonal Architecture) is recommended to avoid premature distributed systems overhead. \n\n" +
                    "**When to extract a Microservice:**\n" +
                    "1. **Independent Scaling:** A specific bounded context (e.g. video processing or payment ingestion) experiences 10x higher load than the rest of the application.\n" +
                    "2. **Team Autonomy:** Multiple distinct engineering squads require isolated deployment release cadences.\n" +
                    "3. **Heterogeneous Tech:** You require specialized languages (e.g., Python for ML vs Java/Go for core transactions).\n\n" +
                    "**Synaptech Tip:** You can test this using our **Architecture Advisor** tab with your exact team size and scalability targets!";

            suggestions.add("How do I manage distributed transactions (Saga pattern)?");
            suggestions.add("What are the best practices for Spring Cloud Gateway?");
            suggestions.add("How does event-driven architecture prevent cascading failures?");

        } else if (msg.contains("velocity") || msg.contains("sprint") || msg.contains("capacity") || msg.contains("backlog")) {
            reply = "### Agile Velocity & Sprint Optimization\n\n" +
                    "To stabilize sprint velocity and prevent carryover sprint bloat:\n\n" +
                    "1. **Enforce a Strict Definition of Ready (DoR):** User stories should have clear acceptance criteria, zero unclarified external dependencies, and story point estimates before sprint planning.\n" +
                    "2. **The 80/20 Capacity Rule:** Reserve 20% of engineering bandwidth for tech debt refactoring, unpredicted bug triage, and code reviews.\n" +
                    "3. **Story Slicing:** Break down any story larger than 8 story points into smaller, vertical end-to-end slices that can be reviewed and deployed independently.\n\n" +
                    "**Synaptech Tip:** Open the **⚡ Sprint Planner** module in your dashboard to calculate team capacity and automated risk forecasts!";

            suggestions.add("How to reduce story point estimation variance?");
            suggestions.add("How to deal with unplanned hotfixes during a sprint?");
            suggestions.add("Generate a sample Definition of Done (DoD).");

        } else if (msg.contains("tech debt") || msg.contains("debt") || msg.contains("quality")) {
            reply = "### Technical Debt Remediation Strategy\n\n" +
                    "Technical debt slows engineering velocity over time if left unmeasured. Here is the recommended 3-tier remediation framework:\n\n" +
                    "1. **Boy Scout Rule:** Leave every file cleaner than you found it during routine feature delivery.\n" +
                    "2. **Dedicated Tech Debt Slices:** Allocate at least 1-2 refactoring tickets per sprint focused on high-traffic, low-maintainability classes.\n" +
                    "3. **Automated Architectural Tests:** Use automated linting and tools like ArchUnit in your CI pipeline to prevent cyclic dependencies.\n\n" +
                    "**Synaptech Tip:** Run your code through our **🛡️ AI Code Review** tab to automatically discover OWASP vulnerabilities and code smells!";

            suggestions.add("How to calculate Technical Debt Index in Synaptech?");
            suggestions.add("Review our current system architecture.");
            suggestions.add("What are common signs of architectural rot?");

        } else if (msg.contains("owasp") || msg.contains("security") || msg.contains("vulnerability") || msg.contains("sql injection")) {
            reply = "### OWASP Top 10 Security Hardening\n\n" +
                    "Key safeguards to implement immediately across your services:\n\n" +
                    "1. **Prevent Injection (A03):** Always use parameterized queries (PreparedStatement / ORM bind variables). Never format raw SQL strings with user input.\n" +
                    "2. **Broken Access Control (A01):** Validate user ownership and role authorization on every backend endpoint (e.g. `@PreAuthorize` or Spring Security matchers), never rely on client-side role checks alone.\n" +
                    "3. **Cryptographic Failures (A02):** Deprecate MD5 and SHA-1; use bcrypt / Argon2id for password hashes and AES-256-GCM with KMS keys for stored tokens.\n" +
                    "4. **Secrets Management:** Keep credentials out of Git repositories by storing them in environment variables or cloud secret vaults.\n\n" +
                    "**Synaptech Tip:** Paste your code into our **AI Code Review Inspector** to run an automated vulnerability audit!";

            suggestions.add("How to prevent JWT replay attacks?");
            suggestions.add("What is the safest way to store API tokens in frontend?");
            suggestions.add("Explain CORS vs CSRF protections.");

        } else if (msg.contains("diagram") || msg.contains("canvas") || msg.contains("c4")) {
            reply = "### AI Architecture Visualizer & Live Canvas\n\n" +
                    "Synaptech's visualizer allows you to generate and inspect system topologies in multiple formats:\n\n" +
                    "- **System Topology View:** Full cloud infrastructure with API Gateway, microservices, Kafka brokers, Redis caches, and databases.\n" +
                    "- **C4 Container View:** Structural boundaries and communication protocols (HTTPS, gRPC, AMQP).\n" +
                    "- **Data Flow Sequence:** Step-by-step trace of how requests and event messages travel.\n" +
                    "- **Live Code Editor:** Modify Mermaid markdown with instant side-by-side SVG rendering!\n\n" +
                    "You can also use the **Prompt-to-Architecture** bar in the Architecture Advisor to synthesize custom architectures from text prompts.";

            suggestions.add("Generate a payment gateway architecture.");
            suggestions.add("How do I export diagrams to SVG or PNG?");
            suggestions.add("Explain C4 model zoom levels (Context, Container, Component).");

        } else {
            reply = "### Welcome to Synaptech Copilot 🧠\n\n" +
                    "I am your AI companion for software architecture, agile telemetry, and code security. You can ask me anything about:\n\n" +
                    "- 🏛️ **System Architecture:** Trade-offs between Microservices, Event-Driven, Serverless, and Monoliths.\n" +
                    "- ⚡ **Agile Intelligence:** Sprint velocity forecasting, capacity planning, and technical debt reduction.\n" +
                    "- 🛡️ **Code Security:** OWASP vulnerability remediation, parameterized queries, and safe refactoring.\n" +
                    "- 🎨 **Live Diagrams:** Generating system topology and C4 models for your engineering team.\n\n" +
                    "How can I assist your engineering workflow today?";

            suggestions.add("Evaluate Microservices vs Modular Monolith.");
            suggestions.add("How do I optimize sprint velocity?");
            suggestions.add("What are key OWASP vulnerabilities to check?");
        }

        CopilotChatResponse response = new CopilotChatResponse(reply, suggestions);
        return ResponseEntity.ok(response);
    }
}
