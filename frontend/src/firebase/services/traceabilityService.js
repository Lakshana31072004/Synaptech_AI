import { isFirebaseConfigured, auth, db } from '../firebaseConfig.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updatePassword 
} from 'firebase/auth';
import { clientStore, createClientJwt, DEFAULT_USERS, DEFAULT_PROJECTS, DEFAULT_HEALTH, DEFAULT_REQUIREMENTS } from '../clientStore.js';

import { projectRiskService } from './projectRiskService.js';

export const traceabilityService = {
  getTraceabilityGraph: async (projectId) => {
    const nodes = [
      { id: `REQ-${projectId}01`, name: 'Payment API SLA', type: 'Requirement', criticality: 'High' },
      { id: `REQ-${projectId}02`, name: 'Audit Logging & GDPR', type: 'Requirement', criticality: 'Medium' },
      { id: `STORY-${projectId}01`, name: 'Checkout Tokenization', type: 'UserStory', criticality: 'High' },
      { id: `STORY-${projectId}02`, name: 'Audit Stream Ingestion', type: 'UserStory', criticality: 'Medium' },
      { id: `ARCH-${projectId}01`, name: 'Payment Gateway Ingress', type: 'Architecture', criticality: 'High' },
      { id: `ARCH-${projectId}02`, name: 'Kafka Event Dispatcher', type: 'Architecture', criticality: 'High' },
      { id: `CODE-${projectId}01`, name: 'PaymentController.java', type: 'Code', criticality: 'High' },
      { id: `CODE-${projectId}02`, name: 'AuditConsumer.java', type: 'Code', criticality: 'Low' }
    ];

    const links = [
      { source: `REQ-${projectId}01`, target: `STORY-${projectId}01`, linkType: 'DERIVES', weight: 1.0 },
      { source: `REQ-${projectId}02`, target: `STORY-${projectId}02`, linkType: 'DERIVES', weight: 0.9 },
      { source: `STORY-${projectId}01`, target: `ARCH-${projectId}01`, linkType: 'IMPLEMENTS', weight: 0.85 },
      { source: `STORY-${projectId}02`, target: `ARCH-${projectId}02`, linkType: 'IMPLEMENTS', weight: 0.85 },
      { source: `ARCH-${projectId}01`, target: `CODE-${projectId}01`, linkType: 'CONTAINS', weight: 0.95 },
      { source: `ARCH-${projectId}02`, target: `CODE-${projectId}02`, linkType: 'CONTAINS', weight: 0.90 }
    ];

    const mermaidDiagram = `graph LR
  classDef req fill:#1e3a8a,stroke:#3b82f6,color:#fff;
  classDef story fill:#065f46,stroke:#10b981,color:#fff;
  classDef arch fill:#78350f,stroke:#f59e0b,color:#fff;
  classDef code fill:#4c1d95,stroke:#8b5cf6,color:#fff;

  REQ-${projectId}01["REQ-${projectId}01: Payment API SLA"]:::req
  REQ-${projectId}02["REQ-${projectId}02: Audit Logging"]:::req
  STORY-${projectId}01["STORY-${projectId}01: Tokenization"]:::story
  STORY-${projectId}02["STORY-${projectId}02: Audit Stream"]:::story
  ARCH-${projectId}01["ARCH-${projectId}01: Ingress Gateway"]:::arch
  ARCH-${projectId}02["ARCH-${projectId}02: Kafka Dispatcher"]:::arch
  CODE-${projectId}01["CODE-${projectId}01: PaymentController"]:::code
  CODE-${projectId}02["CODE-${projectId}02: AuditConsumer"]:::code

  REQ-${projectId}01 -->|1.00| STORY-${projectId}01
  REQ-${projectId}02 -->|0.90| STORY-${projectId}02
  STORY-${projectId}01 -->|0.85| ARCH-${projectId}01
  STORY-${projectId}02 -->|0.85| ARCH-${projectId}02
  ARCH-${projectId}01 -->|0.95| CODE-${projectId}01
  ARCH-${projectId}02 -->|0.90| CODE-${projectId}02`;

    return {
      nodes,
      links,
      mermaidDiagram,
      total_nodes: nodes.length,
      total_edges: links.length
    };
  },

  calculateTraceabilityImpact: async (projectId, rootNodeId) => {
    const graph = await traceabilityService.getTraceabilityGraph(projectId);
    const gamma = 0.75;
    
    // Breadth-first search with distance attenuation
    const impactedArtifacts = [];
    const visited = new Set([rootNodeId]);
    const queue = [{ id: rootNodeId, path: [rootNodeId], cumulativeWeight: 1.0, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      const outgoing = graph.links.filter(l => l.source === current.id);

      for (const link of outgoing) {
        const nextId = link.target;
        const targetNode = graph.nodes.find(n => n.id === nextId);
        const nextDepth = current.depth + 1;
        const nextCumulative = current.cumulativeWeight * (link.weight || 0.9);
        const attenuatedImpact = parseFloat((nextCumulative * Math.pow(gamma, nextDepth - 1)).toFixed(4));
        const newPath = [...current.path, nextId];

        impactedArtifacts.push({
          artifact_id: nextId,
          artifact_name: targetNode?.name || nextId,
          artifact_type: targetNode?.type || 'Artifact',
          criticality: targetNode?.criticality || 'Medium',
          path_length: nextDepth,
          traversal_path: newPath.join(' → '),
          attenuated_impact: attenuatedImpact,
          target_id: nextId,
          target_type: targetNode?.type || 'Artifact',
          path: newPath
        });

        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, path: newPath, cumulativeWeight: nextCumulative, depth: nextDepth });
        }
      }
    }

    const totalImpacted = impactedArtifacts.length;
    const meanImpact = totalImpacted > 0 
      ? parseFloat((impactedArtifacts.reduce((acc, a) => acc + a.attenuated_impact, 0) / totalImpacted).toFixed(2))
      : 0.00;

    let blastRadius = 'Low';
    if (totalImpacted >= 3 || meanImpact >= 0.6) {
      blastRadius = 'High';
    } else if (totalImpacted >= 2 || meanImpact >= 0.4) {
      blastRadius = 'Medium';
    }

    return {
      root_node_id: rootNodeId,
      blast_radius: blastRadius,
      total_impacted_count: totalImpacted,
      mean_impact_score: meanImpact,
      gamma_attenuation: gamma,
      attenuation_factor: gamma,
      impacted_artifacts: impactedArtifacts,
      impact_paths: impactedArtifacts,
      blast_radius_pct: Math.min(100, Math.round((totalImpacted / Math.max(1, graph.nodes.length)) * 100)),
      high_risk_blast_radius: impactedArtifacts.filter(a => a.attenuated_impact >= 0.5).map(a => a.artifact_id)
    };
  },

  // ==========================================
  // 5. WHAT-IF SIMULATION SANDBOX (USEIM RQ4)
  // ==========================================
  runWhatIfSimulation: async (projectId, payload) => {
    const currentHealth = await projectRiskService.getProjectHealth(projectId);
    const mutation = payload.mutation || {};

    const baselineRisk = currentHealth.riskScore || 35;
    let mutatedVelocity = (currentHealth.sprintVelocity || 38) + (mutation.sprint_velocity_variance || 0);
    let mutatedDebt = mutation.technical_debt_ratio !== undefined ? mutation.technical_debt_ratio : 0.2;
    let mutatedDefects = mutation.defect_arrival_rate !== undefined ? mutation.defect_arrival_rate : 1.0;
    let mutatedQuality = mutation.code_quality_index !== undefined ? mutation.code_quality_index : (currentHealth.codeQualityIndex || 85);
    let mutatedChurn = mutation.requirement_churn !== undefined ? mutation.requirement_churn : 0.05;

    let delta = 0;
    delta += (mutatedDebt - 0.2) * 35;
    delta += (mutatedDefects - 1.0) * 15;
    delta -= ((mutatedVelocity - 35) / 35) * 20;
    delta -= ((mutatedQuality - 80) / 100) * 25;
    delta += mutatedChurn * 30;

    const deltaRisk = parseFloat(delta.toFixed(1));
    const simulatedRisk = Math.max(5, Math.min(95, Math.round(baselineRisk + deltaRisk)));
    const riskLevel = simulatedRisk >= 70 ? 'Critical' : simulatedRisk >= 45 ? 'Elevated' : 'Stable';

    const simRecord = {
      id: Date.now(),
      projectId: String(projectId),
      scenario_name: payload.scenario_name || 'Counterfactual State Mutation',
      scenarioName: payload.scenario_name || 'Counterfactual State Mutation',
      mutation,
      baseline_risk: baselineRisk,
      baselineRisk: baselineRisk,
      simulated_risk: simulatedRisk,
      simulatedRisk: simulatedRisk,
      delta_risk: deltaRisk,
      deltaRisk: deltaRisk,
      risk_level: riskLevel,
      status: deltaRisk > 0 ? 'Elevated Risk' : 'Mitigated Risk',
      impact_summary: deltaRisk > 0 
        ? `Scenario increases delivery failure probability by ${Math.abs(deltaRisk)} points. Recommend counteracting with debt reduction.`
        : `Scenario mitigates risk by ${Math.abs(deltaRisk)} points. Sustainable velocity and improved quality observed.`,
      created_at: new Date().toISOString(),
      executedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'simulations'), simRecord);
        console.log('[Firebase] Simulation persisted to Cloud Firestore:', simRecord.scenario_name);
      } catch (err) {
        console.warn('[Firebase] Firestore simulation save warning:', err);
      }
    }

    clientStore.addSimulation(projectId, simRecord);
    return simRecord;
  },

  getProjectSimulations: async (projectId) => {
    let list = [];
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'simulations'));
        if (!snap.empty) {
          list = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(s => String(s.projectId) === String(projectId) || !s.projectId);
          list.sort((a, b) => new Date(b.created_at || b.executedAt || 0) - new Date(a.created_at || a.executedAt || 0));
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getProjectSimulations warning:', err);
      }
    }
    if (list.length === 0) {
      list = clientStore.getSimulations(projectId);
    }
    return list.map(s => ({
      ...s,
      scenarioName: s.scenarioName || s.scenario_name || 'Counterfactual State Mutation',
      executedAt: s.executedAt || s.created_at || new Date().toISOString(),
      baselineRisk: s.baselineRisk ?? s.baseline_risk ?? 35,
      simulatedRisk: s.simulatedRisk ?? s.simulated_risk ?? 38,
      deltaRisk: s.deltaRisk ?? s.delta_risk ?? 0
    }));
  },

};
