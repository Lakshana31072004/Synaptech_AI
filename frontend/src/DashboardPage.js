import React, { useState } from 'react';
import ProjectHealthDashboard from './ProjectHealthDashboard';
import AiSprintPlanner from './components/AiSprintPlanner';
import AiRequirementAnalyzer from './components/AiRequirementAnalyzer';
import AiArchitectureAdvisor from './components/AiArchitectureAdvisor';
import AiCodeReviewInspector from './components/AiCodeReviewInspector';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import { useAuth } from './AuthContext';

const DashboardPage = () => {
    const [activeTab, setActiveTab] = useState('telemetry');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState('adr');
    const { userProfile, user } = useAuth();

    const username = userProfile?.username || user?.sub || 'Engineer';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const tabs = [
        { id: 'telemetry', label: 'Telemetry & Health', icon: '📊', desc: 'Real-time project vitals & simulation' },
        { id: 'analyzer', label: 'Requirement Analyzer', icon: '🔍', desc: 'NLP ambiguity & risk detection' },
        { id: 'planner', label: 'Sprint Planner', icon: '⚡', desc: 'Velocity forecasting & capacity' },
        { id: 'advisor', label: 'Architecture Advisor', icon: '🏛️', desc: 'System design & live diagram canvas' },
        { id: 'review', label: 'Code Review & Security', icon: '🛡️', desc: 'OWASP vulnerability scan & refactoring' },
        { id: 'all', label: 'Unified View', icon: '📑', desc: 'Continuous stream of all modules' },
    ];

    const openAdrReport = () => {
        setReportType('adr');
        setReportModalOpen(true);
    };

    const openSprintReport = () => {
        setReportType('sprint');
        setReportModalOpen(true);
    };

    return (
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px', fontFamily: 'var(--font-body)' }}>
            {/* --- Hero Banner (HTFlow AI SaaS Style) --- */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e1b4b 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '32px 36px',
                marginBottom: '28px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {/* Background ambient glow effect */}
                <div style={{
                    position: 'absolute',
                    top: '-60px',
                    right: '-60px',
                    width: '280px',
                    height: '280px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(59, 130, 246, 0.1) 60%, transparent 80%)',
                    filter: 'blur(30px)',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.18)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
                            Autonomous Engineering Core Active
                        </div>

                        {/* Executive Report Export Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={openAdrReport}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                📄 Export ADR
                            </button>
                            <button
                                type="button"
                                onClick={openSprintReport}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                📊 Export Sprint PDF
                            </button>
                        </div>
                    </div>

                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
                        {getGreeting()}, <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{username}</span>
                    </h1>

                    <p style={{ margin: '0 0 22px 0', color: '#cbd5e1', fontSize: '1.02rem', maxWidth: '680px', lineHeight: 1.5 }}>
                        Welcome to your autonomous software engineering control room. Monitor telemetry, evaluate architectural trade-offs, inspect security vulnerabilities, and accelerate agile delivery with AI.
                    </p>

                    {/* Quick Telemetry Indicators */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                            <div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Engine</div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>Active &amp; Ready</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                            <div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Architecture Mode</div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>Live Visual Canvas</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                            <div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Inspector</div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>OWASP Automated</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Module Tabs Navigation (HTFlow AI Segmented Switcher) --- */}
            <div style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--bg-surface)',
                padding: '8px',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '28px',
                overflowX: 'auto'
            }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: '1',
                                minWidth: '170px',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'transparent',
                                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <span style={{ fontSize: '1.3rem' }}>{tab.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isActive ? '#ffffff' : 'var(--text-primary)' }}>
                                    {tab.label}
                                </div>
                                <div style={{ fontSize: '0.73rem', opacity: isActive ? 0.9 : 0.7, whiteSpace: 'nowrap' }}>
                                    {tab.desc}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* --- Active Module Content Area --- */}
            <div className="module-content-wrapper">
                {(activeTab === 'telemetry' || activeTab === 'all') && (
                    <div style={{
                        background: 'var(--bg-surface)',
                        borderRadius: '16px',
                        padding: '28px',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: activeTab === 'all' ? '30px' : '0'
                    }}>
                        <ProjectHealthDashboard />
                    </div>
                )}

                {(activeTab === 'analyzer' || activeTab === 'all') && (
                    <div style={{
                        background: 'var(--bg-surface)',
                        borderRadius: '16px',
                        padding: '28px',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: activeTab === 'all' ? '30px' : '0'
                    }}>
                        <AiRequirementAnalyzer />
                    </div>
                )}

                {(activeTab === 'planner' || activeTab === 'all') && (
                    <div style={{
                        background: 'var(--bg-surface)',
                        borderRadius: '16px',
                        padding: '28px',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: activeTab === 'all' ? '30px' : '0'
                    }}>
                        <AiSprintPlanner />
                    </div>
                )}

                {(activeTab === 'advisor' || activeTab === 'all') && (
                    <div style={{
                        background: 'var(--bg-surface)',
                        borderRadius: '16px',
                        padding: '28px',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: activeTab === 'all' ? '30px' : '0'
                    }}>
                        <AiArchitectureAdvisor />
                    </div>
                )}

                {(activeTab === 'review' || activeTab === 'all') && (
                    <div style={{
                        background: 'var(--bg-surface)',
                        borderRadius: '16px',
                        padding: '28px',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: '0'
                    }}>
                        <AiCodeReviewInspector />
                    </div>
                )}
            </div>

            {/* --- Executive ADR & Sprint Report Modal --- */}
            <ExecutiveReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                type={reportType}
                data={{
                    recommendedArchitecture: 'Event-Driven Microservices Architecture',
                    confidenceScore: 94,
                    summary: 'Engineered for asynchronous, high-throughput event processing and fault-tolerant service decoupling.',
                    keyBenefits: [
                        'Extremely low latency message brokering and asynchronous processing.',
                        'Independent horizontal scaling of bottleneck services under burst load.',
                        'Fault tolerance: failure in one consumer does not cascade to ingress traffic.'
                    ],
                    architecturalTradeOffs: [
                        'Increased operational complexity managing message brokers and distributed tracing.',
                        'Eventual consistency requires idempotent consumers and compensating transactions.'
                    ],
                    suggestedTechStack: {
                        'Event Broker': 'Apache Kafka / RabbitMQ',
                        'Backend Framework': 'Spring Boot 3.3 (WebFlux) / Java 21',
                        'Persistence': 'PostgreSQL + Redis Cache',
                        'Frontend': 'React 18 with WebSocket / SSE Streams',
                        'Orchestration': 'Kubernetes (EKS / GKE)'
                    },
                    implementationGuidelines: [
                        'Enforce schema registries (Avro/Protobuf) for event contracts.',
                        'Implement Dead Letter Queues (DLQ) to isolate poisonous messages.',
                        'Set up OpenTelemetry for end-to-end distributed tracing.'
                    ],
                    sprintVelocity: 35,
                    bugTrend: 'stable',
                    technicalDebt: 'medium',
                    codeQualityIndex: 78
                }}
            />
        </div>
    );
};

export default DashboardPage;
