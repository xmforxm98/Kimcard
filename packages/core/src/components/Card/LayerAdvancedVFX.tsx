import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerAdvancedVFXProps } from './types';
import { useCardContext } from './context';

// --- SHADER DEFINITIONS ---

const lightningVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lightningFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    float outputColor = 0.0;
    for(int i = 0; i < 3; i++) {
        float t = uTime * 2.0 + float(i);
        float seed = floor(t); 
        float offset = random(vec2(seed, float(i))); 
        float x = uv.x;
        float y = uv.y;
        float distortion = fbm(vec2(x * 10.0, t)) * 0.4;
        float path = abs(y - 0.5 + distortion - (offset - 0.5) * 0.5);
        float glow = 0.02 / (path + 0.001);
        glow *= smoothstep(0.0, 0.2, x) * smoothstep(1.0, 0.8, x);
        float flicker = random(vec2(uTime * 20.0, float(i)));
        if(flicker > 0.8) outputColor += glow;
    }
    vec3 finalColor = uColor * outputColor * uIntensity;
    gl_FragColor = vec4(finalColor, outputColor * length(uColor)); 
  }
`;

const auraFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uSpread;
  uniform vec2 uAuraSize; 
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
  }

  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec2 st = (vUv - 0.5);
    float dist = sdRoundedBox(st, uAuraSize, 0.04);
    
    vec2 flowUv = vUv;
    flowUv.y -= uTime * 1.5;
    flowUv.x += sin(vUv.y * 3.0 + uTime * 5.0) * 0.05;
    
    float fireNoise = fbm(flowUv * vec2(6.0, 2.5));
    float detailNoise = fbm(vUv * 12.0 - uTime * 4.0);
    
    float flameSpread = uSpread * 0.8;
    float outerGlow = 1.0 - smoothstep(0.0, 0.2 + flameSpread, dist);
    outerGlow = clamp(outerGlow, 0.0, 1.0) * step(0.0, dist + 0.02); 
    
    float fire = (fireNoise * 0.7 + detailNoise * 0.3) * outerGlow;
    fire = pow(fire, 1.4); 
    
    float core = smoothstep(0.03, 0.0, abs(dist)) * 0.5;
    
    vec3 white = vec3(1.0, 1.0, 0.9);
    vec3 gold = uColor; 
    vec3 deepRed = vec3(0.6, 0.1, 0.0);
    
    vec3 finalCol = mix(deepRed, gold, smoothstep(0.1, 0.5, fire));
    finalCol = mix(finalCol, white, smoothstep(0.6, 1.0, fire + core));
    
    float alpha = smoothstep(0.1, 0.3, fire) * uIntensity;
    alpha += core * uIntensity; 
    
    float pulse = 0.95 + 0.05 * sin(uTime * 8.0);
    
    gl_FragColor = vec4(finalCol * pulse, alpha);
  }
`;

const FullScreenPlane: React.FC<{
  type: 'lightning' | 'aura';
  color: string;
  intensity: number;
  hovered: boolean;
  spread: number;
  auraWidth: number;
  auraHeight: number;
}> = ({ type, color, intensity, hovered, spread, auraWidth, auraHeight }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uSpread: { value: spread },
    uAuraSize: { value: new THREE.Vector2(auraWidth, auraHeight) },
  }), [color, intensity, spread, size, auraWidth, auraHeight]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;

      const targetIntensity = hovered ? intensity * 1.5 : intensity;
      materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uIntensity.value,
        targetIntensity,
        0.1
      );
      materialRef.current.uniforms.uSpread.value = spread;
      materialRef.current.uniforms.uAuraSize.value.set(auraWidth, auraHeight);
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={lightningVertexShader}
        fragmentShader={type === 'lightning' ? lightningFragmentShader : auraFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

export interface AdvancedVFXExtendedProps extends LayerAdvancedVFXProps {
  spread?: number;
  scale?: number;       // Base width scale
  aspectRatio?: number; // Height / Width ratio (e.g., 1.5)
}

export const LayerAdvancedVFX: React.FC<AdvancedVFXExtendedProps> = ({
  type,
  color = '#ffffff',
  intensity = 1.0,
  spread = 0.05,
  scale = 0.33,         // Standard card width scale
  aspectRatio = 1.,    // Standard card aspect ratio
  className = '',
  zIndex = 25,
}) => {
  const { hovered } = useCardContext();

  // Calculate internal dimensions based on aspect ratio
  const auraWidth = scale;
  const auraHeight = scale * aspectRatio;

  return (
    <div
      className={`absolute pointer-events-none rounded-2xl overflow-visible ${className}`}
      style={{
        zIndex,
        width: '150%',
        height: '150%',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1] }}
        resize={{ scroll: false, debounce: 0 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <FullScreenPlane
          type={type}
          color={color}
          intensity={intensity}
          hovered={hovered}
          spread={spread}
          auraWidth={auraWidth}
          auraHeight={auraHeight}
        />
      </Canvas>
    </div>
  );
};
