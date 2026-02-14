# 2026년 연봉 실수령액 계산기 💰

2026년 기준 4대보험 및 소득세를 반영한 연봉/월급 실수령액 계산기입니다.

## 🔗 바로가기
👉 [계산기 사용하기](https://YOUR_USERNAME.github.io/salary-calculator-2026)

## ✨ 기능

- **연봉/월급 기준** 실수령액 계산
- **과표 구간** 확인 (소득세 세율표)
- **4대보험** 상세 공제 내역 (국민연금, 건강보험, 장기요양, 고용보험)
- **소득세 + 지방소득세** 계산
- **공제율(%)** 표시
- **커스텀 구간 설정** 기능

## 📊 2026년 적용 요율

| 항목 | 전체 요율 | 근로자 부담 |
|------|----------|------------|
| 국민연금 | 9.5% | 4.75% |
| 건강보험 | 7.19% | 3.595% |
| 장기요양 | 0.9448% | (건강보험의 13.14%) |
| 고용보험 | 1.8% | 0.9% |

## 🚀 배포 방법

### 1. 저장소 Fork 또는 Clone

```bash
git clone https://github.com/YOUR_USERNAME/salary-calculator-2026.git
cd salary-calculator-2026
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 로컬 실행

```bash
npm start
```

### 4. GitHub Pages 배포

```bash
npm run deploy
```

## 📝 설정 변경

`package.json`에서 `homepage` 값을 본인의 GitHub 사용자명으로 변경하세요:

```json
"homepage": "https://YOUR_USERNAME.github.io/salary-calculator-2026"
```

## ⚠️ 주의사항

- 본 계산기는 **참고용**이며, 실제 금액과 차이가 있을 수 있습니다
- 비과세 수당, 성과급 등은 미포함
- 정확한 금액은 급여담당자 또는 국세청에 문의하세요

## 📜 라이선스

MIT License
