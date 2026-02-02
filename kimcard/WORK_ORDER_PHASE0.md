# 📋 개발 작업 지시서: RE:ACTIVE Phase 0 (PoC)

**작성일**: 2026-02-02  
**담당**: 코딩 에이전트  
**PM**: 프로젝트 매니저 에이전트

---

## 1. 개요 (Overview)

| 항목 | 내용 |
|------|------|
| **프로젝트명** | RE:ACTIVE - Sheen Test (Proof of Concept) |
| **목표** | React 환경에서 이미지가 실시간 쉐이더(Sheen)로 렌더링되는지 기술 검증 |
| **핵심 지표** | 아이폰(Mobile Safari)에서 60fps 방어, 위화감 없음 |

---

## 2. 기술 스택 (Tech Stack)

| 영역 | 기술 |
|------|------|
| **Framework** | React + Vite (TypeScript) |
| **3D Engine** | @react-three/fiber (R3F), @react-three/drei |
| **Animation** | framer-motion (Card Container), useFrame (Shader) |
| **Styling** | Tailwind CSS (Layout only) |

---

## 3. 구현 요구사항 (Requirements)

### A. 아키텍처: Hybrid Card Structure

전체 화면을 Canvas로 덮지 말고, **카드 컴포넌트 내부에 독립적인 WebGL Canvas**를 배치하는 구조

```
┌─────────────────────────────────────────┐
│  <div className="card-container">       │  ← Framer Motion (3D Tilt/Hover)
│    ┌─────────────────────────────────┐  │
│    │  <Canvas>                       │  │  ← R3F (WebGL Shader)
│    │    <Plane mesh + ShaderMaterial>│  │
│    │  </Canvas>                      │  │
│    └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### B. 쉐이더 (Shader Logic)

CSS linear-gradient 애니메이션이 **아닌** GLSL Fragment Shader 사용

| 효과 | 설명 |
|------|------|
| **Sheen Effect** | 사선(45도) 빛 줄기가 주기적으로 카드를 훑고 지나감 |
| **Blend Mode** | Add 또는 Overlay 모드로 원본 텍스처와 합성 |
| **Mouse Interaction** | Hover 시 빛 속도(uTime) 또는 강도(uIntensity) 증가 |

### C. 퍼포먼스 최적화 (Mobile First)

- `dpr`: 모바일에서 `[1, 2]`로 제한 (과도한 픽셀 연산 방지)
- `texture`: 1K 이하의 가벼운 플레이스홀더 이미지 사용

---

## 4. AI 프롬프트 (For Cursor/Claude)

아래 내용을 AI에게 입력하세요:

```markdown
You are an expert Creative Developer specializing in React-Three-Fiber and GLSL.
We need to create a "Sheen Test" component to verify mobile performance for a web card game.

Please implement a single file component `SheenCard.tsx` with the following specs:

1. **Structure**:
   - Use `framer-motion` for the container <div> to handle a slight 3D tilt on mouse move (perspective-1000).
   - Inside the div, place a `<Canvas>` from `@react-three/fiber`.
   - Inside the Canvas, render a `Plane` mesh that fills the card.

2. **The Shader (Crucial)**:
   - Create a `ShaderMaterial`.
   - **Vertex Shader**: Standard UV mapping.
   - **Fragment Shader**:
     - Load a sample texture (use a placeholder URL like unsplash).
     - Implement a "Sheen" effect: A diagonal beam of light moving across the UVs based on `uTime`.
     - The sheen should look like a "Holographic Foil" reflection.
     - Mix the sheen with the texture color using an additive blending approach so it looks "shiny".

3. **Interaction**:
   - When hovering the card wrapper, the sheen animation speed should increase, or the intensity should boost. Pass this state via uniforms.

4. **Performance**:
   - Set `<Canvas dpr={[1, 2]} ... />` to ensure smooth framerate on mobile devices.

Please provide the full code for `SheenCard.tsx` and the `App.tsx` to display it centered on a dark background.
```

---

## 5. 산출물 (Deliverables)

개발 완료 후 다음 파일들이 생성되어야 합니다:

```
/src
  ├── App.tsx           # 메인 앱 (다크 배경 + 카드 중앙 배치)
  ├── components/
  │   └── SheenCard.tsx # Hybrid Card + Shader 컴포넌트
  └── shaders/          # (선택) GLSL 파일 분리 시
      ├── vertex.glsl
      └── fragment.glsl
```

---

## 6. 검증 체크리스트 (Test Scenario)

> ⚠️ **PM이 직접 확인할 항목들**

개발 완료 후 PM에게 알려주세요. PM이 다음 항목을 테스트합니다:

| # | 테스트 항목 | 확인 방법 |
|---|------------|----------|
| 1 | 데스크탑 성능 | 마우스 Hover 시 프레임 드랍 없이 빛이 부드럽게 지나가는가? |
| 2 | 모바일 호환성 | 아이폰에서 보라색/분홍색(WebGL 에러) 없이 정상 렌더링? |
| 3 | 반응형 레이아웃 | 브라우저 창 크기 변경 시 캔버스 2:3 비율 유지? |
| 4 | Juice 품질 | 유희왕 카드 같은 고급스러운 홀로그램 느낌인가? |

---

## 7. 완료 보고

작업 완료 후 PM에게 다음 내용을 전달해주세요:

1. **개발 서버 실행 방법** (ex: `npm run dev`)
2. **접속 URL** (ex: `http://localhost:5173`)
3. **발생한 이슈 또는 특이사항**
