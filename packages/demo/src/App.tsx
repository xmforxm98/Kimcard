import {
    CardContainer,
    LayerBackground,
    LayerCharacter,
    LayerVFX,
    LayerAdvancedVFX,
} from '@kimcard/core';
import { ElementType } from '@kimcard/core/src/components/Card/themes';
import SheenCard from './components/SheenCard';
import ElectricCard from './components/ElectricCard';
import CloudCard from './components/CloudCard';

// Assets - Fixed with high-quality working URLs
const ASSETS = {
    fire: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=500&fit=crop&q=80',
    ice: 'https://images.unsplash.com/photo-1518176258769-f227c798150e?w=500&fit=crop&q=80',
    volt: 'https://images.unsplash.com/photo-1493238792040-e7141f0f0c3c?w=500&fit=crop&q=80',
    earth: 'https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?w=500&fit=crop&q=80',
    void: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=500&fit=crop&q=80',
};

// Ultra Rare Assets
const ULTRA_ASSETS = {
    lightning: {
        bg: 'https://images.unsplash.com/photo-1504194569500-1c0993950b32?w=600&q=80',
        char: 'https://images.unsplash.com/photo-1500322969630-a26ab67a1ad9?w=600&fit=crop&q=80', // Lightning figure
        color: '#67e8f9'
    },
    aura: {
        bg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80',
        char: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&fit=crop&q=80',
        color: '#fcd34d'
    }
};

function App() {
    const elements: ElementType[] = ['fire', 'ice', 'volt', 'earth', 'void'];

    return (
        <div className="w-full min-h-screen bg-neutral-950 flex flex-col items-center py-16 overflow-x-hidden relative">

            {/* --- SECTION 1: PROTOTYPE (HIGH END VFX) --- */}
            <div className="mb-24 flex flex-col items-center z-20">
                <h2 className="text-3xl text-yellow-500 font-bold mb-8 animate-pulse text-center tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>
                    PROTOTYPE: ULTRA RARE
                </h2>

                <div className="flex flex-col md:flex-row gap-16 perspective-[2000px] items-center justify-center">

                    {/* New Fire Effect Card */}
                    <div className="group relative">
                        <SheenCard />
                        <div className="absolute -bottom-16 w-full text-center pointer-events-none z-30">
                            <h3 className="text-orange-500 text-2xl font-bold drop-shadow-[0_0_10px_rgba(255,100,0,0.8)]" style={{ fontFamily: 'Cinzel' }}>
                                INFERNO DEMON
                            </h3>
                        </div>
                    </div>

                    {/* New Electric Effect Card */}
                    <div className="group relative">
                        <ElectricCard frameScale={0.78} charScale={0.8} charOffset={{ x: 0, y: 0.12 }} frameLayering="back" showFrame={true} />
                        <div className="absolute -bottom-16 w-full text-center pointer-events-none z-30">
                            <h3 className="text-yellow-400 text-2xl font-bold drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" style={{ fontFamily: 'Orbitron' }}>
                                KING ZEUS
                            </h3>
                        </div>
                    </div>

                    {/* New Cloud Effect Card (The World) */}
                    <div className="group relative">
                        <CloudCard frameScale={0.68} charScale={0.8} charOffset={{ x: 0, y: 0.1 }} frameLayering="front" showFrame={true} />
                        <div className="absolute -bottom-16 w-full text-center pointer-events-none z-30">
                            <h3 className="text-blue-100 text-2xl font-bold drop-shadow-[0_0_15px_rgba(200,230,255,0.8)]" style={{ fontFamily: 'Orbitron' }}>
                                THE WORLD
                            </h3>
                        </div>
                    </div>

                </div>
            </div>


            {/* --- SECTION 2: ELEMENTAL CORE (STANDARD) --- */}
            <h1 className="text-4xl text-white/50 font-bold mb-12 tracking-widest z-20 scale-75" style={{ fontFamily: 'Cinzel, serif' }}>
                STANDARD COLLECTION
            </h1>

            <div className="flex flex-wrap gap-8 justify-center items-center z-10 perspective-[2000px] max-w-6xl">
                {elements.map((el) => (
                    <div key={el} className="group relative">
                        <CardContainer width={240} height={360} element={el}>
                            <LayerBackground type="solid" color="transparent" />
                            <LayerCharacter
                                src={el === 'fire' ? ASSETS.fire : ASSETS[el]}
                                scale={0.8}
                                className="mix-blend-lighten"
                            />
                            <LayerVFX element={el} />

                            {/* Replaced WebGL Sheen with a lighter CSS one for stability */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                                    backgroundSize: '200% 200%',
                                    animation: 'sheen 3s infinite linear'
                                }}
                            />

                            <div className="absolute bottom-6 w-full text-center pointer-events-none z-30">
                                <span className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs" style={{ fontFamily: 'Orbitron' }}>
                                    {el}
                                </span>
                            </div>
                        </CardContainer>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default App;
