import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerEffectsProps } from './types';
import { useCardContext } from './context';

// --- SHADERS ---

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 1. Sheen Shader
const sheenFragmentShader = `
  uniform float uTime;
  uniform float uHover;
  varying vec2 vUv;

  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  void main() {
    float speed = 0.4 + uHover * 0.6;
    float intensity = 0.3 + uHover * 0.4;
    float diagonal = (vUv.x + vUv.y) * 0.5;
    float sheenPos = fract(uTime * speed);
    float sheenWidth = 0.15;
    float dist = abs(diagonal - sheenPos);
    float wrappedDist = min(dist, 1.0 - dist);
    float sheen = smoothstep(sheenWidth, 0.0, wrappedDist);
    float hue = fract(diagonal * 2.0 + uTime * 0.1);
    vec3 rainbowColor = hsl2rgb(hue, 0.8, 0.6);
    float diagonal2 = (vUv.x - vUv.y + 1.0) * 0.5;
    float sheenPos2 = fract(uTime * speed * 0.7 + 0.5);
    float dist2 = abs(diagonal2 - sheenPos2);
    float wrappedDist2 = min(dist2, 1.0 - dist2);
    float sheen2 = smoothstep(sheenWidth * 0.7, 0.0, wrappedDist2) * 0.5;
    vec3 sheenColor = rainbowColor * sheen * intensity;
    vec3 sheenColor2 = hsl2rgb(fract(hue + 0.5), 0.7, 0.5) * sheen2 * intensity;
    vec3 finalColor = sheenColor + sheenColor2;
    float alpha = length(finalColor);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// 2. Burning Fire Shader
const burningFragmentShader = `
  uniform float uTime;
  uniform float uHover;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float distX = abs(vUv.x - 0.5) * 2.0;
    float distY = abs(vUv.y - 0.5) * 2.0;
    float maxDist = max(distX, distY);
    float borderMask = pow(maxDist, 4.0);
    
    float time = uTime * (1.2 + uHover * 1.0);
    float n1 = snoise(vUv * 3.0 + vec2(0.0, -time * 1.5));
    float n2 = snoise(vUv * 6.0 + vec2(time * 0.2, -time * 2.5));
    float noiseSum = n1 * 0.6 + n2 * 0.4;
    
    float fireShape = borderMask + noiseSum * 0.25 * (0.5 + uHover * 0.5);
    float t = smoothstep(0.4, 0.95, fireShape);
    
    float embers = 0.0;
    vec2 gv = fract(vUv * vec2(10.0, 5.0)) - 0.5;
    vec2 id = floor(vUv * vec2(10.0, 5.0));
    for(int y=-1; y<=1; y++) {
      for(int x=-1; x<=1; x++) {
        float n = hash(id + vec2(float(x),float(y)));
        float pTime = time * 0.5 + n * 6.28;
        vec2 pPos = vec2(float(x),float(y)) + vec2(sin(pTime) * 0.4, fract(pTime) * 2.0 - 1.0);
        embers += smoothstep((0.04 + n * 0.04) * uHover, 0.0, length(gv - pPos)) * (0.5 + 0.5 * sin(pTime * 2.0));
      }
    }
    
    vec3 colorFire = vec3(1.0, 0.3, 0.0);
    vec3 colorGold = vec3(1.0, 0.8, 0.2);
    vec3 fireColor = mix(vec3(0.0), colorFire, smoothstep(0.0, 0.5, t));
    fireColor = mix(fireColor, colorGold, smoothstep(0.5, 0.9, t));
    fireColor = mix(fireColor, vec3(1.0, 1.0, 0.9), smoothstep(0.9, 1.0, t));
    
    vec3 finalColor = fireColor * t * (1.0 + uHover) + colorGold * embers * 2.0;
    float alpha = clamp(length(finalColor) * 1.5, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- COMPONENTS ---

function EffectPlane({ shader }: { shader: string }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { hovered } = useCardContext();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHover: { value: 0 },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const targetHover = hovered ? 1 : 0;
      const currentHover = materialRef.current.uniforms.uHover.value;
      materialRef.current.uniforms.uHover.value += (targetHover - currentHover) * 0.1;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 3]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={shader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export const LayerEffects: React.FC<LayerEffectsProps> = ({
  type = 'sheen',
  className = '',
  zIndex = 20,
}) => {
  if (type === 'none') return null;

  const shader = type === 'burning' ? burningFragmentShader : sheenFragmentShader;

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} style={{ zIndex }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        gl={{ alpha: true, preserveDrawingBuffer: true }}
      >
        <EffectPlane shader={shader} />
      </Canvas>
    </div>
  );
};
