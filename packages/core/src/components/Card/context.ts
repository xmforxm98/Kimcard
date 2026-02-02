import { createContext, useContext } from 'react';

import { ElementType } from './themes';

interface CardContextType {
    hovered: boolean;
    mousePos: { x: number; y: number };
    element?: ElementType;
}

export const CardContext = createContext<CardContextType>({
    hovered: false,
    mousePos: { x: 0, y: 0 },
});

export const useCardContext = () => useContext(CardContext);
