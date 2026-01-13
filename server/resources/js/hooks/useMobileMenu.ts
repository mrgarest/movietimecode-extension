import { useState, useCallback } from 'react';

export function useMobileMenu() {
    const [isOpen, setOpen] = useState<boolean>(false);
    const [isVisible, setVisible] = useState<boolean>(false);

    const toggleMenu = useCallback((targetState?: boolean) => {
        const nextState = targetState !== undefined ? targetState : !isOpen;

        document.body.style.overflow = nextState ? "hidden" : "";

        if (nextState) {
            setOpen(true);
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
            setTimeout(() => setOpen(false), 300);
        }
    }, [isOpen]);

    return { isOpen, isVisible, toggleMenu };
}