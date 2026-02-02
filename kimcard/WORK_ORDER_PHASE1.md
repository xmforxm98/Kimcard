# 📋 개발 작업 지시서: RE:ACTIVE Phase 1 - Core Engine

**작성일**: 2026-02-02  
**상태**: 🟡 진행 예정 (Ready for Dev)  
**담당**: 코딩 에이전트  

---

## 1. 개요 (Objective)

**목표**: 확장 가능한 Monorepo 구조를 세팅하고, 4단계 레이어(Layered) 구조를 갖춘 `Card` 컴포넌트의 기본기 구현.

Phase 0(PoC)에서 검증된 `Sheen Effect` 등의 쉐이더 기술을 **Effects 레이어**로 편입시키고, 사용자가 자연어(Prop)로 배경, 캐릭터, 포즈, 이펙트를 조립할 수 있는 기반을 마련한다.

---

## 2. 작업 상세 (Tasks)

### ✅ Task 1: Monorepo 구조 세팅

**경로**: `/` (Root)

- [ ] **PNPM Workspace 설정**:
  - `pnpm-workspace.yaml` 작성
  - `/packages/core`: 라이브러리 본체 (NPM 배포용)
  - `/packages/demo`: 쇼케이스 및 테스트용 앱 (Next.js or Vite)
  - `/packages/assets` (Optional): 공용 에셋 관리
- [ ] **Config 공유**: TypeScript, ESLint, Tailwind 설정 공유 구조

### ✅ Task 2: Core Library 구현 (Visual Polish 강화)

**경로**: `/packages/core`

- [ ] **Design System (Elemental Themes)**:
  - Tailwind Prefix 설정
  - **Color Palette**: 5대 속성 전용 Neon Color 정의:
    - 🔥 **Fire**: Amber-500 ~ Red-600
    - ❄️ **Ice**: Cyan-400 ~ Blue-500
    - ⚡ **Volt**: Yellow-400 ~ Violet-500 (Cyberpunk)
    - 🌿 **Earth**: Emerald-400 ~ Lime-500
    - 🌑 **Void**: Fuchsia-500 ~ Slate-900
- [ ] **Card Component Architecture**:
  - **Theme Prop**: `<Card element="fire" />` 하나로 테두리, 그림자색, 폰트가 자동 결정되는 구조.
  - **Core VFX (Live Effects)**:
    - **정적 이미지 금지**: 모든 Effect 레이어는 호흡(Pulse)하거나 움직여야 함.
    - **Element VFX**:
      - 🔥 Fire: `bottom-to-top`으로 올라가는 열기 이펙트 (CSS Animation)
      - ⚡ Volt: 간헐적으로 번쩍이는 스파크 (Opacity flicker)
      - ❄️ Ice: 서서히 흐르는 냉기 (Slow Pan)
  - **Default Style**:
    - `CardFrame`: 속성별로 다른 Border Style 적용 (ex: Fire는 이글거리는 주황색 Glow).
    - `Placeholder`: 회색 박스 절대 금지. Unsplash 등의 고퀄리티 판타지/SF 이미지 기본 URL 매핑.
  - **Props 설계**:
    ```typescript
    interface CardProps {
      element: 'fire' | 'ice' | 'volt' | 'earth' | 'void'; // 핵심: 이 속성에 따라 전체 테마 결정
      background?: string;
      character?: string;
      pose?: 'idle' | 'attack';
      tier?: 'starter' | 'pro';
    }
    ```

### ✅ Task 3: Demo App 연동

**경로**: `/packages/demo`

- [ ] Core 라이브러리 import 테스트
- [ ] 레이어 테스트용 Playground 페이지 (각 레이어 토글 기능)

---

## 3. 기술적 요구사항 (Technical constraints)

1.  **Aesthetics (미적 기준) ⭐️ 중요**:
    - "기능 동작 여부"보다 **"보기에 멋있는가"**가 우선순위가 높음.
    - **Move it or Lose it**: 화면에 가만히 멈춰있는 요소가 없어야 함. 아주 미세하게라도 움직여야 '살아있는 카드' 느낌이 남.
    - Hover 시 인터랙션(Tilt, Scale, Glow)이 과감하고 부드러워야 함 (`framer-motion` spring config 튜닝 필수).
2.  **Composition over Inheritance**:
    - 각 레이어는 독립적인 컴포넌트로 교체 가능해야 함.
    - `z-index` 관리가 중요함 (배경 < 캐릭터 < 이펙트).
2.  **Asset Management**:
    - 캐릭터와 포즈 이미지는 투명 PNG 또는 WebP 사용을 전제로 함.
    - 데모용 Placeholders 이미지 준비 필요.
3.  **Phase 0 계승**:
    - Phase 0에서 만든 `SheenShader`는 **Layer 4 (Effects)**의 기본값으로 이관.

---

## 4. 검증 시나리오 (Verification)

개발 완료 후 PM에게 전달 시 다음이 확인되어야 함:

1.  `background` Prop만 바뀌어도 카드 분위기가 바뀌는가?
2.  동일 `character`에 다른 `pose`가 겹쳐질 때 위치가 어긋나지 않는가?
3.  `effects` 레이어가 캐릭터 *위에* 정상적으로 오버레이 되는가? (Blend Mode 확인)
4.  Monorepo에서 `core` 수정 시 `demo`에 즉시 반영되는가? (HMR)

---

## 5. 전달 사항
작업 완료 후 `/packages/demo` 실행 방법과 함께 보고해주세요.
