import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Info, ChevronDown, ArrowRight, Calendar, Mail, X, Check, Sparkles } from 'lucide-react';

// ============================================================================
// UTAK BRAND COLORS (from brand guide)
// ============================================================================
const COLORS = {
  cleanWhite:   '#FFFFFF',
  expertGreen:  '#2BF062',
  sampleTeal:   '#0E9886',
  qualityBlue:  '#C9F0FF',
  denseNavy:    '#001A51',
  primePurple:  '#9A6AFF',
  pureBase:     '#FAFAFA',
  testingCyan:  '#A4FFEB',
  rigidSteel:   '#EDEDED',
  frostBlue:    '#7E9EA9',
  carbonBlack:  '#3B3B3B'
};

// ============================================================================
// HUBSPOT INTEGRATION
// ============================================================================
const HUBSPOT_PORTAL_ID = '21153233';
const HUBSPOT_FORM_GUID = 'df8ea2a5-2252-4ec0-9c2b-ac18418cb109';

// ============================================================================
// RESEARCH-BACKED CONSTANTS
// ============================================================================
const FAILURE_RATE = 0.12;
const COMPLIANCE_HOURS_PER_YEAR = 100;
const TRAINING_HOURS_PER_PREP_PER_PERSON = 6;
const VENDOR_MGMT_HOURS_PER_PREP = 6;

const DISCIPLINE_DEFAULTS = {
  forensic_tox: {
    label: 'Forensic Toxicology',
    sizes: {
      small: { lots: 6,  preps: 2,  materialCost: 2000, laborHoursPerLot: 14, people: 2, samplesPerHour: 5, revenuePerTest: 120, hourlyRate: 70 },
      mid:   { lots: 12, preps: 5,  materialCost: 2500, laborHoursPerLot: 16, people: 3, samplesPerHour: 6, revenuePerTest: 100, hourlyRate: 75 },
      large: { lots: 24, preps: 10, materialCost: 3500, laborHoursPerLot: 22, people: 5, samplesPerHour: 8, revenuePerTest: 85,  hourlyRate: 80 }
    }
  },
  pain_mgmt: {
    label: 'Pain Management',
    sizes: {
      small: { lots: 6,  preps: 2, materialCost: 1500, laborHoursPerLot: 14, people: 2, samplesPerHour: 10, revenuePerTest: 80, hourlyRate: 65 },
      mid:   { lots: 12, preps: 4, materialCost: 2000, laborHoursPerLot: 16, people: 3, samplesPerHour: 12, revenuePerTest: 70, hourlyRate: 70 },
      large: { lots: 24, preps: 8, materialCost: 2800, laborHoursPerLot: 20, people: 4, samplesPerHour: 15, revenuePerTest: 60, hourlyRate: 75 }
    }
  },
  clinical_chem: {
    label: 'Clinical Chemistry',
    sizes: {
      small: { lots: 4,  preps: 3,  materialCost: 800,  laborHoursPerLot: 9,  people: 2, samplesPerHour: 20, revenuePerTest: 8, hourlyRate: 55 },
      mid:   { lots: 12, preps: 6,  materialCost: 1200, laborHoursPerLot: 12, people: 4, samplesPerHour: 25, revenuePerTest: 7, hourlyRate: 60 },
      large: { lots: 24, preps: 12, materialCost: 1800, laborHoursPerLot: 15, people: 6, samplesPerHour: 30, revenuePerTest: 6, hourlyRate: 65 }
    }
  },
  molecular: {
    label: 'Molecular Diagnostics',
    sizes: {
      small: { lots: 4,  preps: 2, materialCost: 3000, laborHoursPerLot: 18, people: 2, samplesPerHour: 4, revenuePerTest: 180, hourlyRate: 85 },
      mid:   { lots: 8,  preps: 4, materialCost: 4000, laborHoursPerLot: 22, people: 3, samplesPerHour: 5, revenuePerTest: 150, hourlyRate: 90 },
      large: { lots: 12, preps: 8, materialCost: 5500, laborHoursPerLot: 30, people: 5, samplesPerHour: 6, revenuePerTest: 120, hourlyRate: 95 }
    }
  },
  other: {
    label: 'Other Discipline',
    sizes: {
      small: { lots: 6,  preps: 3,  materialCost: 1800, laborHoursPerLot: 14, people: 2, samplesPerHour: 10, revenuePerTest: 50, hourlyRate: 70 },
      mid:   { lots: 12, preps: 5,  materialCost: 2200, laborHoursPerLot: 15, people: 3, samplesPerHour: 12, revenuePerTest: 45, hourlyRate: 72 },
      large: { lots: 24, preps: 10, materialCost: 3000, laborHoursPerLot: 19, people: 4, samplesPerHour: 15, revenuePerTest: 40, hourlyRate: 78 }
    }
  }
};

const LAB_SIZE_LABELS = {
  small: 'Small (under 50K tests/year)',
  mid:   'Mid-size (50K to 500K tests/year)',
  large: 'Large reference (500K+ tests/year)'
};

const TOOLTIPS = {
  discipline: 'Sets default values for throughput and reimbursement rates. You can override any field after selecting.',
  labSize: 'Drives starting defaults for lot volume, preparation count, and staffing. Adjust any field to match your lab.',
  lots: 'Total in-house QC lots your team manufactures or prepares across all preparations in a year.',
  preps: 'Number of distinct QC preparations (e.g., one opioid panel = one preparation, regardless of how many analytes it covers).',
  materialCost: 'Total raw materials per lot: analytes, matrices, solvents, consumables. Find this on recent purchasing invoices or in your QC materials budget line.',
  laborHoursPerLot: 'Hands-on time per lot including prep, lot release testing, stability checks, parallel testing against the previous lot, and documentation. Gets multiplied by your hourly rate to compute total labor cost.',
  people: 'Number of team members who must be competent and assessed annually for each preparation. CLIA requires this per test method.',
  hourlyRate: 'Fully loaded hourly cost (wages + benefits + overhead). Typically 1.3 to 1.4× base wages.',
  samplesPerHour: 'Average billable samples a tech can process per hour during normal testing. Default is an industry estimate; adjust to your reality.',
  revenuePerTest: 'Average reimbursement or billed amount per test. Check your CDM or the CMS Clinical Laboratory Fee Schedule for benchmarks.'
};

// ============================================================================
// REAL CHEMICAL STRUCTURE SVGs
// All structures are real skeletal formulas, simplified for clean rendering
// ============================================================================

