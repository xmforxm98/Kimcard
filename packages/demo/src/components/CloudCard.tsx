import { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { TextureLoader } from 'three'

const cardBgUrl = '/world-bg.png'
const cardCharUrl = '/world.png'
const cardFrameUrl = '/tarot-frame.png'

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment Shader - Calm Cloud/Mist Effect
const fragmentShader = `
  uniform sampler2D uBackground;
  uniform sampler2D uCharacter;
  uniform sampler2D uFrame;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uMouse;
  uniform float uCloudDensity;
  uniform float uCloudSpeed;
  uniform float uFrameScale;
  uniform float uCharScale;
  uniform vec2 uCharOffset;
  uniform float uShowFrame;
  uniform float uFrameBehind;
  varying vec2 vUv;

  float snoise(vec2 v) {
    vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    vec3 p = mod(vec3(i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ), 289.0);
    p = mod(((p*34.0)+1.0)*p, 289.0);
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.792842914 - 0.85373472 * ( a0*a0 + h*h );
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * snoise(p);
      p = p * 2.0 + vec2(100.0);
      a *= 0.5;
    }
    return v;
  }

  float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    float time = uTime * uCloudSpeed;
    float hover = uHover;
    vec2 mouse = uMouse * hover;
    
    vec2 p = (vUv - 0.5) * 1.25;
    
    // 1. Precise Card SDF
    float sdf = sdRoundedRect(p * 2.15, vec2(1.0), 0.12);
    float cardMask = smoothstep(0.015, -0.015, sdf);
    
    // 2. Calm Cloud/Mist Generation
    // We use a combination of low-frequency FBM for large clouds
    vec2 cloudUv = p * 1.5 + vec2(time * 0.1, time * 0.05);
    float n1 = fbm(cloudUv);
    float n2 = fbm(cloudUv * 2.5 - time * 0.08);
    float cloudNoise = mix(n1, n2, 0.5) * 0.5 + 0.5;
    
    // Soft Mist focusing on the edges and bottom
    float mistEdge = smoothstep(0.2, -0.6, sdf);
    float cloudDensity = cloudNoise * uCloudDensity * mix(0.5, 1.2, hover);
    
    // NEW: Wind Effect (Stretched noise particles)
    vec2 windUv = p * vec2(0.5, 8.0) - vec2(time * 1.5, time * 0.2);
    float wind = fbm(windUv) * fbm(windUv * 1.5);
    float windLayer = pow(max(0.0, wind), 3.0) * 1.5 * hover;
    
    // Divine/Mystical Palette for Cloud Card
    vec3 mistColor = vec3(0.95, 0.98, 1.0); // Soft ethereal white
    vec3 lightGold = vec3(1.0, 0.95, 0.8);  // Soft cosmic gold
    
    // 3. Subtle God Rays
    float angle = atan(p.y, p.x);
    float rays = sin(angle * 6.0 + time * 0.2) * 0.5 + 0.5;
    rays *= sin(angle * 14.0 - time * 0.1) * 0.5 + 0.5;
    float rayIntensity = rays * smoothstep(0.8, 0.0, length(p)) * 0.4 * hover;
    
    // 4. Texture Sampling with Differential Parallax
    // Each layer moves at a different speed to create 3D depth
    vec2 bgParallax = mouse * 0.015;
    vec2 charParallax = mouse * -0.05;
    vec2 frameParallax = mouse * 0.035;
    
    // Background 
    vec4 bgCol = texture2D(uBackground, vUv + bgParallax);
    bgCol.rgb *= mix(0.95, 0.8, hover);
    
    // Character (Floating + Parallax)
    float floatOffset = sin(uTime * 1.5) * 0.025;
    vec2 charUv = (vUv - 0.5) / uCharScale + 0.5 + uCharOffset + charParallax + vec2(0.0, floatOffset);
    
    // Soft blurred character (Dreamy look)
    float charBlur = 0.0015 + 0.001 * hover; 
    vec4 charCol = texture2D(uCharacter, charUv) * 0.6;
    charCol += texture2D(uCharacter, charUv + vec2(charBlur, 0.0)) * 0.1;
    charCol += texture2D(uCharacter, charUv + vec2(-charBlur, 0.0)) * 0.1;
    charCol += texture2D(uCharacter, charUv + vec2(0.0, charBlur)) * 0.1;
    charCol += texture2D(uCharacter, charUv + vec2(0.0, -charBlur)) * 0.1;
    charCol *= step(0.0, charUv.x) * step(charUv.x, 1.0) * step(0.0, charUv.y) * step(charUv.y, 1.0);
    
    // Ghosting Shadow Layer
    float ghostBlur = 0.012;
    vec4 blurredChar = texture2D(uCharacter, charUv + charParallax * 0.5 + vec2(ghostBlur, ghostBlur)) * 0.2;
    blurredChar += texture2D(uCharacter, charUv + charParallax * 0.5 + vec2(-ghostBlur, ghostBlur)) * 0.2;
    blurredChar += texture2D(uCharacter, charUv + charParallax * 0.5 + vec2(ghostBlur, -ghostBlur)) * 0.2;
    blurredChar += texture2D(uCharacter, charUv + charParallax * 0.5 + vec2(-ghostBlur, -ghostBlur)) * 0.2;
    blurredChar.a *= 0.25; 
    
    // Frame with its own parallax
    vec2 frameUv = (vUv - 0.5) / uFrameScale + 0.5 + frameParallax;
    vec4 frameCol = texture2D(uFrame, frameUv);
    frameCol *= step(0.0, frameUv.x) * step(frameUv.x, 1.0) * step(0.0, frameUv.y) * step(frameUv.y, 1.0);
    
    // NEW: Frame Shadow (Casts onto character and background)
    float shadowOffset = 0.015;
    float shadowBlur = 0.02;
    vec2 shadowUv = frameUv + vec2(shadowOffset, shadowOffset);
    float frameShadowIdx = texture2D(uFrame, shadowUv).a;
    frameShadowIdx += texture2D(uFrame, shadowUv + vec2(shadowBlur, 0.0)).a;
    frameShadowIdx += texture2D(uFrame, shadowUv + vec2(-shadowBlur, 0.0)).a;
    frameShadowIdx += texture2D(uFrame, shadowUv + vec2(0.0, shadowBlur)).a;
    frameShadowIdx += texture2D(uFrame, shadowUv + vec2(0.0, -shadowBlur)).a;
    float frameShadow = (frameShadowIdx / 5.0) * 0.6 * cardMask;
    
    // 5. NEW: Depth Mist (Between Character and Frame)
    vec2 midMistUv = p * 2.0 - vec2(time * 0.15, -time * 0.05);
    float midMistNoise = fbm(midMistUv) * fbm(midMistUv * 1.5 + 10.0);
    float midMistDensity = midMistNoise * 0.4 * hover;
    
    // 6. Compositing Layers
    vec3 composite = bgCol.rgb * cardMask;
    
    // Background Mist & Rays
    composite = mix(composite, mistColor, cloudDensity * 0.3 * cardMask);
    composite += lightGold * rayIntensity * cardMask;
    
    // Character Break Mask (Overflow)
    float breakMask = mix(cardMask, 1.0, hover);
    
    // Frame Behind
    vec3 finalFrame = frameCol.rgb + lightGold * frameCol.a * (cloudNoise * 0.4 + hover * 0.15);
    if (uShowFrame > 0.5 && uFrameBehind > 0.5) {
        composite = mix(composite, finalFrame, frameCol.a * cardMask);
    }
    
    // Ghost/Shadow behind char
    composite = mix(composite, blurredChar.rgb, blurredChar.a * breakMask);
    
    // Character (Main)
    float charMask = charCol.a;
    float charRim = pow(1.0 - charMask, 3.0) * (0.3 + 0.4 * hover);
    vec3 finalChar = charCol.rgb + lightGold * charRim * 0.25;
    composite = mix(composite, finalChar, charMask * breakMask);
    
    // NEW: Frame Shadow casting onto everything below it
    composite *= (1.0 - frameShadow * 0.8);
    
    // NEW: Atmospheric depth mist between Character and Frame
    composite = mix(composite, mistColor, midMistDensity * breakMask);
    
    // Over-character environment mist
    composite = mix(composite, mistColor, cloudDensity * 0.1 * charMask * hover);
    
    // Wind particles
    composite += mistColor * windLayer * cardMask;
    
    // Frame Front
    if (uShowFrame > 0.5 && uFrameBehind < 0.5) {
        composite = mix(composite, finalFrame, frameCol.a * cardMask);
    }
    
    // Final Edge Glow
    float glow = exp(-abs(sdf) * 20.0) * hover * 0.15;
    composite += lightGold * glow;
    
    float finalAlpha = max(cardMask, max(charMask * breakMask, max(blurredChar.a * breakMask, mix(0.0, 1.0, glow))));
    gl_FragColor = vec4(composite, finalAlpha);
  }
`

function ShaderPlane({
    hovered,
    mousePos,
    cloudDensity = 0.5,
    cloudSpeed = 0.5,
    frameScale = 1.0,
    charScale = 1.0,
    charOffset = { x: 0, y: 0 },
    showFrame = true,
    frameLayering = 'front',
}: {
    hovered: boolean
    mousePos: { x: number, y: number }
    cloudDensity?: number
    cloudSpeed?: number
    frameScale?: number
    charScale?: number
    charOffset?: { x: number, y: number }
    showFrame?: boolean
    frameLayering?: 'front' | 'back'
}) {
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const background = useLoader(TextureLoader, cardBgUrl)
    const character = useLoader(TextureLoader, cardCharUrl)
    const frame = useLoader(TextureLoader, cardFrameUrl)

    const uniforms = useMemo(() => ({
        uBackground: { value: background },
        uCharacter: { value: character },
        uFrame: { value: frame },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uCloudDensity: { value: cloudDensity },
        uCloudSpeed: { value: cloudSpeed },
        uFrameScale: { value: frameScale },
        uCharScale: { value: charScale },
        uCharOffset: { value: new THREE.Vector2(charOffset.x, charOffset.y) },
        uShowFrame: { value: showFrame ? 1.0 : 0.0 },
        uFrameBehind: { value: frameLayering === 'back' ? 1.0 : 0.0 },
    }), [background, character, frame, cloudDensity, cloudSpeed, frameScale, charScale, charOffset, showFrame, frameLayering])

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
            const targetHover = hovered ? 1 : 0
            materialRef.current.uniforms.uHover.value += (targetHover - materialRef.current.uniforms.uHover.value) * 0.1
            materialRef.current.uniforms.uMouse.value.x += (mousePos.x - materialRef.current.uniforms.uMouse.value.x) * 0.1
            materialRef.current.uniforms.uMouse.value.y += (mousePos.y - materialRef.current.uniforms.uMouse.value.y) * 0.1
        }
    })

    return (
        <mesh>
            <planeGeometry args={[2.5, 3.75]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
            />
        </mesh>
    )
}

