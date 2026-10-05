package com.snaptech.backend.service;

import com.snaptech.backend.model.*;
import com.snaptech.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TraceabilityGraphService {

    @Autowired
    private TraceabilityLinkRepository traceabilityLinkRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private UserStoryRepository userStoryRepository;

    @Autowired
    private ArchitectureComponentRepository architectureComponentRepository;

    @Autowired
    private CodeModuleRepository codeModuleRepository;

    @Autowired
    private AiServiceClient aiServiceClient;

    public List<TraceabilityLink> getTraceabilityLinks(Long projectId) {
        List<TraceabilityLink> links = traceabilityLinkRepository.findByProjectId(projectId);
        if (links.isEmpty()) {
            links = seedDefaultTraceabilityGraph(projectId);
        }
        return links;
    }

    public Map<String, Object> getGraphData(Long projectId) {
        List<TraceabilityLink> links = getTraceabilityLinks(projectId);
        List<Requirement> reqs = requirementRepository.findByProjectId(projectId);
        List<UserStory> stories = userStoryRepository.findByProjectId(projectId);
        List<ArchitectureComponent> archs = architectureComponentRepository.findByProjectId(projectId);
        List<CodeModule> codes = codeModuleRepository.findByProjectId(projectId);

        List<Map<String, Object>> nodes = new ArrayList<>();
        Set<String> nodeIds = new HashSet<>();

        for (Requirement r : reqs) {
            String nid = "REQ-" + r.getId();
            if (nodeIds.add(nid)) {
                Map<String, Object> node = new HashMap<>();
                node.put("id", nid);
                node.put("name", r.getTitle() != null ? r.getTitle() : r.getReqCode());
                node.put("type", "Requirement");
                node.put("criticality", r.getCategory().equalsIgnoreCase("SECURITY") ? "High" : "Medium");
                nodes.add(node);
            }
        }

        for (UserStory s : stories) {
            String nid = "STORY-" + s.getId();
            if (nodeIds.add(nid)) {
                Map<String, Object> node = new HashMap<>();
                node.put("id", nid);
                node.put("name", s.getTitle());
                node.put("type", "UserStory");
                node.put("criticality", "Medium");
                nodes.add(node);
            }
        }

        for (ArchitectureComponent a : archs) {
            String nid = "ARCH-" + a.getId();
            if (nodeIds.add(nid)) {
                Map<String, Object> node = new HashMap<>();
                node.put("id", nid);
                node.put("name", a.getComponentName());
                node.put("type", "Architecture");
                node.put("criticality", a.getFailureCriticality() > 0.7 ? "High" : "Medium");
                nodes.add(node);
            }
        }

        for (CodeModule c : codes) {
            String nid = "CODE-" + c.getId();
            if (nodeIds.add(nid)) {
                Map<String, Object> node = new HashMap<>();
                node.put("id", nid);
                node.put("name", c.getModulePath());
                node.put("type", "Code");
                node.put("criticality", c.getCyclomaticComplexity() > 10.0 ? "High" : "Low");
                nodes.add(node);
            }
        }

        List<Map<String, Object>> edges = new ArrayList<>();
        for (TraceabilityLink l : links) {
            Map<String, Object> edge = new HashMap<>();
            edge.put("source", l.getSourceArtifactType().toUpperCase().substring(0, 3) + "-" + l.getSourceArtifactId());
            edge.put("target", l.getTargetArtifactType().toUpperCase().substring(0, 3) + "-" + l.getTargetArtifactId());
            edge.put("relation", l.getLinkType());
            edge.put("weight", l.getWeight());
            edges.add(edge);
        }

        // Build Mermaid.js diagram definition string
        StringBuilder mermaid = new StringBuilder("graph LR\n");
        for (Map<String, Object> n : nodes) {
            String id = (String) n.get("id");
            String safeId = id.replace("-", "_");
            String name = ((String) n.get("name")).replace("\"", "");
            mermaid.append(String.format("    %s[\"%s<br/><small>%s</small>\"]\n", safeId, name, n.get("type")));
        }
        for (Map<String, Object> e : edges) {
            String s = ((String) e.get("source")).replace("-", "_");
            String t = ((String) e.get("target")).replace("-", "_");
            mermaid.append(String.format("    %s -->|%s| %s\n", s, e.get("relation"), t));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("projectId", projectId);
        result.put("nodes", nodes);
        result.put("edges", edges);
        result.put("mermaidDiagram", mermaid.toString());
        return result;
    }

    public Map<String, Object> calculateChangeImpact(Long projectId, String rootNodeId) {
        Map<String, Object> graph = getGraphData(projectId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> nodes = (List<Map<String, Object>>) graph.get("nodes");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> edges = (List<Map<String, Object>>) graph.get("edges");

        Map<String, Object> aiResult = aiServiceClient.evaluateTraceabilityImpact(rootNodeId, nodes, edges);
        if (aiResult != null && aiResult.containsKey("blast_radius")) {
            return aiResult;
        }

        return computeLocalTraceabilityImpact(rootNodeId, nodes, edges, 0.75, 5);
    }

    private Map<String, Object> computeLocalTraceabilityImpact(String rootNodeId, List<Map<String, Object>> nodes, List<Map<String, Object>> edges, double gamma, int maxDepth) {
        Map<String, Map<String, Object>> nodeMeta = new HashMap<>();
        for (Map<String, Object> n : nodes) {
            if (n.get("id") != null) {
                nodeMeta.put(n.get("id").toString(), n);
            }
        }

        Map<String, List<Map.Entry<String, Double>>> adj = new HashMap<>();
        for (Map<String, Object> e : edges) {
            String src = e.get("source") != null ? e.get("source").toString() : null;
            String tgt = e.get("target") != null ? e.get("target").toString() : null;
            double w = e.get("weight") instanceof Number ? ((Number) e.get("weight")).doubleValue() : 1.0;
            if (src != null && tgt != null) {
                adj.computeIfAbsent(src, k -> new ArrayList<>()).add(new AbstractMap.SimpleEntry<>(tgt, w));
            }
        }

        Map<String, Map<String, Object>> visited = new HashMap<>();
        Queue<Object[]> queue = new LinkedList<>();
        List<String> initialPath = new ArrayList<>();
        initialPath.add(rootNodeId);
        queue.add(new Object[]{rootNodeId, 1.0, 0, initialPath});

        while (!queue.isEmpty()) {
            Object[] item = queue.poll();
            String curr = (String) item[0];
            double pathProd = (Double) item[1];
            int depth = (Integer) item[2];
            @SuppressWarnings("unchecked")
            List<String> path = (List<String>) item[3];

            double attenuatedScore = pathProd * Math.pow(gamma, Math.max(0, depth - 1));
            if (visited.containsKey(curr)) {
                double prevScore = (Double) visited.get(curr).get("attenuated_impact");
                if (prevScore >= attenuatedScore) {
                    continue;
                }
            }

            Map<String, Object> meta = nodeMeta.getOrDefault(curr, Collections.emptyMap());
            Map<String, Object> record = new HashMap<>();
            record.put("artifact_id", curr);
            record.put("artifact_name", meta.getOrDefault("name", curr));
            record.put("artifact_type", meta.getOrDefault("type", "UNKNOWN"));
            record.put("criticality", meta.getOrDefault("criticality", "Medium"));
            record.put("path_length", depth);
            record.put("raw_path_product", Math.round(pathProd * 10000.0) / 10000.0);
            record.put("attenuated_impact", Math.round(attenuatedScore * 10000.0) / 10000.0);
            record.put("traversal_path", String.join(" -> ", path));
            visited.put(curr, record);

            if (depth < maxDepth && adj.containsKey(curr)) {
                for (Map.Entry<String, Double> neighbor : adj.get(curr)) {
                    if (!path.contains(neighbor.getKey())) {
                        List<String> nextPath = new ArrayList<>(path);
                        nextPath.add(neighbor.getKey());
                        queue.add(new Object[]{neighbor.getKey(), pathProd * neighbor.getValue(), depth + 1, nextPath});
                    }
                }
            }
        }

        List<Map<String, Object>> impacted = new ArrayList<>();
        double sumScore = 0.0;
        for (Map.Entry<String, Map<String, Object>> entry : visited.entrySet()) {
            if (!entry.getKey().equals(rootNodeId)) {
                impacted.add(entry.getValue());
                sumScore += (Double) entry.getValue().get("attenuated_impact");
            }
        }
        impacted.sort((a, b) -> Double.compare((Double) b.get("attenuated_impact"), (Double) a.get("attenuated_impact")));

        double meanImpact = impacted.isEmpty() ? 0.0 : sumScore / impacted.size();
        String blastRadius = (impacted.size() >= 5 || meanImpact >= 0.50) ? "High" : (!impacted.isEmpty() ? "Moderate" : "Low");

        Map<String, Object> response = new HashMap<>();
        response.put("root_artifact_id", rootNodeId);
        response.put("gamma_attenuation", gamma);
        response.put("total_impacted_count", impacted.size());
        response.put("blast_radius", blastRadius);
        response.put("mean_impact_score", Math.round(meanImpact * 10000.0) / 10000.0);
        response.put("impacted_artifacts", impacted);
        return response;
    }

    private List<TraceabilityLink> seedDefaultTraceabilityGraph(Long projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) return Collections.emptyList();
        Project project = projectOpt.get();

        // Create initial canonical demo artifacts if empty
        Requirement r1 = requirementRepository.save(new Requirement(project, "REQ-001", "User Authentication", "The system shall authenticate users using JWT with BCrypt password hashing within 200ms.", "SECURITY"));
        Requirement r2 = requirementRepository.save(new Requirement(project, "REQ-002", "Risk Dashboard", "The system shall display sprint milestone risk with TreeSHAP waterfall explanations.", "FUNCTIONAL"));

        UserStory us1 = userStoryRepository.save(new UserStory(project, r1, "US-001", "JWT Login & Refresh", 5, "HIGH"));
        UserStory us2 = userStoryRepository.save(new UserStory(project, r2, "US-002", "TreeSHAP Visualizer", 8, "HIGH"));

        ArchitectureComponent arch1 = architectureComponentRepository.save(new ArchitectureComponent(project, "SecurityGateway", "MODULE", "Spring Security 6 JWT", 0.85));
        ArchitectureComponent arch2 = architectureComponentRepository.save(new ArchitectureComponent(project, "XAI_Explainer", "SERVICE", "Python TreeSHAP", 0.90));

        CodeModule code1 = codeModuleRepository.save(new CodeModule(project, arch1, "JwtTokenProvider.java", 180, 8.0, 1.5));
        CodeModule code2 = codeModuleRepository.save(new CodeModule(project, arch2, "TreeExplainerService.py", 250, 14.0, 4.0));

        List<TraceabilityLink> seeded = new ArrayList<>();
        seeded.add(traceabilityLinkRepository.save(new TraceabilityLink(project, r1.getId(), "REQ", "REQ-001", us1.getId(), "STORY", "US-001", "REFINES", 1.0)));
        seeded.add(traceabilityLinkRepository.save(new TraceabilityLink(project, us1.getId(), "STORY", "US-001", arch1.getId(), "ARCH", "ARCH-001", "ARCHITECTED_AS", 0.9)));
        seeded.add(traceabilityLinkRepository.save(new TraceabilityLink(project, arch1.getId(), "ARCH", "ARCH-001", code1.getId(), "CODE", "CODE-001", "IMPLEMENTS", 0.95)));

        seeded.add(traceabilityLinkRepository.save(new TraceabilityLink(project, r2.getId(), "REQ", "REQ-002", us2.getId(), "STORY", "US-002", "REFINES", 1.0)));
        seeded.add(traceabilityLinkRepository.save(new TraceabilityLink(project, us2.getId(), "STORY", "US-002", arch2.getId(), "ARCH", "ARCH-002", "ARCHITECTED_AS", 0.85)));
        seeded.add(traceabilityLinkRepository.save(new TraceabilityLink(project, arch2.getId(), "ARCH", "ARCH-002", code2.getId(), "CODE", "CODE-002", "IMPLEMENTS", 0.90)));

        return seeded;
    }
}
