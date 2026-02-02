import {
    CardContainer,
    LayerBackground,
    LayerCharacter,
    LayerVFX,
    LayerAdvancedVFX,
    LayerEffects
} from '@kimcard/core';
import { ElementType } from '@kimcard/core/src/components/Card/themes';

// Assets
const ASSETS = {
    fire: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=500&fit=crop&q=80',
    ice: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&fit=crop&q=80',
    volt: 'https://images.unsplash.com/photo-1534293630113-6d09e3a0937c?w=500&fit=crop&q=80',
    earth: 'https://images.unsplash.com/photo-1600189261867-30e5ffe7b8da?w=500&fit=crop&q=80',
    void: 'https://images.unsplash.com/photo-1614728853913-1e222cc66122?w=500&fit=crop&q=80',
};

// Ultra Rare Assets
const ULTRA_ASSETS = {
    lightning: {
        bg: 'https://images.unsplash.com/photo-1504194569500-1c0993950b32?w=600&q=80', // Dark Storm
        char: 'https://images.unsplash.com/photo-1598556851229-373678082989?w=600&fit=crop&q=80', // Dark Figure
        color: '#67e8f9' // Cyan
    },
    aura: {
        bg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80', // Golden
        char: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&fit=crop&q=80', // Goddess like
        color: '#fcd34d' // Gold
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

                <div className="flex flex-col md:flex-row gap-16 perspective-[2000px]">

                    {/* 1. LIGHTNING STORM (Torturess Style) */}
                    <div className="group relative">
                        <CardContainer width={320} height={500} element="ice">
                            <LayerBackground type="image" src={ULTRA_ASSETS.lightning.bg} />
                            <LayerCharacter src={ULTRA_ASSETS.lightning.char} scale={1.2} />
                            <LayerAdvancedVFX type="lightning" color="#22d3ee" intensity={1.5} />

                            <div className="absolute bottom-8 w-full text-center pointer-events-none z-30">
                                <h3 className="text-cyan-300 text-2xl font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ fontFamily: 'Orbitron' }}>
                                    THUNDER LORD
                                </h3>
                            </div>
                        </CardContainer>
                    </div>

                    {/* 2. GOLDEN SPIRIT (Oriental Fantasy) */}
                    <div className="group relative">
                        <CardContainer width={320} height={500} element="fire">
                            <LayerBackground type="image" src={ULTRA_ASSETS.aura.bg} />
                            <LayerCharacter src={ULTRA_ASSETS.aura.char} scale={1.1} offsetY={10} />
                            <LayerAdvancedVFX type="aura" color="#fbbf24" intensity={1.5} />

                            <div className="absolute bottom-8 w-full text-center pointer-events-none z-30">
                                <h3 className="text-amber-300 text-2xl font-bold drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" style={{ fontFamily: 'Cinzel' }}>
                                    GOLDEN SOUL
                                </h3>
                            </div>
                        </CardContainer>
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
                            <LayerEffects type="sheen" intensity={0.4} />

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