function XylazineStructure({ stroke, size = 200, className = '' }) {
  return (
    <svg viewBox="0 0 240 120" className={className} style={{ width: size }} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* 2,6-dimethylphenyl ring */}
      <polygon points="50,60 35,86 50,112 80,112 95,86 80,60" />
      {/* inner double bond lines */}
      <line x1="42" y1="65" x2="42" y2="83" />
      <line x1="88" y1="65" x2="88" y2="83" />
      <line x1="55" y1="108" x2="75" y2="108" />
      {/* methyl groups */}
      <line x1="50" y1="60" x2="50" y2="42" />
      <line x1="80" y1="60" x2="80" y2="42" />
      {/* NH bridge */}
      <line x1="95" y1="86" x2="120" y2="86" />
      <text x="123" y="90" fontSize="12" fontFamily="sans-serif" fill={stroke} stroke="none">N</text>
      <text x="123" y="80" fontSize="8" fontFamily="sans-serif" fill={stroke} stroke="none">H</text>
      {/* thiazine ring */}
      <line x1="138" y1="86" x2="160" y2="86" />
      <polygon points="160,86 175,62 200,62 215,86 200,110 175,110" />
      <text x="207" y="89" fontSize="11" fontFamily="sans-serif" fill={stroke} stroke="none">S</text>
      <text x="166" y="89" fontSize="11" fontFamily="sans-serif" fill={stroke} stroke="none">N</text>
      {/* C=N double bond in thiazine */}
      <line x1="178" y1="66" x2="197" y2="66" />
    </svg>
  );
}

function FentanylStructure({ stroke, size = 220, className = '' }) {
  return (
    <svg viewBox="0 0 300 140" className={className} style={{ width: size }} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Left phenyl */}
      <polygon points="30,70 15,96 30,122 60,122 75,96 60,70" />
      <line x1="22" y1="75" x2="22" y2="93" />
      <line x1="68" y1="75" x2="68" y2="93" />
      <line x1="35" y1="118" x2="55" y2="118" />
      {/* Chain to piperidine */}
      <line x1="75" y1="96" x2="95" y2="80" />
      <line x1="95" y1="80" x2="115" y2="96" />
      <line x1="115" y1="96" x2="135" y2="80" />
      {/* Piperidine ring center */}
      <polygon points="155,60 140,40 160,20 185,20 200,40 185,60" />
      <text x="138" y="44" fontSize="11" fontFamily="sans-serif" fill={stroke} stroke="none">N</text>
      {/* Right phenyl */}
      <line x1="200" y1="40" x2="225" y2="40" />
      <polygon points="225,40 240,16 265,16 280,40 265,64 240,64" />
      <line x1="244" y1="22" x2="261" y2="22" />
      <line x1="244" y1="58" x2="261" y2="58" />
      <line x1="232" y1="40" x2="232" y2="40" />
      {/* Carbonyl branch from piperidine */}
      <line x1="170" y1="60" x2="170" y2="90" />
      <line x1="173" y1="60" x2="173" y2="90" />
      <text x="166" y="105" fontSize="11" fontFamily="sans-serif" fill={stroke} stroke="none">O</text>
      {/* Ethyl tail */}
      <line x1="155" y1="60" x2="135" y2="115" />
    </svg>
  );
}

function MethamphetamineStructure({ stroke, size = 180, className = '' }) {
  return (
    <svg viewBox="0 0 220 100" className={className} style={{ width: size }} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Phenyl ring */}
      <polygon points="40,50 25,76 40,102 70,102 85,76 70,50" />
      <line x1="32" y1="55" x2="32" y2="73" />
      <line x1="78" y1="55" x2="78" y2="73" />
      <line x1="45" y1="98" x2="65" y2="98" />
      {/* CH2 */}
      <line x1="85" y1="76" x2="105" y2="60" />
      {/* CH(CH3) */}
      <line x1="105" y1="60" x2="125" y2="76" />
      {/* Methyl branch */}
      <line x1="105" y1="60" x2="105" y2="40" />
      {/* NH */}
      <line x1="125" y1="76" x2="150" y2="60" />
      <text x="153" y="64" fontSize="12" fontFamily="sans-serif" fill={stroke} stroke="none">N</text>
      <text x="153" y="54" fontSize="8" fontFamily="sans-serif" fill={stroke} stroke="none">H</text>
      {/* terminal methyl */}
      <line x1="170" y1="60" x2="190" y2="76" />
    </svg>
  );
}

function MorphineStructure({ stroke, size = 200, className = '' }) {
  return (
    <svg viewBox="0 0 240 200" className={className} style={{ width: size }} fill="none" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {/* A-ring (aromatic) */}
      <polygon points="40,80 25,106 40,132 70,132 85,106 70,80" />
      <line x1="32" y1="85" x2="32" y2="103" />
      <line x1="78" y1="85" x2="78" y2="103" />
      <line x1="45" y1="128" x2="65" y2="128" />
      {/* Phenolic OH */}
      <line x1="25" y1="106" x2="10" y2="106" />
      <text x="0" y="110" fontSize="10" fontFamily="sans-serif" fill={stroke} stroke="none">HO</text>
      {/* B-ring */}
      <polygon points="85,106 100,80 130,80 145,106 130,132 100,132" />
      {/* O bridge */}
      <line x1="85" y1="106" x2="115" y2="155" />
      <text x="115" y="170" fontSize="11" fontFamily="sans-serif" fill={stroke} stroke="none">O</text>
      {/* C-ring */}
      <polygon points="145,106 160,80 190,80 205,106 190,132 160,132" />
      {/* D-ring with N */}
      <polygon points="190,132 205,158 195,182 165,182 155,158" />
      <text x="190" y="170" fontSize="11" fontFamily="sans-serif" fill={stroke} stroke="none">N</text>
      <line x1="205" y1="158" x2="225" y2="148" />
      {/* OH at top */}
      <line x1="190" y1="80" x2="205" y2="60" />
      <text x="207" y="58" fontSize="10" fontFamily="sans-serif" fill={stroke} stroke="none">OH</text>
    </svg>
  );
}

// ============================================================================
// CANVAS PARTICLE NETWORK (matrix landing page style)
// ============================================================================
function MoleculeNetwork({ density = 28, lineColor, dotColor }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const nodes = Array.from({ length: density }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      r: Math.random() * 2.5 + 1.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const opacity = (1 - dist / 140) * 0.5;
            ctx.strokeStyle = lineColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });

      animationRef.current = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [density, lineColor, dotColor]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }} />;
}

