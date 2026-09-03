package com.aseos.backend.controller;

import com.aseos.backend.dto.RequirementAnalysisReport;
import com.aseos.backend.dto.RequirementAnalysisRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class RequirementAnalyzerController {

    private static final Map<String, String> AMBIGUITY_RULES = new LinkedHashMap<>();
    static {
        AMBIGUITY_RULES.put("fast", "Quantify with specific latency or response time SLA (e.g., 'API response time < 200ms at p95').");
        AMBIGUITY_RULES.put("user-friendly", "Replace with measurable usability criteria (e.g., 'task completion within 3 clicks').");
        AMBIGUITY_RULES.put("seamless", "Specify exact integration protocols and zero-downtime cutover procedures.");
        AMBIGUITY_RULES.put("efficient", "Define measurable resource constraints (e.g., 'CPU utilization < 60% under 10k RPS').");
        AMBIGUITY_RULES.put("robust", "Define explicit fault tolerance parameters (e.g., '99.9% uptime with automated health-check failover').");
        AMBIGUITY_RULES.put("easy", "Specify target user proficiency, onboarding duration, or SUS (System Usability Scale) score.");
        AMBIGUITY_RULES.put("as appropriate", "Explicitly enumerate conditional business logic or rule triggers.");
        AMBIGUITY_RULES.put("etc", "Exhaustively enumerate all valid enumeration options or state codes.");
    }

    @PostMapping("/analyze-requirements")
    public RequirementAnalysisReport analyzeRequirements(@RequestBody RequirementAnalysisRequest request) {
        String text = request.getText();
        if (text == null || text.trim().isEmpty()) {
            RequirementAnalysisReport emptyReport = new RequirementAnalysisReport(0, 0, new HashMap<>());
            emptyReport.setQualityScore(0);
            emptyReport.setQualityRating("Empty");
            emptyReport.setAnalysisSummary("No requirement text was provided.");
            return emptyReport;
        }

        int wordCount = text.split("\\s+").length;
        String[] rawSentences = text.split("(?<=[.!?\\n])\\s*");
        List<String> validSentences = new ArrayList<>();
        for (String s : rawSentences) {
            String trimmed = s.trim().replaceAll("^[\\-\\*\t0-9\\.]+", "").trim();
            if (!trimmed.isEmpty() && trimmed.length() > 5) {
                validSentences.add(trimmed);
            }
        }

        int sentenceCount = Math.max(1, validSentences.size());

        // Domain Keyword counts
        Map<String, Integer> keywordCount = new HashMap<>();
        List<String> keywords = Arrays.asList("user", "system", "auth", "security", "performance", "api", "database", "must", "should");
        String lowerCaseText = text.toLowerCase();
        for (String keyword : keywords) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(keyword) + "\\b");
            Matcher m = p.matcher(lowerCaseText);
            int count = 0;
            while (m.find()) count++;
            if (count > 0) {
                keywordCount.put(keyword, count);
            }
        }

        List<RequirementAnalysisReport.RequirementItem> functional = new ArrayList<>();
        List<RequirementAnalysisReport.RequirementItem> nonFunctional = new ArrayList<>();
        List<RequirementAnalysisReport.AmbiguityWarning> ambiguities = new ArrayList<>();
        List<String> userStories = new ArrayList<>();

        int frIndex = 1;
        int nfrIndex = 1;

        for (String sentence : validSentences) {
            String lower = sentence.toLowerCase();

            // Check ambiguity
            for (Map.Entry<String, String> entry : AMBIGUITY_RULES.entrySet()) {
                String term = entry.getKey();
                Pattern p = Pattern.compile("\\b" + Pattern.quote(term) + "\\b", Pattern.CASE_INSENSITIVE);
                if (p.matcher(sentence).find()) {
                    ambiguities.add(new RequirementAnalysisReport.AmbiguityWarning(
                            term,
                            sentence,
                            entry.getValue()
                    ));
                }
            }

            // Classification
            if (lower.contains("encrypt") || lower.contains("jwt") || lower.contains("ssl") ||
                    lower.contains("auth") || lower.contains("security") || lower.contains("token") || lower.contains("password")) {
                nonFunctional.add(new RequirementAnalysisReport.RequirementItem(
                        "NFR-" + (nfrIndex++), sentence, "Security", "High"
                ));
            } else if (lower.contains("latency") || lower.contains("throughput") || lower.contains("rps") ||
                    lower.contains("response time") || lower.contains("speed") || lower.contains("performance")) {
                nonFunctional.add(new RequirementAnalysisReport.RequirementItem(
                        "NFR-" + (nfrIndex++), sentence, "Performance", "High"
                ));
            } else if (lower.contains("ui") || lower.contains("responsive") || lower.contains("accessible") ||
                    lower.contains("screen") || lower.contains("dashboard") || lower.contains("interface")) {
                nonFunctional.add(new RequirementAnalysisReport.RequirementItem(
                        "NFR-" + (nfrIndex++), sentence, "Usability", "Medium"
                ));
            } else if (lower.contains("backup") || lower.contains("uptime") || lower.contains("availability") ||
                    lower.contains("failover") || lower.contains("reliability")) {
                nonFunctional.add(new RequirementAnalysisReport.RequirementItem(
                        "NFR-" + (nfrIndex++), sentence, "Reliability", "High"
                ));
            } else {
                functional.add(new RequirementAnalysisReport.RequirementItem(
                        "FR-" + (frIndex++), sentence, "Functional", "High"
                ));
                // Extract into User Story format
                userStories.add("As an end-user, I want " + sentence.replaceAll("^[Tt]he system shall|^[Tt]he system must|^[Ss]ystem should", "to be able to") + " so that business operations run effectively.");
            }
        }

        // Quality scoring
        int score = 85;
        score -= (ambiguities.size() * 8);
        if (!nonFunctional.isEmpty()) score += 10;
        if (validSentences.size() < 3) score -= 20;
        score = Math.max(10, Math.min(100, score));

        String rating;
        if (score >= 85) rating = "Excellent";
        else if (score >= 70) rating = "Good";
        else if (score >= 50) rating = "Needs Improvement";
        else rating = "Poor";

        String summary = String.format("Analyzed %d sentences (%d words). Identified %d functional requirements, %d non-functional requirements, and detected %d ambiguous phrasing instances.",
                sentenceCount, wordCount, functional.size(), nonFunctional.size(), ambiguities.size());

        RequirementAnalysisReport report = new RequirementAnalysisReport(wordCount, sentenceCount, keywordCount);
        report.setQualityScore(score);
        report.setQualityRating(rating);
        report.setAnalysisSummary(summary);
        report.setFunctionalRequirements(functional);
        report.setNonFunctionalRequirements(nonFunctional);
        report.setAmbiguousTermsFound(ambiguities);
        report.setExtractedUserStories(userStories);

        return report;
    }
}