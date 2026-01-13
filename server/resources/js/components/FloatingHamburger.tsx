import { cn } from "@/lib/utils";
import { Cross as Hamburger } from "hamburger-react";

interface RootProps {
    hidden: 'sm' | 'md';
    isOpen: boolean;
    onToggle: () => void;
}

export default function FloatingHamburger({ hidden, isOpen, onToggle }: RootProps) {
    return (
        <div className={cn(
            "bg-secondary rounded-full size-12 flex items-center justify-center border-border border gap-2 shadow-md shadow-black/30 overflow-hidden fixed right-6 bottom-6 z-40",
            !isOpen && hidden == 'sm' && "sm:hidden",
            !isOpen && hidden == 'md' && "md:hidden"
        )}>
            <div className="absolute">
                <Hamburger
                    rounded
                    hideOutline
                    size={20}
                    toggled={isOpen}
                    toggle={onToggle}
                />
            </div>
        </div>
    );
}