// Animated number that smoothly counts on change
function useAnimatedNumber(value, duration = 600) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const change = value - start;
    if (change === 0) return;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + change * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UTAKQCCalculator() {
  const [framingView, setFramingView] = useState('roi');
  const [discipline, setDiscipline] = useState('forensic_tox');
  const [labSize, setLabSize] = useState('mid');
  const defaults = DISCIPLINE_DEFAULTS[discipline].sizes[labSize];

  const [lots, setLots] = useState(defaults.lots);
  const [preps, setPreps] = useState(defaults.preps);
  const [materialCost, setMaterialCost] = useState(defaults.materialCost);
  const [laborHoursPerLot, setLaborHoursPerLot] = useState(defaults.laborHoursPerLot);
  const [people, setPeople] = useState(defaults.people);
  const [hourlyRate, setHourlyRate] = useState(defaults.hourlyRate);
  const [samplesPerHour, setSamplesPerHour] = useState(defaults.samplesPerHour);
  const [revenuePerTest, setRevenuePerTest] = useState(defaults.revenuePerTest);

  const [activeTooltip, setActiveTooltip] = useState(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleDisciplineChange = (newDiscipline) => {
    setDiscipline(newDiscipline);
    const d = DISCIPLINE_DEFAULTS[newDiscipline].sizes[labSize];
    setLots(d.lots); setPreps(d.preps);
    setMaterialCost(d.materialCost); setLaborHoursPerLot(d.laborHoursPerLot);
    setPeople(d.people); setHourlyRate(d.hourlyRate);
    setSamplesPerHour(d.samplesPerHour); setRevenuePerTest(d.revenuePerTest);
  };

  const handleLabSizeChange = (newSize) => {
    setLabSize(newSize);
    const d = DISCIPLINE_DEFAULTS[discipline].sizes[newSize];
    setLots(d.lots); setPreps(d.preps);
    setMaterialCost(d.materialCost); setLaborHoursPerLot(d.laborHoursPerLot);
    setPeople(d.people); setHourlyRate(d.hourlyRate);
    setSamplesPerHour(d.samplesPerHour); setRevenuePerTest(d.revenuePerTest);
  };

  const results = useMemo(() => {
    // Derive labor cost per lot from hours × rate
    const laborCostPerLot = laborHoursPerLot * hourlyRate;

    const annualMaterialCost = lots * materialCost;
    const annualLaborCost = lots * laborCostPerLot;
    const directCost = annualMaterialCost + annualLaborCost;
    const failureCost = lots * FAILURE_RATE * (materialCost + laborCostPerLot);
    const complianceCost = COMPLIANCE_HOURS_PER_YEAR * hourlyRate;
    const trainingCost = preps * people * TRAINING_HOURS_PER_PREP_PER_PERSON * hourlyRate;
    const vendorMgmtCost = preps * VENDOR_MGMT_HOURS_PER_PREP * hourlyRate;
    const vendorTrainingCost = trainingCost + vendorMgmtCost;
    const totalTrueCost = directCost + failureCost + complianceCost + vendorTrainingCost;

    // Opportunity cost: labor hours per lot is now a direct input
    const annualLaborHoursOnPrep = lots * laborHoursPerLot;
    const overheadHours = COMPLIANCE_HOURS_PER_YEAR +
      (preps * people * TRAINING_HOURS_PER_PREP_PER_PERSON) +
      (preps * VENDOR_MGMT_HOURS_PER_PREP);
    const totalQCHours = annualLaborHoursOnPrep + overheadHours;
    const samplesNotProcessed = totalQCHours * samplesPerHour;
    const opportunityCost = samplesNotProcessed * revenuePerTest;

    return {
      directCost, failureCost, complianceCost, vendorTrainingCost,
      totalTrueCost, opportunityCost,
      totalQCHours: Math.round(totalQCHours),
      samplesNotProcessed: Math.round(samplesNotProcessed),
      laborCostPerLot: Math.round(laborCostPerLot)
    };
  }, [lots, preps, materialCost, laborHoursPerLot, people, hourlyRate, samplesPerHour, revenuePerTest]);

  const animatedTotal = useAnimatedNumber(Math.round(results.totalTrueCost));
  const animatedOpp = useAnimatedNumber(Math.round(results.opportunityCost));

  const fmt = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

  const handleHubSpotSubmit = async () => {
    if (!emailValue.includes('@')) return;

    const formData = {
      fields: [
        { name: 'email', value: emailValue },
        { name: 'realx_discipline', value: DISCIPLINE_DEFAULTS[discipline].label },
        { name: 'realx_lab_size', value: LAB_SIZE_LABELS[labSize] },
        { name: 'realx_lots_per_year', value: lots.toString() },
        { name: 'realx_material_cost_per_lot', value: materialCost.toString() },
        { name: 'realx_labor_hours_per_lot', value: laborHoursPerLot.toString() },
        { name: 'realx_hourly_rate', value: hourlyRate.toString() },
        { name: 'realx_true_annual_cost', value: Math.round(results.totalTrueCost).toString() },
        { name: 'realx_opportunity_cost', value: Math.round(results.opportunityCost).toString() },
        { name: 'realx_total_qc_hours', value: results.totalQCHours.toString() },
        { name: 'realx_samples_not_processed', value: results.samplesNotProcessed.toString() }
      ],
      context: {
        pageUri: window.location.href,
        pageName: document.title
      }
    };

    try {
      const response = await fetch(
        `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        setEmailSubmitted(true);
      } else {
        console.error('HubSpot submission failed:', await response.text());
        alert('Something went wrong. Please try again or email welovecontrol@utak.com directly.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Something went wrong. Please try again or email welovecontrol@utak.com directly.');
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Sora', system-ui, sans-serif", backgroundColor: COLORS.pureBase, color: COLORS.denseNavy }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700;800&display=swap');
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift1 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-14px) translateX(6px) rotate(2deg); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(12px) translateX(-8px) rotate(-3deg); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-10px) translateX(-12px) rotate(1.5deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .fade-up { animation: fadeUp 0.7s ease-out forwards; }
        .drift-1 { animation: drift1 9s ease-in-out infinite; }
        .drift-2 { animation: drift2 11s ease-in-out infinite; }
        .drift-3 { animation: drift3 13s ease-in-out infinite; }
        .pulse { animation: pulse 2.5s ease-in-out infinite; }
        .number-display {
          font-feature-settings: "tnum";
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      {/* ============ HERO ============ */}
      <section className="relative px-6 md:px-16 pt-28 pb-20 md:pt-40 md:pb-28 max-w-7xl mx-auto overflow-hidden" style={{ width: '100%' }}>

        {/* Mobile/tablet — single subtle backdrop */}
        <div className="absolute drift-1 pointer-events-none lg:hidden" style={{ top: '90px', right: '20px', opacity: 0.2 }}>
          <XylazineStructure stroke={COLORS.sampleTeal} size={180} />
        </div>

        {/* Desktop — full visual composition on the right side */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">

          {/* Massive italic X — the algebraic variable */}
          <div
            className="absolute select-none"
            style={{
              top: '160px',
              right: '160px',
              fontSize: '22rem',
              fontFamily: "'Sora', serif",
              fontWeight: 100,
              fontStyle: 'italic',
              color: COLORS.sampleTeal,
              opacity: 0.07,
              lineHeight: 1
            }}
          >
            x
          </div>

          {/* SVG dashed connection lines */}
          <svg className="absolute" style={{ top: '180px', right: '40px', width: '420px', height: '380px' }} viewBox="0 0 420 380">
            <line x1="320" y1="60" x2="100" y2="180" stroke={COLORS.sampleTeal} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <line x1="100" y1="180" x2="280" y2="320" stroke={COLORS.expertGreen} strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
            <line x1="320" y1="60" x2="280" y2="320" stroke={COLORS.denseNavy} strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
          </svg>

          {/* Xylazine — top right */}
          <div className="absolute drift-1" style={{ top: '120px', right: '20px', opacity: 0.7 }}>
            <XylazineStructure stroke={COLORS.sampleTeal} size={220} />
          </div>

          {/* Fentanyl — middle right */}
          <div className="absolute drift-2" style={{ top: '340px', right: '220px', opacity: 0.6 }}>
            <FentanylStructure stroke={COLORS.denseNavy} size={240} />
          </div>

          {/* Methamphetamine — bottom right */}
          <div className="absolute drift-3" style={{ bottom: '120px', right: '60px', opacity: 0.65 }}>
            <MethamphetamineStructure stroke={COLORS.expertGreen} size={170} />
          </div>

          {/* Pulsing accent dots */}
          <div className="absolute w-2.5 h-2.5 rounded-full pulse" style={{ top: '200px', right: '300px', backgroundColor: COLORS.expertGreen, boxShadow: `0 0 16px ${COLORS.expertGreen}` }}></div>
          <div className="absolute w-2 h-2 rounded-full pulse" style={{ bottom: '200px', right: '280px', backgroundColor: COLORS.sampleTeal, boxShadow: `0 0 12px ${COLORS.sampleTeal}`, animationDelay: '-1.2s' }}></div>
          <div className="absolute w-1.5 h-1.5 rounded-full pulse" style={{ top: '320px', right: '120px', backgroundColor: COLORS.denseNavy, animationDelay: '-2.5s' }}></div>

        </div>

        {/* Content — single column constrained by max-width */}
        <div className="relative z-10 fade-up" style={{ maxWidth: '680px' }}>
          {/* REALx Wordmark — navy block to match the email */}
          <div className="inline-block px-10 py-6 md:px-14 md:py-7 mb-12 md:mb-14" style={{ backgroundColor: COLORS.denseNavy }}>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-bold tracking-wider" style={{ color: COLORS.cleanWhite }}>REAL</span>
              <span className="text-4xl md:text-5xl italic leading-none" style={{ color: COLORS.sampleTeal, fontFamily: "Georgia, 'Times New Roman', serif" }}>x</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.02] mb-10 md:mb-12" style={{ color: COLORS.denseNavy }}>
            There's a number<br />
            you{' '}
            <span className="relative inline-block italic font-normal" style={{ color: COLORS.sampleTeal }}>
              haven't
            </span>
            <br />
            counted yet.
          </h1>

          <div className="space-y-5">
            <p className="text-lg md:text-xl font-light leading-relaxed" style={{ color: `${COLORS.denseNavy}B3` }}>
              For labs preparing QC in-house, materials cost is easy to track.
            </p>
            <p className="text-lg md:text-xl font-light leading-relaxed" style={{ color: `${COLORS.denseNavy}B3` }}>
              The rework. The compliance work. The vendors, training, and inventory behind every prep. Those numbers usually live somewhere else.
            </p>
            <p className="text-lg md:text-xl font-light leading-relaxed" style={{ color: COLORS.denseNavy }}>
              We do the math. <span style={{ fontWeight: 500 }}>You decide what it means.</span>
            </p>
          </div>

          <div className="mt-16 md:mt-20 flex items-center gap-4 text-xs tracking-[0.25em] uppercase font-medium" style={{ color: `${COLORS.denseNavy}80` }}>
            <div className="w-12 h-px" style={{ backgroundColor: `${COLORS.denseNavy}40` }} />
            <span>Start below</span>
          </div>
        </div>
      </section>

      {/* ============ STEP 1: INPUTS ============ */}
      <section className="relative" style={{ backgroundColor: `${COLORS.qualityBlue}26` }}>
        <div className="relative px-6 md:px-16 py-24 md:py-32 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute -top-12 right-4 drift-3 opacity-15 pointer-events-none hidden lg:block">
          <FentanylStructure stroke={COLORS.denseNavy} size={300} />
        </div>

        <div className="mb-16 md:mb-20 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl md:text-7xl font-extralight leading-none" style={{ color: COLORS.sampleTeal }}>01</span>
            <div className="h-px flex-1 max-w-24" style={{ backgroundColor: `${COLORS.denseNavy}25` }} />
          </div>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight" style={{ color: COLORS.denseNavy }}>
            Tell us about your lab.
          </h2>
          <p className="text-base md:text-lg font-light mt-5 max-w-xl" style={{ color: `${COLORS.denseNavy}A0` }}>
            We've pre-filled industry defaults so you can start fast. Override any field with your own numbers for a sharper picture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-12 md:gap-y-14 relative z-10">
          <SelectField label="Discipline" value={discipline} onChange={(e) => handleDisciplineChange(e.target.value)} tooltip={TOOLTIPS.discipline} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="discipline">
            {Object.entries(DISCIPLINE_DEFAULTS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
          </SelectField>
          <SelectField label="Lab Size" value={labSize} onChange={(e) => handleLabSizeChange(e.target.value)} tooltip={TOOLTIPS.labSize} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="labSize">
            {Object.entries(LAB_SIZE_LABELS).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
          </SelectField>
          <NumberField label="Lots Prepared Per Year" value={lots} onChange={setLots} tooltip={TOOLTIPS.lots} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="lots" suffix="lots/year" />
          <NumberField label="Distinct QC Preparations" value={preps} onChange={setPreps} tooltip={TOOLTIPS.preps} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="preps" suffix="preparations" />
          <NumberField label="Material Cost Per Lot" value={materialCost} onChange={setMaterialCost} tooltip={TOOLTIPS.materialCost} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="materialCost" prefix="$" />
          <NumberField label="Labor Hours Per Lot" value={laborHoursPerLot} onChange={setLaborHoursPerLot} tooltip={TOOLTIPS.laborHoursPerLot} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="laborHoursPerLot" suffix="hours/lot" />
          <NumberField label="Team Members Per Preparation" value={people} onChange={setPeople} tooltip={TOOLTIPS.people} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="people" suffix="people" />
          <NumberField label="Fully Loaded Hourly Rate" value={hourlyRate} onChange={setHourlyRate} tooltip={TOOLTIPS.hourlyRate} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="hourlyRate" prefix="$" suffix="/hour" />
          <NumberField label="Samples Per Tech Per Hour" value={samplesPerHour} onChange={setSamplesPerHour} tooltip={TOOLTIPS.samplesPerHour} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="samplesPerHour" suffix="samples/hour" />
          <NumberField label="Revenue Per Test" value={revenuePerTest} onChange={setRevenuePerTest} tooltip={TOOLTIPS.revenuePerTest} activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} id="revenuePerTest" prefix="$" suffix="/test" />
        </div>
        </div>
      </section>

      {/* ============ STEP 2: THE NUMBERS (DARK NAVY + CANVAS NETWORK) ============ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: COLORS.denseNavy }}>
        {/* Canvas particle network */}
        <MoleculeNetwork density={32} lineColor={`rgb(164, 255, 235)`} dotColor={`rgba(255, 255, 255, 0.7)`} />

        {/* Floating real structures over the canvas */}
        <div className="absolute top-16 right-8 drift-1 opacity-25 pointer-events-none hidden md:block">
          <MorphineStructure stroke={COLORS.testingCyan} size={240} />
        </div>
        <div className="absolute bottom-16 left-8 drift-2 opacity-20 pointer-events-none hidden md:block">
          <XylazineStructure stroke={COLORS.expertGreen} size={220} />
        </div>

        <div className="relative px-6 md:px-16 py-24 md:py-36 max-w-7xl mx-auto z-10">
          <div className="mb-16 md:mb-24">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl md:text-7xl font-extralight leading-none" style={{ color: COLORS.expertGreen }}>02</span>
              <div className="h-px flex-1 max-w-24" style={{ backgroundColor: `${COLORS.cleanWhite}30` }} />
            </div>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight" style={{ color: COLORS.cleanWhite }}>
              Here's the rest of the math.
            </h2>
            <p className="text-base md:text-lg font-light mt-5 max-w-xl" style={{ color: `${COLORS.cleanWhite}B3` }}>
              Two numbers tell the story. What in-house QC costs you when everything is counted, and the revenue that same time could have generated if it went somewhere else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-16 md:mb-20">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase mb-8 font-semibold" style={{ color: COLORS.testingCyan }}>
                True Annual Cost
              </p>
              <p className="number-display text-6xl md:text-8xl font-extralight tracking-tighter mb-6" style={{ color: COLORS.cleanWhite }}>
                ${animatedTotal.toLocaleString('en-US')}
              </p>
              <p className="text-sm font-light leading-relaxed max-w-sm" style={{ color: `${COLORS.cleanWhite}B0` }}>
                Materials, labor, rework, compliance, and vendor management. All of it, across the year.
              </p>
            </div>

            <div className="md:border-l md:pl-16" style={{ borderColor: `${COLORS.cleanWhite}25` }}>
              <p className="text-xs tracking-[0.3em] uppercase mb-8 font-semibold" style={{ color: COLORS.expertGreen }}>
                Opportunity Cost
              </p>
              <p className="number-display text-6xl md:text-8xl font-extralight tracking-tighter mb-6" style={{ color: COLORS.cleanWhite }}>
                ${animatedOpp.toLocaleString('en-US')}
              </p>
              <p className="text-sm font-light leading-relaxed max-w-sm" style={{ color: `${COLORS.cleanWhite}B0` }}>
                Revenue your team could have generated if those <span style={{ color: COLORS.expertGreen, fontWeight: 500 }}>{results.totalQCHours.toLocaleString()} hours</span> went to billable testing.
              </p>
            </div>
          </div>

          <div className="relative p-8 md:p-10" style={{ border: `1px solid ${COLORS.sampleTeal}80`, backgroundColor: `${COLORS.sampleTeal}15`, backdropFilter: 'blur(8px)' }}>
            <div className="flex items-start gap-4">
              <Sparkles className="w-5 h-5 flex-shrink-0 mt-1" strokeWidth={1.5} style={{ color: COLORS.testingCyan }} />
              <div>
                <p className="text-sm tracking-widest uppercase mb-3 font-semibold" style={{ color: COLORS.testingCyan }}>Now compare</p>
                <p className="text-lg md:text-xl font-light leading-relaxed" style={{ color: COLORS.cleanWhite }}>
                  Hold these numbers up against what you've already calculated internally. <span style={{ color: COLORS.expertGreen, fontWeight: 500 }}>If there's a meaningful gap</span>, that's the conversation worth having.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STEP 3: LENS TOGGLE ============ */}
      <section className="relative px-6 md:px-16 py-24 md:py-32 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute bottom-12 right-4 drift-1 opacity-20 pointer-events-none hidden md:block">
          <FentanylStructure stroke={COLORS.sampleTeal} size={260} />
        </div>

        <div className="mb-12 md:mb-16 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl md:text-7xl font-extralight leading-none" style={{ color: COLORS.sampleTeal }}>03</span>
            <div className="h-px flex-1 max-w-24" style={{ backgroundColor: `${COLORS.denseNavy}25` }} />
          </div>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight" style={{ color: COLORS.denseNavy }}>
            Choose your lens.
          </h2>
          <p className="text-base md:text-lg font-light mt-5 max-w-xl" style={{ color: `${COLORS.denseNavy}A0` }}>
            Two ways to read these numbers. Pick whichever matches how you think about the cost of in-house operations.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-12 relative z-10">
          <button
            onClick={() => setFramingView('roi')}
            className="flex-1 text-left p-8 md:p-10 transition-all duration-500 group"
            style={{
              backgroundColor: framingView === 'roi' ? COLORS.denseNavy : 'transparent',
              border: `1px solid ${framingView === 'roi' ? COLORS.denseNavy : `${COLORS.denseNavy}30`}`,
              color: framingView === 'roi' ? COLORS.cleanWhite : COLORS.denseNavy
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-xs tracking-[0.25em] uppercase font-semibold" style={{ color: framingView === 'roi' ? COLORS.testingCyan : `${COLORS.denseNavy}70` }}>
                Lens A
              </p>
              {framingView === 'roi' && <div className="w-2 h-2 rounded-full pulse" style={{ backgroundColor: COLORS.testingCyan, boxShadow: `0 0 8px ${COLORS.testingCyan}` }} />}
            </div>
            <h3 className="text-2xl md:text-3xl font-light mb-3 tracking-tight">
              The ROI angle
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: framingView === 'roi' ? `${COLORS.cleanWhite}B0` : `${COLORS.denseNavy}90` }}>
              What could that labor produce if it went to billable testing?
            </p>
          </button>

          <button
            onClick={() => setFramingView('transparency')}
            className="flex-1 text-left p-8 md:p-10 transition-all duration-500 group"
            style={{
              backgroundColor: framingView === 'transparency' ? COLORS.denseNavy : 'transparent',
              border: `1px solid ${framingView === 'transparency' ? COLORS.denseNavy : `${COLORS.denseNavy}30`}`,
              color: framingView === 'transparency' ? COLORS.cleanWhite : COLORS.denseNavy
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-xs tracking-[0.25em] uppercase font-semibold" style={{ color: framingView === 'transparency' ? COLORS.expertGreen : `${COLORS.denseNavy}70` }}>
                Lens B
              </p>
              {framingView === 'transparency' && <div className="w-2 h-2 rounded-full pulse" style={{ backgroundColor: COLORS.expertGreen, boxShadow: `0 0 8px ${COLORS.expertGreen}` }} />}
            </div>
            <h3 className="text-2xl md:text-3xl font-light mb-3 tracking-tight">
              Cost transparency
            </h3>
            <p className="text-sm font-light leading-relaxed" style={{ color: framingView === 'transparency' ? `${COLORS.cleanWhite}B0` : `${COLORS.denseNavy}90` }}>
              Just the honest breakdown. Compare it to your own numbers.
            </p>
          </button>
        </div>

        <div className="max-w-3xl relative z-10">
          {framingView === 'roi' ? (
            <div className="fade-up space-y-5" key="roi">
              <p className="text-xl md:text-3xl font-light leading-snug" style={{ color: `${COLORS.denseNavy}B3` }}>
                Most labs count materials. Few count the hours redirected away from billable testing.
              </p>
              <p className="text-xl md:text-3xl font-light leading-snug" style={{ color: `${COLORS.denseNavy}B3` }}>
                Add those in. The true cost of in-house QC usually shows up as <span className="italic" style={{ color: COLORS.sampleTeal }}>two to three times</span> the materials-only number.
              </p>
              <p className="text-xl md:text-3xl font-light leading-snug" style={{ color: COLORS.denseNavy }}>
                For your lab, that's <span style={{ fontWeight: 500 }}>{results.samplesNotProcessed.toLocaleString()} samples</span> not processed this year. Those hours went somewhere else.
              </p>
            </div>
          ) : (
            <div className="fade-up space-y-5" key="transparency">
              <p className="text-xl md:text-3xl font-light leading-snug" style={{ color: `${COLORS.denseNavy}B3` }}>
                This is the cost when materials, labor, rework, compliance, and vendor/training overhead are <span className="italic" style={{ color: COLORS.sampleTeal }}>all counted</span>.
              </p>
              <p className="text-xl md:text-3xl font-light leading-snug" style={{ color: `${COLORS.denseNavy}B3` }}>
                Hold it up against the number you already had in your head.
              </p>
              <p className="text-xl md:text-3xl font-light leading-snug" style={{ color: COLORS.denseNavy }}>
                The gap between the two is the part <span style={{ fontWeight: 500 }}>worth thinking about.</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============ STEP 4: BREAKDOWN ============ */}
      <section className="relative px-6 md:px-16 py-24 md:py-32" style={{ backgroundColor: COLORS.qualityBlue + '40' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:mb-20">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl md:text-7xl font-extralight leading-none" style={{ color: COLORS.sampleTeal }}>04</span>
              <div className="h-px flex-1 max-w-24" style={{ backgroundColor: `${COLORS.denseNavy}25` }} />
            </div>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight" style={{ color: COLORS.denseNavy }}>
              Where it all adds up.
            </h2>
            <p className="text-base md:text-lg font-light mt-5 max-w-xl" style={{ color: `${COLORS.denseNavy}A0` }}>
              Four buckets, each grounded in published industry standards. Citations in the methodology section below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ backgroundColor: `${COLORS.denseNavy}15` }}>
            <BreakdownCell number="A" label="Direct" value={fmt(results.directCost)} description="Materials and labor across all lots prepared this year." citation="¹" accentColor={COLORS.sampleTeal} />
            <BreakdownCell number="B" label="Failure & Rework" value={fmt(results.failureCost)} description="Failed batches that need to be remade. Around 12% of lots, based on industry sigma data." citation="²" accentColor={COLORS.sampleTeal} />
            <BreakdownCell number="C" label="Compliance" value={fmt(results.complianceCost)} description="Audit prep, document retention, and CLIA/CAP documentation overhead." citation="³" accentColor={COLORS.expertGreen} />
            <BreakdownCell number="D" label="Vendor & Training" value={fmt(results.vendorTrainingCost)} description="Procurement, lot release, training records, and annual competency assessment." citation="⁴" accentColor={COLORS.expertGreen} />
          </div>
        </div>
      </section>

      {/* ============ STEP 5: CTAs ============ */}
      <section className="relative px-6 md:px-16 py-24 md:py-32 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute -top-8 left-4 drift-3 opacity-15 pointer-events-none hidden md:block">
          <MethamphetamineStructure stroke={COLORS.denseNavy} size={220} />
        </div>

        <div className="mb-16 md:mb-20 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl md:text-7xl font-extralight leading-none" style={{ color: COLORS.sampleTeal }}>05</span>
            <div className="h-px flex-1 max-w-24" style={{ backgroundColor: `${COLORS.denseNavy}25` }} />
          </div>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight" style={{ color: COLORS.denseNavy }}>
            Take this somewhere useful.
          </h2>
          <p className="text-base md:text-lg font-light mt-5 max-w-xl" style={{ color: `${COLORS.denseNavy}A0` }}>
            Talk through these numbers with your team, or have a conversation with us. Both options are no-pressure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 relative z-10">
          <a
            href="https://calendly.com/ahartmann-utak/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden p-10 md:p-12 transition-all duration-500 cursor-pointer block"
            style={{ backgroundColor: COLORS.denseNavy, color: COLORS.cleanWhite }}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-15 group-hover:opacity-25 transition-opacity duration-500" style={{ backgroundColor: COLORS.sampleTeal, filter: 'blur(20px)' }} />
            <div className="absolute top-8 right-8 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              <XylazineStructure stroke={COLORS.testingCyan} size={140} />
            </div>

            <Calendar className="w-7 h-7 mb-12 relative z-10" strokeWidth={1.2} style={{ color: COLORS.testingCyan }} />
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold relative z-10" style={{ color: COLORS.testingCyan }}>Option A · 30 min</p>
            <h3 className="text-2xl md:text-3xl font-light tracking-tight mb-5 relative z-10">
              Walk through it with Andrew
            </h3>
            <p className="text-sm font-light mb-10 max-w-sm leading-relaxed relative z-10" style={{ color: `${COLORS.cleanWhite}B3` }}>
              Bring whatever you've already calculated. We'll compare notes. No slides, no pitch. Just a working conversation about what fits in your scope.
            </p>
            <div className="flex items-center gap-3 transition-all duration-500 group-hover:gap-5 relative z-10">
              <span className="text-sm font-light tracking-wide">Book a time</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} style={{ color: COLORS.testingCyan }} />
            </div>
          </a>

          <button
            onClick={() => setEmailGateOpen(true)}
            className="group relative overflow-hidden p-10 md:p-12 transition-all duration-500 cursor-pointer text-left"
            style={{ backgroundColor: COLORS.cleanWhite, border: `1px solid ${COLORS.denseNavy}25` }}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-15 group-hover:opacity-25 transition-opacity duration-500" style={{ backgroundColor: COLORS.expertGreen, filter: 'blur(20px)' }} />
            <div className="absolute top-8 right-8 opacity-15 group-hover:opacity-25 transition-opacity duration-500">
              <MethamphetamineStructure stroke={COLORS.sampleTeal} size={140} />
            </div>

            <Mail className="w-7 h-7 mb-12 relative z-10" strokeWidth={1.2} style={{ color: COLORS.denseNavy }} />
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold relative z-10" style={{ color: `${COLORS.denseNavy}80` }}>Option B · Email</p>
            <h3 className="text-2xl md:text-3xl font-light tracking-tight mb-5 relative z-10" style={{ color: COLORS.denseNavy }}>
              Send the full breakdown
            </h3>
            <p className="text-sm font-light mb-10 max-w-sm leading-relaxed relative z-10" style={{ color: `${COLORS.denseNavy}A0` }}>
              We'll email a breakdown with your inputs, the calculations, and the full methodology. No newsletter signup. No follow-up unless you ask.
            </p>
            <div className="flex items-center gap-3 transition-all duration-500 group-hover:gap-5 relative z-10" style={{ color: COLORS.denseNavy }}>
              <span className="text-sm font-light tracking-wide">Send to my inbox</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </button>
        </div>
      </section>

      {/* ============ SOURCES & METHODOLOGY ============ */}
      <section className="relative px-6 md:px-16 py-20 md:py-24" style={{ backgroundColor: COLORS.qualityBlue + '40' }}>
        <div className="max-w-7xl mx-auto">
          <button onClick={() => setSourcesOpen(!sourcesOpen)} className="flex items-center justify-between w-full text-left group">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase mb-3 font-semibold" style={{ color: COLORS.sampleTeal }}>The Receipts</p>
              <h3 className="text-2xl md:text-3xl font-light tracking-tight" style={{ color: COLORS.denseNavy }}>
                Sources & methodology
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-light tracking-wider uppercase hidden md:inline" style={{ color: `${COLORS.denseNavy}70` }}>
                {sourcesOpen ? 'Close' : 'Show me'}
              </span>
              <ChevronDown className={`w-6 h-6 transition-transform duration-500 ${sourcesOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} style={{ color: COLORS.denseNavy }} />
            </div>
          </button>

          {sourcesOpen && (
            <div className="mt-12 grid md:grid-cols-2 gap-x-16 gap-y-12 fade-up">
              <SourceItem superscript="¹" title="Direct Cost" formula="Annual lots × (material cost + labor cost)" sources={['User-provided inputs. We trust your numbers here.']} />
              <SourceItem superscript="²" title="Failure & Rework (12%)" formula="Annual lots × 0.12 × (material cost + labor cost)" sources={[
                'Westgard JO, Westgard SA. Six Sigma Quality Design and Control. Westgard QC.',
                'Peer-reviewed Sigma metrics studies show ~26% of clinical chemistry test applications fall below three-sigma minimum performance. We use 12% as a conservative midpoint for in-house QC prep failure attributable to operator, reconstitution, and storage errors.',
                'Source: Westgard publications on lab sigma performance benchmarking.'
              ]} />
              <SourceItem superscript="³" title="Compliance (100 hrs/year)" formula="100 hours × fully loaded hourly rate" sources={[
                'CAP Laboratory Accreditation Program: biennial inspections, 3 to 4 month pre-inspection planning, advance document review, and ongoing checklist compliance.',
                'CLIA (42 CFR Part 493) documentation requirements including 2-year retention of temperature logs and corrective action records.',
                'Mid-point of 80 to 120 hours/year for QC-related compliance work in mid-size labs.'
              ]} />
              <SourceItem superscript="⁴" title="Vendor & Training" formula="(Preps × 6 hrs × people × rate) + (Preps × 6 hrs × rate)" sources={[
                'CLSI QMS03 Training and Competence Assessment, 4th Edition: framework for personnel competency.',
                'CLIA personnel competency requirements: semi-annual during first year, annual thereafter, covering six required evaluation methods per test system.',
                'Vendor management overhead estimated at 6 hours per preparation per year for procurement, receiving, lot release documentation, and expiration tracking.'
              ]} />
              <SourceItem superscript="⁵" title="Opportunity Cost" formula="(QC labor hrs + overhead hrs) × samples/hr × revenue/test" sources={[
                'Combines all QC-related labor and projects revenue impact if those hours were redirected to billable patient or client testing.',
                'Reimbursement defaults from CMS Clinical Laboratory Fee Schedule and industry norms by discipline.',
                'Throughput defaults from published LC-MS/MS and clinical chemistry workflow studies. Adjust to your actual throughput for accuracy.'
              ]} />
              <SourceItem superscript="⁶" title="Defaults & Disclaimers" formula="Pre-populated based on discipline + size" sources={[
                'Defaults are industry estimates intended as starting points. The calculator is designed to be edited.',
                'We recommend overriding every field with your own numbers where available.',
                'Defaults are not lab-specific recommendations. Use them as anchors, not answers.'
              ]} />
            </div>
          )}
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="px-6 md:px-16 py-12" style={{ backgroundColor: COLORS.denseNavy, color: `${COLORS.cleanWhite}80` }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full pulse" style={{ backgroundColor: COLORS.expertGreen, boxShadow: `0 0 12px ${COLORS.expertGreen}` }} />
            <div>
              <p className="text-xs font-light leading-relaxed">
                <span style={{ color: COLORS.cleanWhite, fontWeight: 600, letterSpacing: '0.1em' }}>REAL</span>
                <span className="italic ml-1.5" style={{ color: COLORS.sampleTeal, fontWeight: 300 }}>x</span>
                <span style={{ color: `${COLORS.cleanWhite}60` }}> · The variable you haven't counted.</span>
              </p>
              <p className="text-[10px] font-light mt-1" style={{ color: `${COLORS.cleanWhite}50` }}>
                A tool by UTAK Laboratories · Control Made Simple™ · Valencia, CA · Since 1971
              </p>
            </div>
          </div>
          <p className="text-xs font-light">
            v5 · Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </footer>

      {/* ============ EMAIL GATE MODAL ============ */}
      {emailGateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md px-6" style={{ backgroundColor: `${COLORS.denseNavy}80` }}>
          <div className="relative max-w-md w-full p-10 md:p-12 fade-up" style={{ backgroundColor: COLORS.pureBase }}>
            <button onClick={() => { setEmailGateOpen(false); setEmailSubmitted(false); setEmailValue(''); }} className="absolute top-6 right-6 transition-opacity hover:opacity-60" style={{ color: COLORS.denseNavy }}>
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {!emailSubmitted ? (
              <>
                <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: COLORS.sampleTeal }}>Almost there</p>
                <h3 className="text-2xl md:text-3xl font-light tracking-tight mb-4" style={{ color: COLORS.denseNavy }}>
                  Where should we send it?
                </h3>
                <p className="text-sm font-light mb-10 leading-relaxed" style={{ color: `${COLORS.denseNavy}A0` }}>
                  We'll email the full breakdown with your inputs and our methodology. No newsletter, no follow-up unless you ask for it.
                </p>
                <input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} placeholder="you@yourlab.com" className="w-full text-base font-light outline-none py-3 mb-10 bg-transparent" style={{ color: COLORS.denseNavy, borderBottom: `1px solid ${COLORS.denseNavy}40` }} />
                <button onClick={handleHubSpotSubmit} className="w-full flex items-center justify-center gap-3 py-4 transition-all hover:gap-5 group" style={{ backgroundColor: COLORS.denseNavy, color: COLORS.cleanWhite }}>
                  <span className="text-sm font-light tracking-wide">Send my analysis</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} style={{ color: COLORS.testingCyan }} />
                </button>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-8" style={{ backgroundColor: `${COLORS.expertGreen}30` }}>
                  <Check className="w-5 h-5" strokeWidth={1.5} style={{ color: COLORS.expertGreen }} />
                </div>
                <h3 className="text-2xl md:text-3xl font-light tracking-tight mb-4" style={{ color: COLORS.denseNavy }}>
                  On its way.
                </h3>
                <p className="text-sm font-light mb-10 leading-relaxed" style={{ color: `${COLORS.denseNavy}A0` }}>
                  Check your inbox in the next few minutes. If you'd rather talk through it, Andrew is happy to walk through your numbers.
                </p>
                <button onClick={() => { setEmailGateOpen(false); setEmailSubmitted(false); setEmailValue(''); }} className="text-sm font-light transition-opacity hover:opacity-60" style={{ color: COLORS.denseNavy }}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function NumberField({ label, value, onChange, tooltip, activeTooltip, setActiveTooltip, id, prefix, suffix }) {
  const isActive = activeTooltip === id;
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs tracking-[0.25em] uppercase font-semibold" style={{ color: `${COLORS.denseNavy}90` }}>{label}</label>
        <button onClick={() => setActiveTooltip(isActive ? null : id)} onMouseEnter={() => setActiveTooltip(id)} onMouseLeave={() => setActiveTooltip(null)} className="transition-colors hover:opacity-60" style={{ color: COLORS.sampleTeal }}>
          <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex items-baseline transition-colors py-2" style={{ borderBottom: `1px solid ${COLORS.denseNavy}30` }}>
        {prefix && <span className="text-2xl md:text-3xl font-extralight mr-2" style={{ color: `${COLORS.denseNavy}60` }}>{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="flex-1 text-2xl md:text-3xl font-light outline-none bg-transparent number-display min-w-0" style={{ color: COLORS.denseNavy }} />
        {suffix && <span className="text-sm font-light ml-3" style={{ color: `${COLORS.denseNavy}70` }}>{suffix}</span>}
      </div>
      {isActive && (
        <div className="absolute top-full left-0 right-0 mt-3 p-4 text-xs font-light leading-relaxed z-20 fade-up shadow-lg" style={{ backgroundColor: COLORS.denseNavy, color: COLORS.cleanWhite, borderLeft: `2px solid ${COLORS.sampleTeal}` }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, tooltip, activeTooltip, setActiveTooltip, id, children }) {
  const isActive = activeTooltip === id;
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs tracking-[0.25em] uppercase font-semibold" style={{ color: `${COLORS.denseNavy}90` }}>{label}</label>
        <button onClick={() => setActiveTooltip(isActive ? null : id)} onMouseEnter={() => setActiveTooltip(id)} onMouseLeave={() => setActiveTooltip(null)} className="transition-colors hover:opacity-60" style={{ color: COLORS.sampleTeal }}>
          <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="relative transition-colors py-2" style={{ borderBottom: `1px solid ${COLORS.denseNavy}30` }}>
        <select value={value} onChange={onChange} className="w-full text-2xl md:text-3xl font-light outline-none bg-transparent appearance-none pr-10 cursor-pointer" style={{ color: COLORS.denseNavy }}>
          {children}
        </select>
        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" strokeWidth={1.2} style={{ color: `${COLORS.denseNavy}60` }} />
      </div>
      {isActive && (
        <div className="absolute top-full left-0 right-0 mt-3 p-4 text-xs font-light leading-relaxed z-20 fade-up shadow-lg" style={{ backgroundColor: COLORS.denseNavy, color: COLORS.cleanWhite, borderLeft: `2px solid ${COLORS.sampleTeal}` }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

function BreakdownCell({ number, label, value, description, citation, accentColor }) {
  return (
    <div className="p-8 md:p-10 lg:p-12 transition-all duration-500 group hover:translate-y-[-2px]" style={{ backgroundColor: COLORS.pureBase }}>
      <div className="flex items-center justify-between mb-8">
        <span className="text-3xl font-extralight" style={{ color: accentColor }}>{number}</span>
        <div className="w-8 h-px transition-all duration-500 group-hover:w-12" style={{ backgroundColor: accentColor }} />
      </div>
      <p className="text-xs tracking-[0.25em] uppercase mb-4 font-semibold" style={{ color: `${COLORS.denseNavy}A0` }}>
        {label}<span className="ml-1" style={{ color: `${COLORS.denseNavy}50` }}>{citation}</span>
      </p>
      <p className="number-display text-3xl md:text-4xl font-light tracking-tight mb-6" style={{ color: COLORS.denseNavy }}>
        {value}
      </p>
      <p className="text-xs font-light leading-relaxed" style={{ color: `${COLORS.denseNavy}90` }}>
        {description}
      </p>
    </div>
  );
}

function SourceItem({ superscript, title, formula, sources }) {
  return (
    <div>
      <p className="text-xs tracking-[0.3em] uppercase mb-3 font-semibold" style={{ color: COLORS.denseNavy }}>
        <span className="mr-2" style={{ color: COLORS.sampleTeal }}>{superscript}</span>{title}
      </p>
      <p className="text-sm font-light mb-4 leading-relaxed" style={{ color: COLORS.denseNavy }}>
        <span className="mr-2" style={{ color: `${COLORS.denseNavy}70` }}>Formula:</span>
        {formula}
      </p>
      <ul className="space-y-2">
        {sources.map((s, i) => (
          <li key={i} className="text-xs font-light leading-relaxed" style={{ color: `${COLORS.denseNavy}90` }}>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
