import React, { useState, useMemo } from 'react';

// 2026년 기준 4대보험 요율 (근로자 부담분)
const INSURANCE_RATES_2026 = {
  nationalPension: 0.0475,
  healthInsurance: 0.03595,
  longTermCareRate: 0.1314,
  employmentInsurance: 0.009,
};

// 국민연금 상하한액 (2026년 기준)
const PENSION_LIMITS = {
  min: 400000,
  max: 6370000,
};

// 소득세 과세표준 구간 (2026년 기준)
const TAX_BRACKETS = [
  { min: 0, max: 14000000, rate: 6, deduction: 0 },
  { min: 14000000, max: 50000000, rate: 15, deduction: 1260000 },
  { min: 50000000, max: 88000000, rate: 24, deduction: 5760000 },
  { min: 88000000, max: 150000000, rate: 35, deduction: 15440000 },
  { min: 150000000, max: 300000000, rate: 38, deduction: 19940000 },
  { min: 300000000, max: 500000000, rate: 40, deduction: 25940000 },
  { min: 500000000, max: 1000000000, rate: 42, deduction: 35940000 },
  { min: 1000000000, max: Infinity, rate: 45, deduction: 65940000 },
];

// 근로소득 간이세액표 기반 소득세 계산
const getMonthlyIncomeTax = (monthlyGross, dependents = 1) => {
  const annual = monthlyGross * 12;
  
  let earnedIncomeDeduction = 0;
  if (annual <= 5000000) {
    earnedIncomeDeduction = annual * 0.7;
  } else if (annual <= 15000000) {
    earnedIncomeDeduction = 3500000 + (annual - 5000000) * 0.4;
  } else if (annual <= 45000000) {
    earnedIncomeDeduction = 7500000 + (annual - 15000000) * 0.15;
  } else if (annual <= 100000000) {
    earnedIncomeDeduction = 12000000 + (annual - 45000000) * 0.05;
  } else {
    earnedIncomeDeduction = 14750000 + (annual - 100000000) * 0.02;
  }
  
  const basicDeduction = 1500000 * dependents;
  const standardDeduction = 130000;
  const taxableIncome = Math.max(0, annual - earnedIncomeDeduction - basicDeduction);
  
  let tax = 0;
  if (taxableIncome <= 14000000) {
    tax = taxableIncome * 0.06;
  } else if (taxableIncome <= 50000000) {
    tax = 840000 + (taxableIncome - 14000000) * 0.15;
  } else if (taxableIncome <= 88000000) {
    tax = 6240000 + (taxableIncome - 50000000) * 0.24;
  } else if (taxableIncome <= 150000000) {
    tax = 15360000 + (taxableIncome - 88000000) * 0.35;
  } else if (taxableIncome <= 300000000) {
    tax = 37060000 + (taxableIncome - 150000000) * 0.38;
  } else if (taxableIncome <= 500000000) {
    tax = 94060000 + (taxableIncome - 300000000) * 0.40;
  } else if (taxableIncome <= 1000000000) {
    tax = 174060000 + (taxableIncome - 500000000) * 0.42;
  } else {
    tax = 384060000 + (taxableIncome - 1000000000) * 0.45;
  }
  
  tax = Math.max(0, tax - standardDeduction);
  return Math.floor(tax / 12 / 10) * 10;
};

// 과세표준 계산
const getTaxableIncome = (monthlyGross, dependents = 1) => {
  const annual = monthlyGross * 12;
  
  let earnedIncomeDeduction = 0;
  if (annual <= 5000000) {
    earnedIncomeDeduction = annual * 0.7;
  } else if (annual <= 15000000) {
    earnedIncomeDeduction = 3500000 + (annual - 5000000) * 0.4;
  } else if (annual <= 45000000) {
    earnedIncomeDeduction = 7500000 + (annual - 15000000) * 0.15;
  } else if (annual <= 100000000) {
    earnedIncomeDeduction = 12000000 + (annual - 45000000) * 0.05;
  } else {
    earnedIncomeDeduction = 14750000 + (annual - 100000000) * 0.02;
  }
  
  const basicDeduction = 1500000 * dependents;
  return Math.max(0, annual - earnedIncomeDeduction - basicDeduction);
};

