import React, { useState, useEffect, useCallback, useRef } from 'react';
import mermaid from 'mermaid';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';
import './TraceabilityWhatIfDashboard.css';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        darkMode: true,
        background: '#0f172a',
        primaryColor: '#3b82f6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#60a5fa',
        lineColor: '#94a3b8',
        secondaryColor: '#8b5cf6',
        tertiaryColor: '#1e293b'
    }
});

const TraceabilityWhatIfDashboard = ({ projectId = 1 }) => {
    const [graphData, setGraphData] = useState(null);
    const [impactData, setImpactData] = useState(null);
    const [selectedRootId, setSelectedRootId] = useState('REQ-1');
    const [loadingGraph, setLoadingGraph] = useState(false);
    const [evaluatingImpact, setEvaluatingImpact] = useState(false);

    // What-If Simulation State
    const [scenarioName, setScenarioName] = useState('High Technical Debt Surge');
    const [simVelocityVar, setSimVelocityVar] = useState(0.18);
    const [simDefectRate, setSimDefectRate] = useState(1.2);
    const [simDebtRatio, setSimDebtRatio] = useState(0.20);
    const [simQualityIndex, setSimQualityIndex] = useState(75.0);
    const [simChurn, setSimChurn] = useState(0.10);
    const [simulating, setSimulating] = useState(false);
    const [simResult, setSimResult] = useState(null);
    const [simHistory, setSimHistory] = useState([]);

    // Cross-module pipeline state
    const activeProject = localStorage.getItem('synaptech_active_project') || String(projectId);
    const [registeredArch, setRegisteredArch] = useState(null);
    const [flaggedVulns, setFlaggedVulns] = useState(null);
    const [healthBaseline, setHealthBaseline] = useState(null);

    const mermaidRef = useRef(null);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const archStr = localStorage.getItem(`synaptech_registered_arch_${activeProject}`);
        if (archStr) {
            try { setRegisteredArch(JSON.parse(archStr)); } catch (e) {}
        }
        const vulnStr = localStorage.getItem(`synaptech_code_vulnerabilities_${activeProject}`);
        if (vulnStr) {
            try {
                const parsed = JSON.parse(vulnStr);
                setFlaggedVulns(parsed);
                if (parsed.riskLevel === 'High') {
                    setSimDebtRatio(0.42);
                    setSimDefectRate(2.8);
                }
            } catch (e) {}
        }
        const baselineStr = localStorage.getItem(`synaptech_pending_whatif_baseline_${activeProject}`);
        if (baselineStr) {
            try {
                const parsed = JSON.parse(baselineStr);
                setHealthBaseline(parsed);
                if (parsed.codeQualityIndex) setSimQualityIndex(Number(parsed.codeQualityIndex));
                if (parsed.baseRiskScore >= 60) {
                    setSimDebtRatio(0.35);
                    setSimVelocityVar(0.28);
                }
            } catch (e) {}
        }
    }, [activeProject]);

    const loadGraph = useCallback(async () => {
        setLoadingGraph(true);
        try {
            const data = await apiService.getTraceabilityGraph(projectId);
            setGraphData(data);
            if (data?.nodes?.length > 0 && !selectedRootId) {
                setSelectedRootId(data.nodes[0].id);
            }
        } catch (err) {
            console.error('Failed to load traceability graph:', err);
        } finally {
            setLoadingGraph(false);
        }
    }, [projectId, selectedRootId]);

    const loadHistory = useCallback(async () => {
        try {
            const history = await apiService.getProjectSimulations(projectId);
            if (Array.isArray(history)) {
                setSimHistory(history);
            }
        } catch (err) {
            console.error('Failed to load simulation history:', err);
        }
    }, [projectId]);

    useEffect(() => {
        loadGraph();
        loadHistory();
    }, [loadGraph, loadHistory]);

    // Render Mermaid Diagram
    useEffect(() => {
        if (graphData?.mermaidDiagram && mermaidRef.current) {
            try {
                mermaidRef.current.innerHTML = '';
                const uniqueId = `mermaid-graph-${Date.now()}`;
                mermaid.render(uniqueId, graphData.mermaidDiagram).then(({ svg }) => {
                    if (mermaidRef.current) {
                        mermaidRef.current.innerHTML = svg;
                    }
                }).catch(err => {
                    console.error('Mermaid render error:', err);
                });
            } catch (e) {
                console.error('Mermaid initialization failure:', e);
            }
        }
    }, [graphData]);

    const handleRunImpact = async () => {
        if (!selectedRootId) return;
        setEvaluatingImpact(true);
        try {
            const res = await apiService.calculateTraceabilityImpact(projectId, selectedRootId);
            setImpactData(res);
            showSuccess(`Evaluated impact for ${selectedRootId}: ${res.total_impacted_count} artifacts in blast radius.`);
        } catch (err) {
            showError('Failed to evaluate traceability impact');
        } finally {
            setEvaluatingImpact(false);
        }
    };

    const handleRunSimulation = async (e) => {
        e.preventDefault();
        setSimulating(true);
        try {
            const mutation = {
                sprint_velocity_variance: simVelocityVar,
                defect_arrival_rate: simDefectRate,
                technical_debt_ratio: simDebtRatio,
                code_quality_index: simQualityIndex,
                requirement_churn: simChurn
            };
            const res = await apiService.runWhatIfSimulation(projectId, {
                scenario_name: scenarioName,
                mutation
            });
            setSimResult(res);
            showSuccess(`Simulation executed: Delta Risk ${res.delta_risk > 0 ? '+' : ''}${res.delta_risk} points`);
            loadHistory();
        } catch (err) {
            showError('Failed to execute What-If scenario');
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="traceability-whatif-container">
            {/* Header */}
            <div className="research-section-header">
                <div className="section-badge">PILLARS 3 &amp; 4: XAI, TRACEABILITY &amp; WHAT-IF SIMULATION</div>
                <h2>Artifact Dependency Topology &amp; Counterfactual Sandbox</h2>
                <p className="section-desc">
                    Evaluates distance-attenuated change impact reachability ($\gamma = 0.75$) across the SDLC artifact graph
                    and models counterfactual project perturbations using isolated LightGBM + TreeSHAP inference.
                </p>
            </div>

            {/* Cross-Module Pipeline Active Integration Badges */}
            {(registeredArch || flaggedVulns || healthBaseline) && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
                    {registeredArch && (
                        <div style={{
                            flex: 1,
                            minWidth: '280px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(96, 165, 250, 0.35)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '0.85rem',
                            color: '#93c5fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span>🏛️ <strong>Pipeline Synced:</strong> Registered {registeredArch.components?.length || 0} architecture components from Module 3 (<em>{registeredArch.archName}</em>).</span>
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem(`synaptech_registered_arch_${activeProject}`);
                                    setRegisteredArch(null);
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    {flaggedVulns && (
                        <div style={{
                            flex: 1,
                            minWidth: '280px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(248, 113, 113, 0.35)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '0.85rem',
                            color: '#fca5a5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span>🚨 <strong>Security Telemetry Synced:</strong> Flagged {flaggedVulns.issues?.length || 0} vulnerabilities from Module 4 Code Review. What-If risk sliders adjusted.</span>
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem(`synaptech_code_vulnerabilities_${activeProject}`);
                                    setFlaggedVulns(null);
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    {healthBaseline && (
                        <div style={{
                            flex: 1,
                            minWidth: '280px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(167, 139, 250, 0.4)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '0.85rem',
                            color: '#c4b5fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span>🔮 <strong>Telemetry Baseline Synced:</strong> Ingested risk score ({healthBaseline.baseRiskScore}%) &amp; velocity ({healthBaseline.sprintVelocity} pts) from Module 5 Health Dashboard. What-If engine calibrated.</span>
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem(`synaptech_pending_whatif_baseline_${activeProject}`);
                                    setHealthBaseline(null);
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Split Grid: Left = Traceability Graph, Right = Impact Footprint */}
            <div className="research-dual-grid">
                {/* 1. Traceability Graph Box */}
                <div className="research-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>🕸️ Cross-Artifact Dependency Graph</h3>
                            <span className="card-sub">PostgreSQL Adjacency List · Requirements → Stories → Architecture → Code Modules</span>
                        </div>
                        <button className="btn-secondary" onClick={loadGraph} disabled={loadingGraph}>
                            {loadingGraph ? 'Refreshing...' : '🔄 Refresh Topology'}
                        </button>
                    </div>

                    <div className="mermaid-canvas-wrapper">
                        {loadingGraph ? (
                            <div className="loading-state">Traversing dependency graph...</div>
                        ) : (
                            <div ref={mermaidRef} className="mermaid-container" />
                        )}
                    </div>

                    {/* Change Impact Analysis Selector */}
                    <div className="impact-control-bar">
                        <label>Select Artifact for Change Impact Audit:</label>
                        <div className="control-input-group">
                            <select
                                value={selectedRootId}
                                onChange={(e) => setSelectedRootId(e.target.value)}
                                className="styled-select"
                            >
                                {graphData?.nodes?.map((node) => (
                                    <option key={node.id} value={node.id}>
                                        [{node.type}] {node.name} ({node.id})
                                    </option>
                                ))}
                            </select>
                            <button
                                className="btn-primary"
                                onClick={handleRunImpact}
                                disabled={evaluatingImpact || !selectedRootId}
                            >
                                {evaluatingImpact ? 'Computing...' : '⚡ Audit Change Impact'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Impact Analysis Footprint */}
                <div className="research-card">
                    <div className="card-header-flex">
                        <div>
                            <h3>💥 Transitive Change Impact Blast Radius</h3>
                            <span className="card-sub">Distance Attenuation Score = max(∏ w · γ^(d-1))</span>
                        </div>
                        {impactData && (
                            <span className={`badge-blast ${(impactData.blast_radius || 'low').toLowerCase()}`}>
                                Blast Radius: {impactData.blast_radius || 'Low'}
                            </span>
                        )}
                    </div>

                    {impactData ? (
                        <div className="impact-details-container">
                            <div className="impact-kpi-row">
                                <div className="kpi-mini-card">
                                    <div className="kpi-label">Impacted Artifacts</div>
                                    <div className="kpi-val">{impactData.total_impacted_count ?? (impactData.impacted_artifacts?.length || 0)}</div>
                                </div>
                                <div className="kpi-mini-card">
                                    <div className="kpi-label">Mean Attenuated Impact</div>
                                    <div className="kpi-val">{impactData.mean_impact_score ?? '0.00'}</div>
                                </div>
                                <div className="kpi-mini-card">
                                    <div className="kpi-label">Attenuation Factor (γ)</div>
                                    <div className="kpi-val">{impactData.gamma_attenuation ?? '0.75'}</div>
                                </div>
                            </div>

                            <div className="impact-table-wrapper">
                                <table className="impact-table">
                                    <thead>
                                        <tr>
                                            <th>Target Artifact</th>
                                            <th>Type</th>
                                            <th>Criticality</th>
                                            <th>Depth</th>
                                            <th>Impact Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(impactData.impacted_artifacts || []).map((art, idx) => (
                                            <tr key={art.artifact_id || idx}>
                                                <td>
                                                    <strong>{art.artifact_name || art.artifact_id}</strong>
                                                    <div className="traversal-path">{art.traversal_path}</div>
                                                </td>
                                                <td><span className="tag-type">{art.artifact_type || 'Artifact'}</span></td>
                                                <td>
                                                    <span className={`tag-crit ${(art.criticality || 'medium').toLowerCase()}`}>
                                                        {art.criticality || 'Medium'}
                                                    </span>
                                                </td>
                                                <td>{(art.path_length || 1)} hop{(art.path_length || 1) > 1 ? 's' : ''}</td>
                                                <td>
                                                    <div className="impact-meter-cell">
                                                        <div className="meter-bg">
                                                            <div
                                                                className="meter-fill"
                                                                style={{ width: `${Math.min(100, Math.round((art.attenuated_impact || 0) * 100))}%` }}
                                                            />
                                                        </div>
                                                        <span>{art.attenuated_impact ?? '0.00'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="placeholder-box">
                            <div className="placeholder-icon">🎯</div>
                            <h4>No Impact Analysis Run Yet</h4>
                            <p>Select any node from the dependency graph and click <strong>"Audit Change Impact"</strong> to compute transitive blast radius.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* What-If Counterfactual Sandbox Simulator */}
            <div className="research-card whatif-sandbox-card">
                <div className="card-header-flex">
                    <div>
                        <h3>🧪 Counterfactual What-If Sandbox Simulator</h3>
                        <span className="card-sub">Rule 32 Compliant: Baseline state is cloned in isolated sandbox; original metrics remain unmodified.</span>
                    </div>
                </div>

                <div className="whatif-grid">
                    {/* Simulator Form Controls */}
                    <form onSubmit={handleRunSimulation} className="whatif-form">
                        <div className="form-group">
                            <label>Scenario Description / Name:</label>
                            <input
                                type="text"
                                className="styled-input"
                                value={scenarioName}
                                onChange={(e) => setScenarioName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Sprint Velocity Variance ($\sigma_v$):</span>
                                <strong>{simVelocityVar.toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                min="0.05"
                                max="0.50"
                                step="0.01"
                                value={simVelocityVar}
                                onChange={(e) => setSimVelocityVar(parseFloat(e.target.value))}
                                className="styled-slider"
                            />
                            <div className="slider-ticks"><span>0.05 (Stable)</span><span>0.50 (Chaotic)</span></div>
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Defect Arrival Rate ($\lambda_d$ / day):</span>
                                <strong>{simDefectRate.toFixed(1)}</strong>
                            </div>
                            <input
                                type="range"
                                min="0.2"
                                max="5.0"
                                step="0.1"
                                value={simDefectRate}
                                onChange={(e) => setSimDefectRate(parseFloat(e.target.value))}
                                className="styled-slider"
                            />
                            <div className="slider-ticks"><span>0.2 (Low)</span><span>5.0 (Critical)</span></div>
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Technical Debt Ratio ($TDR$):</span>
                                <strong>{simDebtRatio.toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                min="0.05"
                                max="0.60"
                                step="0.01"
                                value={simDebtRatio}
                                onChange={(e) => setSimDebtRatio(parseFloat(e.target.value))}
                                className="styled-slider"
                            />
                            <div className="slider-ticks"><span>0.05 (Clean)</span><span>0.60 (Severe)</span></div>
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Code Quality Index ($CQI$):</span>
                                <strong>{simQualityIndex.toFixed(0)}</strong>
                            </div>
                            <input
                                type="range"
                                min="40"
                                max="100"
                                step="1"
                                value={simQualityIndex}
                                onChange={(e) => setSimQualityIndex(parseFloat(e.target.value))}
                                className="styled-slider"
                            />
                            <div className="slider-ticks"><span>40 (Subpar)</span><span>100 (Flawless)</span></div>
                        </div>

                        <div className="slider-group">
                            <div className="slider-header">
                                <span>Requirement Churn Rate ($RCR$):</span>
                                <strong>{simChurn.toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                min="0.0"
                                max="0.40"
                                step="0.02"
                                value={simChurn}
                                onChange={(e) => setSimChurn(parseFloat(e.target.value))}
                                className="styled-slider"
                            />
                            <div className="slider-ticks"><span>0.0 (Locked)</span><span>0.40 (High Churn)</span></div>
                        </div>

                        <button type="submit" className="btn-primary full-width" disabled={simulating}>
                            {simulating ? 'Evaluating LightGBM & TreeSHAP...' : '🚀 Execute Counterfactual Simulation'}
                        </button>
                    </form>

                    {/* Simulation Outcome & TreeSHAP Delta Breakdown */}
                    <div className="whatif-results-pane">
                        {simResult ? (
                            <div className="sim-result-card">
                                <h4>📊 Simulation Outcome: {simResult.scenarioName || scenarioName}</h4>

                                <div className="sim-kpi-banner">
                                    <div className="sim-kpi">
                                        <span className="sim-kpi-sub">Baseline Risk</span>
                                        <span className="sim-kpi-num">{simResult.baseline_risk}</span>
                                    </div>
                                    <div className="sim-arrow">➔</div>
                                    <div className="sim-kpi">
                                        <span className="sim-kpi-sub">Simulated Risk</span>
                                        <span className="sim-kpi-num">{simResult.simulated_risk}</span>
                                    </div>
                                    <div className={`sim-delta-badge ${simResult.delta_risk > 0 ? 'worse' : simResult.delta_risk < 0 ? 'better' : 'neutral'}`}>
                                        Δ {simResult.delta_risk > 0 ? '+' : ''}{simResult.delta_risk} Risk Points
                                    </div>
                                </div>

                                <div className="advisory-box">
                                    <strong>Engineering Advisory:</strong> {simResult.advisory}
                                </div>

                                {/* TreeSHAP Attribution Shifts */}
                                <h5 style={{ marginTop: '16px', marginBottom: '8px', color: '#cbd5e1' }}>
                                    🔬 TreeSHAP Attribution Differential ($\Delta \phi_i$)
                                </h5>
                                <div className="shap-shifts-list">
                                    {simResult.top_delta_drivers?.map((driver) => (
                                        <div key={driver.feature} className="shap-shift-row">
                                            <div className="driver-name">
                                                <code>{driver.feature}</code>
                                            </div>
                                            <div className="driver-change">
                                                Base: {driver.baseline_shap} ➔ Sim: {driver.simulated_shap}
                                            </div>
                                            <div className={`driver-delta ${driver.shap_delta > 0 ? 'pos' : 'neg'}`}>
                                                {driver.shap_delta > 0 ? '+' : ''}{driver.shap_delta} units
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="scientific-disclaimer-tag">
                                    🛡️ <strong>Scientific Disclaimer:</strong> {simResult.scientific_disclaimer}
                                </div>
                            </div>
                        ) : (
                            <div className="placeholder-box">
                                <div className="placeholder-icon">⚙️</div>
                                <h4>Interactive Scenario Engine</h4>
                                <p>Adjust project parameters on the left to observe real-time delivery risk deviations and TreeSHAP attribution shifts.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Historical Persisted Simulations Table */}
            {simHistory.length > 0 && (
                <div className="research-card" style={{ marginTop: '24px' }}>
                    <h3>📜 Persisted What-If Scenarios (PostgreSQL Audit Trail)</h3>
                    <div className="impact-table-wrapper">
                        <table className="impact-table">
                            <thead>
                                <tr>
                                    <th>Scenario Name</th>
                                    <th>Executed At</th>
                                    <th>Baseline Risk</th>
                                    <th>Simulated Risk</th>
                                    <th>Delta Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {simHistory.map((s, idx) => {
                                    const name = s.scenarioName || s.scenario_name || 'Counterfactual Mutation';
                                    const rawDate = s.executedAt || s.created_at || s.timestamp;
                                    const dateFormatted = rawDate && !isNaN(new Date(rawDate).getTime())
                                        ? new Date(rawDate).toLocaleString()
                                        : new Date().toLocaleString();
                                    const baseline = s.baselineRisk ?? s.baseline_risk ?? 35;
                                    const simulated = s.simulatedRisk ?? s.simulated_risk ?? baseline;
                                    const delta = s.deltaRisk ?? s.delta_risk ?? (simulated - baseline);
                                    return (
                                        <tr key={s.id || idx}>
                                            <td><strong>{name}</strong></td>
                                            <td>{dateFormatted}</td>
                                            <td>{baseline}</td>
                                            <td>{simulated}</td>
                                            <td>
                                                <span className={`tag-delta ${delta > 0 ? 'worse' : 'better'}`}>
                                                    {delta > 0 ? '+' : ''}{delta}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraceabilityWhatIfDashboard;
