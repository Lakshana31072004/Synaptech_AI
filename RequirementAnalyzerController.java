package com.aseos.backend.controller;

import com.aseos.backend.dto.RequirementAnalysisRequest;
import com.aseos.backend.dto.RequirementAnalysisReport;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class RequirementAnalyzerController {

    @PostMapping("/analyze-requirements")
    public RequirementAnalysisReport analyzeRequirements(@RequestBody RequirementAnalysisRequest request) {
        String text = request.getText();
        if (text == null || text.trim().isEmpty()) {
            return new RequirementAnalysisReport(0, 0, new HashMap<>());
        }

        // Basic placeholder analysis logic
        int wordCount = text.split("\\s+").length;
        int sentenceCount = text.split("[.!?]").length;

        Map<String, Integer> keywordCount = new HashMap<>();
        List<String> keywords = Arrays.asList("user", "system", "must", "should", "api", "database");

        String lowerCaseText = text.toLowerCase();
        for (String keyword : keywords) {
            int count = (lowerCaseText.length() - lowerCaseText.replace(keyword, "").length()) / keyword.length();
            if (count > 0) {
                keywordCount.put(keyword, count);
            }
        }

        return new RequirementAnalysisReport(wordCount, sentenceCount, keywordCount);
    }
}