// 해당 과세표준의 세율 구간 찾기
const getTaxBracket = (taxableIncome) => {
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.max) {
      return bracket;
    }
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1];
};

export default function App() {
  const [mode, setMode] = useState('annual');
  const [customSalary, setCustomSalary] = useState('');
  const [dependents, setDependents] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [rangeSteps, setRangeSteps] = useState(10);

  const calculateNetSalary = (monthlySalary) => {
    const pensionBase = Math.min(Math.max(monthlySalary, PENSION_LIMITS.min), PENSION_LIMITS.max);
    const nationalPension = Math.floor(pensionBase * INSURANCE_RATES_2026.nationalPension / 10) * 10;
    const healthInsurance = Math.floor(monthlySalary * INSURANCE_RATES_2026.healthInsurance / 10) * 10;
    const longTermCare = Math.floor(healthInsurance * INSURANCE_RATES_2026.longTermCareRate / 10) * 10;
    const employmentInsurance = Math.floor(monthlySalary * INSURANCE_RATES_2026.employmentInsurance / 10) * 10;
    
    const totalInsurance = nationalPension + healthInsurance + longTermCare + employmentInsurance;
    const incomeTax = getMonthlyIncomeTax(monthlySalary, dependents);
    const localTax = Math.floor(incomeTax * 0.1);
    
    const totalDeduction = totalInsurance + incomeTax + localTax;
    const netSalary = monthlySalary - totalDeduction;
    
    const taxableIncome = getTaxableIncome(monthlySalary, dependents);
    const taxBracket = getTaxBracket(taxableIncome);
    
    const pct = (val) => monthlySalary > 0 ? ((val / monthlySalary) * 100).toFixed(2) : '0';
    
    return {
      grossMonthly: monthlySalary,
      grossAnnual: monthlySalary * 12,
      nationalPension,
      healthInsurance,
      longTermCare,
      employmentInsurance,
      totalInsurance,
      incomeTax,
      localTax,
      totalDeduction,
      netMonthly: netSalary,
      netAnnual: netSalary * 12,
      taxableIncome,
      taxBracket,
      netPct: pct(netSalary),
      deductionPct: pct(totalDeduction),
      nationalPensionPct: pct(nationalPension),
      healthInsurancePct: pct(healthInsurance),
      longTermCarePct: pct(longTermCare),
      employmentInsurancePct: pct(employmentInsurance),
      incomeTaxPct: pct(incomeTax),
      localTaxPct: pct(localTax),
    };
  };

  // 연봉 구간: 1000만~1억5천(기존) + 1.75억~3억(2500만 단위) + 3.5억~5억(5000만 단위)
  const defaultAnnualLevels = [
    // 1000만 ~ 2900만 (100만원 단위)
    10000000, 11000000, 12000000, 13000000, 14000000, 15000000, 16000000, 17000000, 18000000, 19000000,
    20000000, 21000000, 22000000, 23000000, 24000000, 25000000, 26000000, 27000000, 28000000, 29000000,
    // 3000만 ~ 3900만 (100만원 단위)
    30000000, 31000000, 32000000, 33000000, 34000000, 35000000, 36000000, 37000000, 38000000, 39000000,
    // 4000만 ~ 4800만 (200만원 단위)
    40000000, 42000000, 44000000, 46000000, 48000000,
    // 5000만 ~ 5800만 (200만원 단위)
    50000000, 52000000, 54000000, 56000000, 58000000,
    // 6000만 ~ 6800만 (200만원 단위)
    60000000, 62000000, 64000000, 66000000, 68000000,
    // 7000만 ~ 9500만 (500만원 단위)
    70000000, 75000000, 80000000, 85000000, 90000000, 95000000,
    // 1억 ~ 1.5억 (1000만원 단위)
    100000000, 110000000, 120000000, 130000000, 140000000, 150000000,
    // 1.75억 ~ 3억 (2500만원 단위)
    175000000, 200000000, 225000000, 250000000, 275000000, 300000000,
    // 3.5억 ~ 5억 (5000만원 단위)
    350000000, 400000000, 450000000, 500000000,
  ];
  
  const generateCustomRange = () => {
    const min = parseInt(rangeMin.replace(/,/g, '')) || 0;
    const max = parseInt(rangeMax.replace(/,/g, '')) || 0;
    if (min <= 0 || max <= 0 || min >= max) return [];
    const minAnnual = mode === 'monthly' ? min * 12 : min;
    const maxAnnual = mode === 'monthly' ? max * 12 : max;
    const step = (maxAnnual - minAnnual) / (rangeSteps - 1);
    return Array.from({ length: rangeSteps }, (_, i) => Math.round(minAnnual + step * i));
  };

  const annualLevels = useMemo(() => {
    if (useCustomRange) {
      const custom = generateCustomRange();
      return custom.length > 0 ? custom : defaultAnnualLevels;
    }
    return defaultAnnualLevels;
  }, [useCustomRange, rangeMin, rangeMax, rangeSteps, mode]);
  
  const tableData = useMemo(() => {
    return annualLevels.map(annual => calculateNetSalary(Math.round(annual / 12)));
  }, [annualLevels, dependents]);

  const customResult = useMemo(() => {
    const inputValue = parseInt(customSalary.replace(/,/g, '')) || 0;
    if (inputValue <= 0) return null;
    const monthlySalary = mode === 'annual' ? Math.round(inputValue / 12) : inputValue;
    return calculateNetSalary(monthlySalary);
  }, [customSalary, mode, dependents]);

  const formatNumber = (num) => num.toLocaleString('ko-KR');
  const formatInput = (value) => {
    const num = value.replace(/[^\d]/g, '');
    return num ? parseInt(num).toLocaleString('ko-KR') : '';
  };
  
  const formatSalary = (amount) => {
    if (mode === 'annual' || mode === 'tax') {
      const man = amount / 10000;
      if (man >= 10000) {
        const uk = Math.floor(man / 10000);
        const remain = man % 10000;
        if (remain === 0) {
          return `${uk}억원`;
        }
        return `${uk}억 ${formatNumber(remain)}만원`;
      }
      return `${formatNumber(man)}만원`;
    }
    return `${formatNumber(amount)}원`;
  };

  const formatTaxBracketMax = (max) => {
    if (max === Infinity) return '초과';
    return `${formatNumber(max / 10000)}만원`;
  };

  const displayGross = (row) => (mode === 'annual' || mode === 'tax') ? row.grossAnnual : row.grossMonthly;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            💰 2026년 연봉 실수령액 계산기
          </h1>
          <p className="text-slate-400 text-sm">
            2026년 기준 · 국민연금 4.75% · 건강보험 3.595% · 장기요양 13.14% · 고용보험 0.9%
          </p>
        </div>

        {/* Mode Toggle - 3 tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 rounded-xl p-1 inline-flex">
            <button
              onClick={() => setMode('annual')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                mode === 'annual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              연봉 기준
            </button>
            <button
              onClick={() => setMode('monthly')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                mode === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              월급 기준
            </button>
            <button
              onClick={() => setMode('tax')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                mode === 'tax' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              과표 구간
            </button>
          </div>
        </div>

        {/* Tax Bracket Info - Show when tax mode */}
        {mode === 'tax' && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 mb-8 border border-purple-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">📋 2026년 소득세 과세표준 구간</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">과세표준</th>
                    <th className="text-center py-3 px-3 text-slate-400 font-medium">세율</th>
                    <th className="text-right py-3 px-3 text-slate-400 font-medium">누진공제</th>
                    <th className="text-right py-3 px-3 text-slate-400 font-medium">산출세액 계산</th>
                  </tr>
                </thead>
                <tbody>
                  {TAX_BRACKETS.map((bracket, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-3 text-white">
                        {idx === 0 
                          ? `${formatNumber(bracket.max / 10000)}만원 이하`
                          : bracket.max === Infinity 
                            ? `${formatNumber(bracket.min / 10000)}만원 초과`
                            : `${formatNumber(bracket.min / 10000)}만원 ~ ${formatNumber(bracket.max / 10000)}만원`
                        }
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          bracket.rate <= 15 ? 'bg-green-900/50 text-green-400' :
                          bracket.rate <= 24 ? 'bg-yellow-900/50 text-yellow-400' :
                          bracket.rate <= 35 ? 'bg-orange-900/50 text-orange-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {bracket.rate}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-3 text-slate-300">
                        {bracket.deduction > 0 ? `${formatNumber(bracket.deduction)}원` : '-'}
                      </td>
                      <td className="text-right py-3 px-3 text-slate-400 text-xs">
                        과세표준 × {bracket.rate}% - {formatNumber(bracket.deduction)}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              ※ 지방소득세는 소득세의 10%가 추가로 부과됩니다
            </p>
          </div>
        )}

        {/* Custom Input Section */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">⚙️ 나의 {mode === 'monthly' ? '월급' : '연봉'} 입력</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">{mode === 'monthly' ? '월 급여 (세전)' : '연봉 (세전)'}</label>
              <div className="relative">
                <input
                  type="text"
                  value={customSalary}
                  onChange={(e) => setCustomSalary(formatInput(e.target.value))}
                  placeholder={mode === 'monthly' ? '4,166,666' : '50,000,000'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">원</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">부양가족 수 (본인 포함)</label>
              <select
                value={dependents}
                onChange={(e) => setDependents(parseInt(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n}명</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <a 
                href="https://www.nts.go.kr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg px-4 py-3 text-center text-sm transition-colors"
              >
                국세청 홈택스 →
              </a>
            </div>
          </div>

          {/* Custom Result */}
          {customResult && (
            <div className="mt-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-sm">세전 {mode === 'monthly' ? '월급' : '연봉'}</p>
                  <p className="text-xl font-bold text-white">{formatNumber(mode === 'monthly' ? customResult.grossMonthly : customResult.grossAnnual)}원</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">월 실수령액</p>
                  <p className="text-xl font-bold text-green-400">{formatNumber(customResult.netMonthly)}원</p>
                  <p className="text-green-500 text-xs">({customResult.netPct}%)</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">월 공제액</p>
                  <p className="text-xl font-bold text-red-400">{formatNumber(customResult.totalDeduction)}원</p>
                  <p className="text-red-500 text-xs">({customResult.deductionPct}%)</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">과세표준</p>
                  <p className="text-xl font-bold text-purple-400">{formatNumber(customResult.taxableIncome)}원</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">적용 세율</p>
                  <p className="text-xl font-bold text-orange-400">{customResult.taxBracket.rate}%</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-600/50">
                <p className="text-slate-400 text-xs mb-2">월별 공제 상세</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <p className="text-slate-500 text-xs">국민연금</p>
                    <p className="text-slate-300">{formatNumber(customResult.nationalPension)}</p>
                    <p className="text-slate-500 text-xs">({customResult.nationalPensionPct}%)</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <p className="text-slate-500 text-xs">건강보험</p>
                    <p className="text-slate-300">{formatNumber(customResult.healthInsurance)}</p>
                    <p className="text-slate-500 text-xs">({customResult.healthInsurancePct}%)</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <p className="text-slate-500 text-xs">장기요양</p>
                    <p className="text-slate-300">{formatNumber(customResult.longTermCare)}</p>
                    <p className="text-slate-500 text-xs">({customResult.longTermCarePct}%)</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <p className="text-slate-500 text-xs">고용보험</p>
                    <p className="text-slate-300">{formatNumber(customResult.employmentInsurance)}</p>
                    <p className="text-slate-500 text-xs">({customResult.employmentInsurancePct}%)</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <p className="text-slate-500 text-xs">소득세</p>
                    <p className="text-slate-300">{formatNumber(customResult.incomeTax)}</p>
                    <p className="text-slate-500 text-xs">({customResult.incomeTaxPct}%)</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <p className="text-slate-500 text-xs">지방소득세</p>
                    <p className="text-slate-300">{formatNumber(customResult.localTax)}</p>
                    <p className="text-slate-500 text-xs">({customResult.localTaxPct}%)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Salary Table */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-white">
              📊 {mode === 'tax' ? '연봉별 과세표준 & 적용세율' : `${mode === 'monthly' ? '월급' : '연봉'} 실수령액 표`}
            </h2>
            
            <div className="flex gap-2 flex-wrap">
              {mode !== 'tax' && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showDetails ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {showDetails ? '✓ 세부 항목' : '세부 항목'}
                </button>
              )}
              <button
                onClick={() => setUseCustomRange(!useCustomRange)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  useCustomRange ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {useCustomRange ? '✓ 구간 설정' : '구간 설정'}
              </button>
            </div>
          </div>

          {/* Custom Range Settings */}
          {useCustomRange && (
            <div className="bg-slate-700/30 rounded-xl p-4 mb-4 border border-slate-600/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">최소 {mode === 'monthly' ? '월급' : '연봉'}</label>
                  <input
                    type="text"
                    value={rangeMin}
                    onChange={(e) => setRangeMin(formatInput(e.target.value))}
                    placeholder={mode === 'monthly' ? '2,500,000' : '30,000,000'}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">최대 {mode === 'monthly' ? '월급' : '연봉'}</label>
                  <input
                    type="text"
                    value={rangeMax}
                    onChange={(e) => setRangeMax(formatInput(e.target.value))}
                    placeholder={mode === 'monthly' ? '8,333,333' : '100,000,000'}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">구간 수</label>
                  <select
                    value={rangeSteps}
                    onChange={(e) => setRangeSteps(parseInt(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {[5, 8, 10, 12, 15, 20].map(n => (
                      <option key={n} value={n}>{n}개</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setRangeMin(''); setRangeMax(''); setRangeSteps(10); }}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-2 text-slate-400 font-medium sticky left-0 bg-slate-800/90">
                    {mode === 'monthly' ? '월급' : '연봉'}
                  </th>
                  {mode === 'tax' ? (
                    <>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">과세표준</th>
                      <th className="text-center py-3 px-2 text-slate-400 font-medium">적용세율</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">연 소득세</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">연 지방소득세</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">월 실수령액</th>
                    </>
                  ) : (
                    <>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        <div>실수령액</div>
                        <div className="text-xs font-normal">(비율)</div>
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        <div>공제액계</div>
                        <div className="text-xs font-normal">(비율)</div>
                      </th>
                      {showDetails && (
                        <>
                          <th className="text-right py-3 px-2 text-slate-400 font-medium">국민연금</th>
                          <th className="text-right py-3 px-2 text-slate-400 font-medium">건강보험</th>
                          <th className="text-right py-3 px-2 text-slate-400 font-medium">장기요양</th>
                          <th className="text-right py-3 px-2 text-slate-400 font-medium">고용보험</th>
                          <th className="text-right py-3 px-2 text-slate-400 font-medium">소득세</th>
                          <th className="text-right py-3 px-2 text-slate-400 font-medium">지방소득세</th>
                        </>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 px-2 text-white font-medium sticky left-0 bg-slate-800/90">
                      {formatSalary(displayGross(row))}
                    </td>
                    {mode === 'tax' ? (
                      <>
                        <td className="text-right py-2.5 px-2 text-purple-400">
                          {formatNumber(row.taxableIncome / 10000)}만원
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            row.taxBracket.rate <= 15 ? 'bg-green-900/50 text-green-400' :
                            row.taxBracket.rate <= 24 ? 'bg-yellow-900/50 text-yellow-400' :
                            row.taxBracket.rate <= 35 ? 'bg-orange-900/50 text-orange-400' :
                            'bg-red-900/50 text-red-400'
                          }`}>
                            {row.taxBracket.rate}%
                          </span>
                        </td>
                        <td className="text-right py-2.5 px-2 text-slate-300">
                          {formatNumber(row.incomeTax * 12)}원
                        </td>
                        <td className="text-right py-2.5 px-2 text-slate-300">
                          {formatNumber(row.localTax * 12)}원
                        </td>
                        <td className="text-right py-2.5 px-2 text-green-400 font-semibold">
                          {formatNumber(row.netMonthly)}원
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-right py-2.5 px-2">
                          <div className="text-green-400 font-semibold">{formatNumber(row.netMonthly)}</div>
                          <div className="text-green-500 text-xs">({row.netPct}%)</div>
                        </td>
                        <td className="text-right py-2.5 px-2">
                          <div className="text-red-400">{formatNumber(row.totalDeduction)}</div>
                          <div className="text-red-500 text-xs">({row.deductionPct}%)</div>
                        </td>
                        {showDetails && (
                          <>
                            <td className="text-right py-2.5 px-2">
                              <div className="text-slate-300">{formatNumber(row.nationalPension)}</div>
                              <div className="text-slate-500 text-xs">({row.nationalPensionPct}%)</div>
                            </td>
                            <td className="text-right py-2.5 px-2">
                              <div className="text-slate-300">{formatNumber(row.healthInsurance)}</div>
                              <div className="text-slate-500 text-xs">({row.healthInsurancePct}%)</div>
                            </td>
                            <td className="text-right py-2.5 px-2">
                              <div className="text-slate-300">{formatNumber(row.longTermCare)}</div>
                              <div className="text-slate-500 text-xs">({row.longTermCarePct}%)</div>
                            </td>
                            <td className="text-right py-2.5 px-2">
                              <div className="text-slate-300">{formatNumber(row.employmentInsurance)}</div>
                              <div className="text-slate-500 text-xs">({row.employmentInsurancePct}%)</div>
                            </td>
                            <td className="text-right py-2.5 px-2">
                              <div className="text-slate-300">{formatNumber(row.incomeTax)}</div>
                              <div className="text-slate-500 text-xs">({row.incomeTaxPct}%)</div>
                            </td>
                            <td className="text-right py-2.5 px-2">
                              <div className="text-slate-300">{formatNumber(row.localTax)}</div>
                              <div className="text-slate-500 text-xs">({row.localTaxPct}%)</div>
                            </td>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-slate-300 font-medium mb-2 text-sm">📌 참고사항</h3>
          <ul className="text-slate-500 text-xs space-y-1">
            <li>• <span className="text-slate-400">2026년 4대보험 요율</span>: 국민연금 9.5%(근로자 4.75%), 건강보험 7.19%(근로자 3.595%), 장기요양 0.9448%, 고용보험 1.8%(근로자 0.9%)</li>
            <li>• 국민연금 기준소득월액: 최저 40만원 ~ 최고 637만원</li>
            <li>• 소득세는 간이세액표 기준이며, 연말정산 결과에 따라 달라질 수 있습니다</li>
            <li>• 비과세 수당 미포함, 기본급 외 수당 미포함</li>
          </ul>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          2026년 기준 · 참고용 계산기 · 정확한 금액은 급여담당자에게 문의하세요
        </p>
      </div>
    </div>
  );
}