interface CloudCardProps {
    cloudDensity?: number
    cloudSpeed?: number
    frameScale?: number
    charScale?: number
    charOffset?: { x: number, y: number }
    showFrame?: boolean
    frameLayering?: 'front' | 'back'
}

export default function CloudCard({
    cloudDensity = 0.6,
    cloudSpeed = 0.4,
    frameScale = 1.0,
    charScale = 1.0,
    charOffset = { x: 0, y: 0 },
    showFrame = true,
    frameLayering = 'front'
}: CloudCardProps) {
    const [hovered, setHovered] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        setMousePos({ x, y })
    }

    return (
        <motion.div
            className="relative cursor-pointer group"
            style={{ width: 320, height: 480, perspective: 1000 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setMousePos({ x: 0, y: 0 }) }}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="w-full h-full rounded-2xl relative z-10"
                style={{ background: 'transparent' }}
                animate={{ rotateY: mousePos.x * 20, rotateX: -mousePos.y * 20, scale: hovered ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                <div className="absolute inset-[-100px] z-0 pointer-events-none">
                    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.8], fov: 50 }}>
                        <Suspense fallback={null}>
                            <ShaderPlane
                                hovered={hovered}
                                mousePos={mousePos}
                                cloudDensity={cloudDensity}
                                cloudSpeed={cloudSpeed}
                                frameScale={frameScale}
                                charScale={charScale}
                                charOffset={charOffset}
                                showFrame={showFrame}
                                frameLayering={frameLayering}
                            />
                        </Suspense>
                    </Canvas>
                </div>

                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10">
                    <div
                        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                        style={{
                            opacity: hovered ? 0.2 : 0.05,
                            background: `linear-gradient(${135 + mousePos.x * 20}deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(200,200,255,0.1) 100%)`
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}
