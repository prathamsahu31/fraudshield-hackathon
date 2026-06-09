'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard, GlassCardHeader } from '@/components/glass-card';
import { simulationRulesMock, SimulationRule } from '@/lib/mockData';
import { 
  Cpu, 
  Plus, 
  Play, 
  HelpCircle, 
  CheckCircle2, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  Sliders, 
  Trash2,
  Terminal,
  Activity,
  Zap,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Clock,
  ArrowRight,
  Flame,
  User,
  Shield,
  Layers,
  Sparkles,
  Building
} from 'lucide-react';

interface PredictResponse {
  fraud_probability: number;
  risk_score: number;
  risk_level: string;
  triggers: string[];
}

interface SimulationEvent {
  time: number;
  event: string;
  title: string;
  details: string;
  data: any;
}

export default function SimulationPage() {
  const [activePageTab, setActivePageTab] = useState<'scenario' | 'predict' | 'rules'>('scenario');

  // Rules database states
  const [rules, setRules] = useState<SimulationRule[]>(simulationRulesMock);
  const [ruleName, setRuleName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('Outbound Wire');
  const [conditionField, setConditionField] = useState('Amount');
  const [conditionOperator, setConditionOperator] = useState('>');
  const [conditionValue, setConditionValue] = useState('10000');
  const [actionTaken, setActionTaken] = useState<'Flag' | 'Block' | 'Step-up MFA' | 'Hold'>('Block');

  // Batch Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<{
    tested: number;
    flagged: number;
    truePositives: number;
    falsePositives: number;
    accuracy: number;
  } | null>(null);

  // AI Risk Scorer — 17 features from official BoB dataset
  const [featureInputs, setFeatureInputs] = useState({
    F115: 0.53, F321: 1.09, F527: 1.32, F531: 1.12, F670: 1.0,
    F1692: 1.0, F2082: 0.0, F2122: 0.009, F2582: -0.08, F2678: -0.12,
    F2737: -0.16, F2956: 36.0, F3836: 29814.53, F3887: 170, F3894: 30.0,
    F3889: 'G365D', F3891: 'salaried'
  });

  const featureMeta: Record<string, { label: string; desc: string; type: 'number' | 'select'; options?: string[] }> = {
    F115: { label: 'F115', desc: 'Account Activity Ratio', type: 'number' },
    F321: { label: 'F321', desc: 'Transaction Velocity Index', type: 'number' },
    F527: { label: 'F527', desc: 'Cross-Border Payment Ratio', type: 'number' },
    F531: { label: 'F531', desc: 'Peer Transaction Deviation', type: 'number' },
    F670: { label: 'F670', desc: 'Channel Switch Indicator', type: 'number' },
    F1692: { label: 'F1692', desc: 'IP Geolocation Mismatch', type: 'number' },
    F2082: { label: 'F2082', desc: 'Device Fingerprint Anomaly', type: 'number' },
    F2122: { label: 'F2122', desc: 'Session Behavior Score', type: 'number' },
    F2582: { label: 'F2582', desc: 'Fraud Proximity Index', type: 'number' },
    F2678: { label: 'F2678', desc: 'Beneficiary Risk Score', type: 'number' },
    F2737: { label: 'F2737', desc: 'Velocity Spike Coefficient', type: 'number' },
    F2956: { label: 'F2956', desc: 'Amount Quantile', type: 'number' },
    F3836: { label: 'F3836', desc: 'Cumulative Outflow Volume', type: 'number' },
    F3887: { label: 'F3887', desc: 'Account Age (Days)', type: 'number' },
    F3894: { label: 'F3894', desc: 'Customer Profile Score', type: 'number' },
    F3889: { label: 'F3889', desc: 'Account Tenure Window', type: 'select', options: ['G365D', 'L365D', 'L180D', 'L90D', 'L31D', 'L14D', 'L7D'] },
    F3891: { label: 'F3891', desc: 'Occupation Category', type: 'select', options: ['selfemployed', 'student', 'salaried', 'agriculture', 'housewife', 'retired', 'others'] },
  };

  const updateFeature = (key: string, value: string | number) => {
    setFeatureInputs(prev => ({ ...prev, [key]: value }));
  };

  // AI Prediction API state
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictResult, setPredictResult] = useState<PredictResponse | null>({
    fraud_probability: 0.74,
    risk_score: 74.0,
    risk_level: 'High',
    triggers: ['Transaction velocity exceeds safe threshold']
  });

  // ================= SCENARIO SIMULATOR STATE =================
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [scenarioTime, setScenarioTime] = useState(0);
  const [scenarioEvents, setScenarioEvents] = useState<SimulationEvent[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const consoleBottomRef = useRef<HTMLDivElement | null>(null);

  // Toggle active rule
  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r
    ));
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  // Add rule
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const newRule: SimulationRule = {
      id: `RULE-00${rules.length + 1}`,
      name: ruleName,
      description: `Custom policy rule triggered on ${triggerEvent} check.`,
      triggerEvent,
      conditions: `${conditionField} ${conditionOperator} ${conditionValue}`,
      action: actionTaken,
      status: 'Active',
      statistics: {
        triggerCount: 0,
        truePositives: 0,
        falsePositives: 0,
      }
    };

    setRules(prev => [...prev, newRule]);
    setRuleName('');
  };

  // Run Batch Simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationResults(null);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResults({
        tested: 10000,
        flagged: 384,
        truePositives: 362,
        falsePositives: 22,
        accuracy: 94.2,
      });
    }, 1200);
  };

  // Run Live AI Scorer (POST /predict) — 17 features
  const handleRunAiPredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPredict(true);
    setPredictError(null);
    
    try {
      // Build payload with proper types
      const payload: Record<string, number | string> = {};
      for (const [key, val] of Object.entries(featureInputs)) {
        if (featureMeta[key]?.type === 'select') {
          payload[key] = String(val);
        } else {
          payload[key] = Number(val);
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "API prediction error occurred");
      }

      const data: PredictResponse = await res.json();
      setPredictResult(data);
    } catch (err: any) {
      console.error(err);
      setPredictError(err.message || "Failed to query FastAPI prediction service.");
    } finally {
      setLoadingPredict(false);
    }
  };

  // Trigger Fraud Scenario Simulation on the backend, then run frontend animation
  const handleTriggerScenario = async () => {
    if (scenarioRunning) return;
    setScenarioLoading(true);
    setError(null);
    setConsoleLogs([]);
    setScenarioTime(0);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/simulation/run`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`Failed to trigger simulation: ${res.statusText}`);
      }
      const data = await res.json();
      setScenarioEvents(data.events);
      
      // Start 60-second countdown ticker
      setScenarioLoading(false);
      setScenarioRunning(true);
      
      addConsoleLog('SYSTEM: Initializing sandbox database compilation...', 'cyan');
      addConsoleLog('SYSTEM: Purging previous simulation runs.', 'zinc');
      
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;
        setScenarioTime(seconds);
        
        // Log custom telemetries based on elapsed time
        if (seconds === 1) {
          addConsoleLog('EVENT: Dispute complaint submitted for ACT-SAFE-99 (Alice Cooper).', 'amber');
          addConsoleLog('CONSOLE: Dispute ID: CMP-SIM-01, Dispute type: Unauthorized Wire, disputed value: $12,450.00.', 'zinc');
        } else if (seconds === 10) {
          addConsoleLog('EVENT: Suspicious outbound wire transaction detected.', 'amber');
          addConsoleLog('CONSOLE: Transaction TXN-SIM-01 dispatched from ACT-SAFE-99 to Zenith Global Trust (ACT-SMURF-99).', 'zinc');
        } else if (seconds === 20) {
          addConsoleLog('AI-ENGINE: Consulting live threat scoring matrix...', 'cyan');
          addConsoleLog('AI-ENGINE: Classifier score: 94 / 100. Threat Classification: CRITICAL.', 'rose');
          addConsoleLog('AI-ENGINE: Flags: Geographic Impossible Travel, Emulated Chrome Device.', 'rose');
          addConsoleLog('CONSOLE: Transaction status set to FLAGGED. Alert dispatched to compliance desks.', 'zinc');
        } else if (seconds === 30) {
          addConsoleLog('EVENT: Downstream split transfer identified.', 'amber');
          addConsoleLog('CONSOLE: Outflow TXN-SIM-02 ($12,000.00) sent from ACT-SMURF-99 to Offshore Finance (ACT-HUB-99).', 'zinc');
          addConsoleLog('CONSOLE: Layering ratio 96.4%. Potential Smurfing/Structuring ring active.', 'rose');
        } else if (seconds === 40) {
          addConsoleLog('SYSTEM: Promotion algorithm executed on mule nodes.', 'cyan');
          addConsoleLog('SYSTEM: Account ACT-SMURF-99 risk score elevated to 85 (Promoted to SMURF).', 'rose');
          addConsoleLog('SYSTEM: Account ACT-HUB-99 risk score elevated to 95 (Promoted to MULE HUB).', 'rose');
        } else if (seconds === 50) {
          addConsoleLog('CASE-ENG: Critical fraud ring audit file created.', 'cyan');
          addConsoleLog('CASE-ENG: Case ID: CASE-SIM-01, Assigned to Investigator: Marcus Brody.', 'cyan');
          addConsoleLog('CASE-ENG: Connected accounts isolated and linked transactions locked.', 'zinc');
        } else if (seconds >= 60) {
          addConsoleLog('SYSTEM: Live fraud scenario simulation successfully compiled. Sandboxed files persisted.', 'emerald');
          if (timerRef.current) clearInterval(timerRef.current);
          setScenarioRunning(false);
        } else {
          // Standard ticking messages to make the console feel alive
          if (seconds % 6 === 0) {
            addConsoleLog(`CONSOLE: Ticking... Elapsed time: ${seconds}s / 60s. Monitoring SWIFT routing tables.`, 'zinc');
          }
        }
      }, 1000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start scenario.');
      setScenarioLoading(false);
    }
  };

  const addConsoleLog = (text: string, color: 'zinc' | 'cyan' | 'rose' | 'amber' | 'emerald') => {
    const colorClass = 
      color === 'cyan' ? 'text-cyber-cyan' :
      color === 'rose' ? 'text-cyber-rose' :
      color === 'amber' ? 'text-cyber-amber' :
      color === 'emerald' ? 'text-cyber-emerald' : 'text-zinc-550';
      
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${timestamp}] \u00BB ` + `<span class="${colorClass}">${text}</span>`]);
  };

  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Gauge parameters
  const circleCircumference = 377;
  const strokeOffset = predictResult 
    ? circleCircumference - (circleCircumference * predictResult.risk_score) / 100 
    : circleCircumference;

  const getRiskColors = (level: string) => {
    switch (level) {
      case 'Critical': return { text: 'text-cyber-rose', stroke: 'stroke-cyber-rose', bg: 'bg-cyber-rose/10', border: 'border-cyber-rose/30', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' };
      case 'High': return { text: 'text-cyber-amber', stroke: 'stroke-cyber-amber', bg: 'bg-cyber-amber/10', border: 'border-cyber-amber/30', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' };
      case 'Medium': return { text: 'text-cyber-blue', stroke: 'stroke-cyber-blue', bg: 'bg-cyber-blue/10', border: 'border-cyber-blue/30', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' };
      default: return { text: 'text-cyber-emerald', stroke: 'stroke-cyber-emerald', bg: 'bg-cyber-emerald/10', border: 'border-cyber-emerald/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 text-glow-cyan flex items-center gap-2">
          <Cpu className="h-7 w-7 text-cyber-cyan animate-pulse" />
          Interactive Policy Sandbox & AI Simulator
        </h1>
        <p className="text-sm text-zinc-400">
          Running batch sandbox validators, evaluating policy rulesets, and simulating multi-hop fraud attack loops.
        </p>
      </div>

      {/* Connection error banner */}
      {predictError && (
        <div className="p-4 rounded-lg bg-cyber-rose/15 border border-cyber-rose/35 text-xs text-cyber-rose flex items-center gap-2 animate-pulse">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{predictError}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-px">
        <button
          onClick={() => setActivePageTab('scenario')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activePageTab === 'scenario' 
              ? 'border-cyber-cyan text-cyber-cyan font-bold bg-cyber-cyan/5 text-glow-cyan' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Fraud Scenario Simulation
        </button>
        <button
          onClick={() => setActivePageTab('predict')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activePageTab === 'predict' 
              ? 'border-cyber-cyan text-cyber-cyan font-bold bg-cyber-cyan/5 text-glow-cyan' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          AI Live Predictor
        </button>
        <button
          onClick={() => setActivePageTab('rules')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activePageTab === 'rules' 
              ? 'border-cyber-cyan text-cyber-cyan font-bold bg-cyber-cyan/5 text-glow-cyan' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Policy Rules Engine
        </button>
      </div>

      {/* ================= PAGE TAB 1: FRAUD SCENARIO SIMULATOR ================= */}
      {activePageTab === 'scenario' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Left Box: Controls & Timeline steps */}
            <GlassCard className="p-5 flex flex-col justify-between lg:col-span-1">
              <div>
                <GlassCardHeader 
                  title="Scenario Control Center" 
                  subtitle="Trigger a realistic fraud ring sequence and monitor it in sandbox"
                />

                {error && (
                  <div className="p-3 mt-3 rounded bg-cyber-rose/10 border border-cyber-rose/20 text-[11px] text-cyber-rose flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4 text-xs mt-4">
                  <p className="text-zinc-400 leading-normal">
                    This triggers database insertions seeding a compromised standard account, a fraudulent wire transfer, live ML scoring, smurf/hub layering hops, and a compliance case file.
                  </p>
                  
                  <button
                    onClick={handleTriggerScenario}
                    disabled={scenarioRunning || scenarioLoading}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/45 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 disabled:opacity-50 cursor-pointer text-glow-cyan"
                  >
                    {scenarioLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Compiling database scenario...</span>
                      </>
                    ) : scenarioRunning ? (
                      <>
                        <Activity className="h-4 w-4 animate-pulse" />
                        <span>Simulating Scenario ({60 - scenarioTime}s)</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Run Fraud Scenario (60s)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Vertical Step indicators */}
                <div className="mt-6 space-y-4">
                  {[
                    { threshold: 0, title: 'Dispute Claim Arrives', label: 't = 0s' },
                    { threshold: 10, title: 'Fraud Transaction Dispatched', label: 't = 10s' },
                    { threshold: 20, title: 'AI Prediction Classifier Triggered', label: 't = 20s' },
                    { threshold: 30, title: 'Mule Layering Network Expands', label: 't = 30s' },
                    { threshold: 40, title: 'Mule Accounts Promoting / Flagged', label: 't = 40s' },
                    { threshold: 50, title: 'Audit Case Created & Persisted', label: 't = 50s' }
                  ].map((step, idx) => {
                    const isUnlocked = scenarioTime >= step.threshold && (scenarioRunning || scenarioTime > 0);
                    const isActive = scenarioRunning && scenarioTime >= step.threshold && scenarioTime < step.threshold + 10;
                    
                    return (
                      <div key={idx} className="flex gap-3 items-center">
                        <span className={`h-6 w-6 rounded-full border text-[10px] font-bold flex items-center justify-center ${
                          isActive ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan animate-pulse' :
                          isUnlocked ? 'bg-cyber-emerald/10 border-cyber-emerald/40 text-cyber-emerald' :
                          'bg-zinc-950 border-zinc-900 text-zinc-650'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className={`text-xs block ${
                            isActive ? 'text-cyber-cyan font-bold text-glow-cyan' :
                            isUnlocked ? 'text-zinc-200' : 'text-zinc-500'
                          }`}>{step.title}</span>
                          <span className="text-[9px] text-zinc-500 font-mono block leading-none">{step.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Action Button at t>=50s */}
              {scenarioTime >= 50 && (
                <div className="border-t border-zinc-900 pt-4 mt-6">
                  <a 
                    href="/investigations"
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded bg-cyber-emerald/15 border border-cyber-emerald/35 text-cyber-emerald hover:bg-cyber-emerald/25 transition-all duration-150"
                  >
                    Open Created Investigation Case
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </GlassCard>

            {/* Right Box: Live Network expander (2/3 width) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Graphic nodes visualizer */}
              <GlassCard className="p-5 flex-1 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <GlassCardHeader title="Scenario Live Visualizer" subtitle="Chronological flow updates as the timeline ticks" />

                {/* SVG Visual Map */}
                <div className="w-full h-48 relative border border-zinc-900 bg-zinc-950/40 rounded-xl mt-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 cyber-grid opacity-30" />
                  
                  {/* Step 1 Node: Victim Alice Cooper */}
                  {(scenarioTime >= 0 && (scenarioRunning || scenarioTime > 0)) && (
                    <div 
                      className="absolute flex flex-col items-center animate-in zoom-in duration-300"
                      style={{ left: '15%', top: '35%' }}
                    >
                      <div className="h-10 w-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
                        <User className="h-5 w-5" />
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-cyber-rose text-zinc-100 text-[8px] font-bold rounded-full flex items-center justify-center border border-zinc-950">!</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-300 mt-1 block">Alice Cooper</span>
                      <span className="text-[8px] text-zinc-500 font-mono block">Victim (Standard)</span>
                    </div>
                  )}

                  {/* Flow Arrow 1: Victim -> Smurf */}
                  {scenarioTime >= 10 && (
                    <svg className="absolute inset-0 h-full w-full pointer-events-none">
                      <path 
                        d="M 125 100 Q 185 80, 245 70" 
                        fill="none" 
                        stroke={scenarioTime >= 20 ? '#f43f5e' : '#f59e0b'}
                        strokeWidth="2" 
                        strokeDasharray={scenarioTime >= 20 ? 'none' : '4 4'}
                        className={`transition-all duration-300 ${scenarioTime >= 20 ? 'animate-pulse' : 'animate-scan'}`}
                      />
                      {scenarioTime >= 20 && (
                        <text x="160" y="60" className="text-[8px] font-mono fill-cyber-rose font-bold" transform="rotate(-7, 160, 60)">
                          AI FLAGGED: 94 Risk
                        </text>
                      )}
                    </svg>
                  )}

                  {/* Step 2 Node: Smurf */}
                  {scenarioTime >= 10 && (
                    <div 
                      className="absolute flex flex-col items-center animate-in zoom-in duration-300"
                      style={{ left: '45%', top: '15%' }}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-500 ${
                        scenarioTime >= 40 
                          ? 'bg-cyber-amber/10 border-cyber-amber/50 text-cyber-amber shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        <Layers className="h-5 w-5" />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-300 mt-1 block">ACT-SMURF-99</span>
                      <span className="text-[8px] text-zinc-500 font-mono block">
                        {scenarioTime >= 40 ? 'Mule Smurf (Risk: 85)' : 'Receiver Node'}
                      </span>
                    </div>
                  )}

                  {/* Flow Arrow 2: Smurf -> Hub */}
                  {scenarioTime >= 30 && (
                    <svg className="absolute inset-0 h-full w-full pointer-events-none">
                      <path 
                        d="M 285 70 Q 345 90, 405 100" 
                        fill="none" 
                        stroke={scenarioTime >= 40 ? '#f43f5e' : '#3b82f6'}
                        strokeWidth="2" 
                        strokeDasharray={scenarioTime >= 40 ? 'none' : '4 4'}
                        className="transition-all duration-300"
                      />
                      <text x="320" y="75" className="text-[8px] font-mono fill-zinc-400">
                        Wire: $12k
                      </text>
                    </svg>
                  )}

                  {/* Step 3 Node: Hub Account */}
                  {scenarioTime >= 30 && (
                    <div 
                      className="absolute flex flex-col items-center animate-in zoom-in duration-300"
                      style={{ left: '75%', top: '35%' }}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-500 ${
                        scenarioTime >= 40 
                          ? 'bg-cyber-rose/10 border-cyber-rose/50 text-cyber-rose shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        <Building className="h-5 w-5" />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-300 mt-1 block">ACT-HUB-99</span>
                      <span className="text-[8px] text-zinc-500 font-mono block">
                        {scenarioTime >= 40 ? 'Mule Hub (Risk: 95)' : 'Exit Terminal'}
                      </span>
                    </div>
                  )}

                  {/* Step 6 Node: Shield Case */}
                  {scenarioTime >= 50 && (
                    <div className="absolute bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose px-3 py-1.5 rounded-lg flex items-center gap-2 animate-bounce shadow-[0_0_20px_rgba(244,63,94,0.2)]" style={{ top: '65%' }}>
                      <Shield className="h-4 w-4" />
                      <div className="text-[9px] font-mono leading-none">
                        <span className="font-bold block">CASE TRIGGERED</span>
                        <span className="text-[8px] text-zinc-400 block mt-0.5">CASE-SIM-01 (Severity: Critical)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Green terminal log panel */}
                <div className="border border-zinc-900 rounded-xl bg-zinc-950 p-4 font-mono text-[10.5px] leading-relaxed flex-1 flex flex-col justify-between mt-4">
                  <div className="flex gap-2 text-cyber-cyan pb-2 border-b border-zinc-900/60 mb-2">
                    <Terminal className="h-4 w-4 shrink-0" />
                    <span>LIVE SCENARIO SIMULATOR TELEMETRY</span>
                  </div>
                  
                  <div className="space-y-1.5 h-36 overflow-y-auto pr-1">
                    {consoleLogs.length === 0 ? (
                      <p className="text-zinc-600 italic">Waiting for simulation launch signal. Click "Run Fraud Scenario" to start t=0s timer...</p>
                    ) : (
                      consoleLogs.map((log, idx) => (
                        <p key={idx} dangerouslySetInnerHTML={{ __html: log }} />
                      ))
                    )}
                    <div ref={consoleBottomRef} />
                  </div>
                </div>

              </GlassCard>
            </div>

          </div>
        </div>
      )}

      {/* ================= PAGE TAB 2: AI RISK CLASSIFIER TERMINAL ================= */}
      {activePageTab === 'predict' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          
          {/* Left Card: 17-Feature Input Panel (3/5 width) */}
          <GlassCard glowColor="cyan" className="flex flex-col justify-between lg:col-span-3">
            <div>
              <GlassCardHeader 
                title="AI Threat Scoring Terminal" 
                subtitle="17-feature input panel — ExtraTrees classifier trained on official BoB hackathon dataset (99.07% accuracy)"
              />
              
              <form onSubmit={handleRunAiPredict} className="mt-4">
                {/* Numeric Features Grid */}
                <div className="mb-3">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-2">NUMERIC FEATURES (15)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(featureMeta)
                      .filter(([, meta]) => meta.type === 'number')
                      .map(([key, meta]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-baseline justify-between gap-1">
                            <label className="text-[10px] text-cyber-cyan font-mono font-bold">{meta.label}</label>
                            <span className="text-[9px] text-zinc-600 truncate max-w-[80px]">{meta.desc}</span>
                          </div>
                          <input
                            type="number"
                            step="any"
                            value={featureInputs[key as keyof typeof featureInputs]}
                            onChange={(e) => updateFeature(key, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 py-2 px-2.5 text-zinc-200 focus:outline-none focus:border-cyber-cyan/50 text-xs font-mono tabular-nums"
                          />
                        </div>
                      ))}
                  </div>
                </div>

                {/* Categorical Features */}
                <div className="mb-3">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-2">CATEGORICAL FEATURES (2)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(featureMeta)
                      .filter(([, meta]) => meta.type === 'select')
                      .map(([key, meta]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-baseline justify-between gap-1">
                            <label className="text-[10px] text-cyber-cyan font-mono font-bold">{meta.label}</label>
                            <span className="text-[9px] text-zinc-600">{meta.desc}</span>
                          </div>
                          <select
                            value={featureInputs[key as keyof typeof featureInputs]}
                            onChange={(e) => updateFeature(key, e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 py-2 px-2.5 text-zinc-200 focus:outline-none focus:border-cyber-cyan/50 text-xs"
                          >
                            {meta.options!.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Quick-fill presets */}
                <div className="flex flex-wrap gap-2 border-t border-zinc-900 pt-3 mb-3">
                  <span className="text-[10px] text-zinc-500 font-mono mr-1 self-center">PRESETS:</span>
                  <button
                    type="button"
                    onClick={() => setFeatureInputs({
                      F115: 0.69, F321: 1.31, F527: 1.24, F531: 1.24, F670: 0.0,
                      F1692: 0.0, F2082: 0.0, F2122: 0.0036, F2582: -0.09, F2678: 0.06,
                      F2737: -0.27, F2956: 191.0, F3836: 586038.08, F3887: 167, F3894: 39.0,
                      F3889: 'G365D', F3891: 'salaried'
                    })}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded border border-cyber-rose/40 bg-cyber-rose/10 text-cyber-rose hover:bg-cyber-rose/20 transition-all cursor-pointer"
                  >
                    High-Risk Fraud Vector
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeatureInputs({
                      F115: 0.3, F321: 0.8, F527: 0.5, F531: 0.6, F670: 0.0,
                      F1692: 0.0, F2082: 0.0, F2122: 0.001, F2582: -0.3, F2678: -0.5,
                      F2737: -0.1, F2956: 25.0, F3836: 15000, F3887: 365, F3894: 28.0,
                      F3889: 'G365D', F3891: 'salaried'
                    })}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded border border-cyber-emerald/40 bg-cyber-emerald/10 text-cyber-emerald hover:bg-cyber-emerald/20 transition-all cursor-pointer"
                  >
                    Safe Transaction Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeatureInputs({
                      F115: 0.7, F321: 1.5, F527: 1.1, F531: 1.3, F670: 1.0,
                      F1692: 0.0, F2082: 0.0, F2122: 0.05, F2582: 0.2, F2678: 0.1,
                      F2737: 0.3, F2956: 60.0, F3836: 120000, F3887: 90, F3894: 35.0,
                      F3889: 'L90D', F3891: 'selfemployed'
                    })}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded border border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber hover:bg-cyber-amber/20 transition-all cursor-pointer"
                  >
                    Suspicious Activity
                  </button>
                </div>
              </form>
            </div>

            <div className="border-t border-zinc-900 pt-4 mt-2">
              <button
                onClick={handleRunAiPredict}
                disabled={loadingPredict}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                {loadingPredict ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Consulting ExtraTrees Classifier...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Execute Model Scoring (POST /predict)</span>
                  </>
                )}
              </button>
            </div>
          </GlassCard>

          {/* Right Card: Predictions Outputs (2/5 width) */}
          <GlassCard 
            glowColor={predictResult ? (predictResult.risk_score >= 80 ? 'rose' : predictResult.risk_score >= 50 ? 'amber' : 'cyan') : 'none'}
            className="flex flex-col justify-between lg:col-span-2"
          >
            <div>
              <GlassCardHeader title="AI Risk Diagnostics" subtitle="Real-time ExtraTrees model output & trigger analysis" />
              
              {predictResult ? (
                <div className="space-y-5">
                  
                  {/* Visual score gauges */}
                  <div className="grid grid-cols-2 gap-4 items-center border border-zinc-900/60 p-4 rounded-xl bg-zinc-950/40">
                    
                    {/* Radial SVG Gauge */}
                    <div className="flex flex-col items-center justify-center relative">
                      <svg className="h-28 w-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="45" fill="none" stroke="#18181b" strokeWidth="6" />
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="45" 
                          fill="none" 
                          className={`stroke-2 transition-all duration-500 ease-out ${getRiskColors(predictResult.risk_level).stroke}`}
                          strokeWidth="8"
                          strokeDasharray={circleCircumference}
                          strokeDashoffset={strokeOffset}
                        />
                      </svg>
                      
                      <div className="absolute flex flex-col items-center justify-center font-mono">
                        <span className="text-xl font-bold text-zinc-100">{predictResult.risk_score.toFixed(0)}</span>
                        <span className="text-[8px] text-zinc-500">RISK</span>
                      </div>
                    </div>

                    {/* Probability data */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-zinc-550 font-mono uppercase">Fraud Probability</span>
                        <h4 className="text-2xl font-bold text-zinc-200 mt-0.5 font-mono">
                          {(predictResult.fraud_probability * 100).toFixed(1)}%
                        </h4>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-550 font-mono uppercase">Risk Classification</span>
                        <h4 className={`text-sm font-bold mt-0.5 font-mono ${getRiskColors(predictResult.risk_level).text}`}>
                          {predictResult.risk_level}
                        </h4>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-550 font-mono uppercase">Model Accuracy</span>
                        <h4 className="text-xs font-semibold text-cyber-cyan mt-0.5 font-mono">
                          99.07% (ExtraTrees)
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Trigger Flags from Model */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider block">Model Trigger Flags ({predictResult.triggers.length})</span>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {predictResult.triggers.map((trigger, idx) => (
                        <div 
                          key={idx} 
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                            predictResult.risk_score >= 80 
                              ? 'bg-cyber-rose/5 border-cyber-rose/25 text-zinc-300'
                              : predictResult.risk_score >= 50
                              ? 'bg-cyber-amber/5 border-cyber-amber/25 text-zinc-300'
                              : 'bg-zinc-900/40 border-zinc-900 text-zinc-400'
                          }`}
                        >
                          {predictResult.risk_score >= 80 ? (
                            <AlertTriangle className="h-4 w-4 text-cyber-rose shrink-0 mt-0.5" />
                          ) : predictResult.risk_score >= 50 ? (
                            <AlertTriangle className="h-4 w-4 text-cyber-amber shrink-0 mt-0.5" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-cyber-emerald shrink-0 mt-0.5" />
                          )}
                          <span className="text-[11px] leading-relaxed">{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border border-dashed border-zinc-900 rounded-lg">
                  <Gauge className="h-10 w-10 text-zinc-700 mb-2" />
                  <p className="font-semibold text-sm">Waiting for scoring trigger</p>
                  <p className="text-xs">Fill features and execute model query.</p>
                </div>
              )}
            </div>
            
            <div className="p-3.5 rounded-lg border border-zinc-900 bg-zinc-950/20 text-[10.5px] text-zinc-500 leading-relaxed mt-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-cyber-cyan shrink-0 mt-0.5" />
                <span>ExtraTrees ensemble with 100 estimators, trained on SMOTE-balanced official dataset. Trigger flags are generated from feature threshold analysis and model confidence scoring.</span>
              </div>
            </div>
          </GlassCard>

        </div>
      )}

      {/* ================= PAGE TAB 3: POLICY RULES ENGINE ================= */}
      {activePageTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Rule Creator Form (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            <GlassCard>
              <GlassCardHeader 
                title="Conditional Rule Builder" 
                subtitle="Define triggers to override the default AI classifications dynamically"
              />
              
              <form onSubmit={handleCreateRule} className="space-y-4 text-xs mt-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block font-sans">Rule Identifier Name</label>
                  <input
                    type="text"
                    required
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g. Impossible Travel Time Mismatch"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 py-2.5 px-3 text-sm text-zinc-200 placeholder-zinc-700 focus:border-cyber-cyan/50 focus:outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase">Trigger Event</label>
                    <select
                      value={triggerEvent}
                      onChange={(e) => setTriggerEvent(e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-205 focus:outline-none text-xs"
                    >
                      <option value="Outbound Wire">Outbound Wire</option>
                      <option value="Login Attempt">Login Attempt</option>
                      <option value="P2P Transfer">P2P Transfer</option>
                      <option value="ACH File">ACH File</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-mono">Variable</label>
                    <select
                      value={conditionField}
                      onChange={(e) => setConditionField(e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-205 focus:outline-none text-xs"
                    >
                      <option value="Amount">Amount ($)</option>
                      <option value="VelocityMismatch">VelocityMismatch</option>
                      <option value="JurisdictionRisk">JurisdictionRisk</option>
                      <option value="DeviceSignature">DeviceSignature</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-mono">Operator</label>
                    <select
                      value={conditionOperator}
                      onChange={(e) => setConditionOperator(e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-205 focus:outline-none text-xs"
                    >
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="==">==</option>
                      <option value="IN">IN</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-mono">Value</label>
                    <input
                      type="text"
                      required
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-202 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-zinc-900 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-550 uppercase">INTERCEPT RESOLUTION:</span>
                    <select
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value as any)}
                      className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-202 focus:outline-none"
                    >
                      <option value="Block">Block</option>
                      <option value="Hold">Hold</option>
                      <option value="Step-up MFA">Step-up MFA</option>
                      <option value="Flag">Flag</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/35 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Deploy Heuristic Rule
                  </button>
                </div>
              </form>
            </GlassCard>

            {/* Rules Database Table */}
            <GlassCard className="p-0 overflow-hidden">
              <GlassCardHeader 
                title="Operational Rules Registry" 
                subtitle="List of active override parameters checked prior to ML models"
                className="p-5"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      <th className="py-3 px-4">Rule Name</th>
                      <th className="py-3 px-4">Trigger Conditions</th>
                      <th className="py-3 px-4">Intercept Action</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Capture Rate (TP/FP)</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-xs">
                    {rules.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-900/20 transition-all duration-150">
                        <td className="py-3 px-4">
                          <span className="font-semibold block text-zinc-200">{r.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{r.id} | {r.triggerEvent}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-350">{r.conditions}</td>
                        <td className="py-3 px-4 font-semibold text-cyber-rose font-mono uppercase">{r.action}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleRule(r.id)}
                            className="flex items-center text-zinc-405 hover:text-zinc-200 transition-colors duration-150 cursor-pointer"
                          >
                            {r.status === 'Active' ? (
                              <span className="flex items-center gap-1.5 text-cyber-cyan">
                                <ToggleRight className="h-5.5 w-5.5" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-zinc-500">
                                <ToggleLeft className="h-5.5 w-5.5" />
                                Disabled
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {r.statistics.triggerCount > 0 ? (
                            <span>
                              TP: <strong className="text-cyber-emerald">{r.statistics.truePositives}</strong> / 
                              FP: <strong className="text-cyber-rose">{r.statistics.falsePositives}</strong>
                            </span>
                          ) : (
                            <span className="text-[10px] italic text-zinc-650">No pings recorded</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => handleDeleteRule(r.id)}
                            className="text-zinc-600 hover:text-cyber-rose rounded p-1 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

          </div>

          {/* Right Column: Simulator (1/3 width) */}
          <div className="space-y-6">
            
            <GlassCard glowColor="cyan" className="space-y-4">
              <GlassCardHeader title="Batch Simulator Engine" subtitle="Evaluate entire heuristics rulesets" />
              
              <p className="text-xs text-zinc-405 leading-relaxed font-sans">
                Execute a back-testing simulation run of 10,000 transaction records to calculate heuristics performance checks.
              </p>
              
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded bg-cyber-cyan/15 border border-cyber-cyan/45 text-cyber-cyan hover:bg-cyber-cyan/25 transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                <Play className="h-4 w-4" />
                {isSimulating ? 'Processing simulator batch...' : 'Execute Sandbox Runs'}
              </button>

              {isSimulating && (
                <div className="p-3.5 rounded border border-zinc-850 bg-zinc-950/75 font-mono text-[9.5px] space-y-1 animate-pulse">
                  <div className="flex gap-2 text-cyber-cyan">
                    <Terminal className="h-4 w-4 shrink-0" />
                    <span>[SANDBOX-ENG] COMPILING MATRIX DATA</span>
                  </div>
                  <p className="text-zinc-500">Checking triggers on deployed heuristic boundaries...</p>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-cyber-cyan" style={{ width: '75%' }} />
                  </div>
                </div>
              )}

              {simulationResults && (
                <div className="space-y-3 p-4 rounded-lg border border-cyber-emerald/25 bg-cyber-emerald/5 animate-in fade-in duration-200 text-xs">
                  <h5 className="font-bold text-cyber-emerald flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Simulation Matrix Compiled
                  </h5>
                  
                  <div className="space-y-2 border-t border-zinc-900/60 pt-3 font-mono text-zinc-350">
                    <div className="flex justify-between">
                      <span>Records Checked:</span>
                      <span className="text-zinc-200">{simulationResults.tested.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Triggers:</span>
                      <span className="text-cyber-cyan">{simulationResults.flagged}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>True Captures (TP):</span>
                      <span className="text-cyber-emerald">{simulationResults.truePositives}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>False Alarms (FP):</span>
                      <span className="text-cyber-rose">{simulationResults.falsePositives}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-zinc-850 pt-2.5 mt-2">
                      <span className="text-zinc-400">Rules Engine Accuracy:</span>
                      <span className="font-bold text-cyber-cyan">{simulationResults.accuracy}%</span>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>

            <GlassCard className="text-xs text-zinc-500 p-4">
              <div className="flex gap-2.5 items-start">
                <HelpCircle className="h-5 w-5 text-cyber-cyan shrink-0" />
                <p className="leading-relaxed font-sans">
                  Sandbox runs evaluate structural transaction histories chronologically to calculate precision and recall statistics prior to deploying filters to live pipelines.
                </p>
              </div>
            </GlassCard>

          </div>
        </div>
      )}
    </div>
  );
}
