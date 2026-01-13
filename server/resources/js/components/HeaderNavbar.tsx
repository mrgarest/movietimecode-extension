import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { HTMLAttributeAnchorTarget } from "react";
import Linker from "./Linker";
import FloatingHamburger from "./FloatingHamburger";
import { useMobileMenu } from "@/hooks/useMobileMenu";

export default function HeaderNavbar() {
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const { isOpen, isVisible, toggleMenu } = useMobileMenu();

    const navItems: {
        name: string;
        href: string;
        target?: HTMLAttributeAnchorTarget | undefined;
    }[] = [
            { name: t("home"), href: "/" },
            {
                name: t("download"),
                href: "https://chromewebstore.google.com/detail/oicfghfgplgplodmidellkbfoachacjb?utm_source=movietimecod",
                target: "_blank"
            },
            {
                name: "Telegram",
                href: "https://t.me/+B-6MNbF-t6cyZDVi",
                target: "_blank"
            },
        ];

    return (
        <>
            <header className="sm:my-6 flex items-center fixed sm:sticky top-4 left-0 right-0 z-20 px-4">
                <nav className="grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr] items-start w-full">
                    <div></div>
                    <div className="bg-secondary rounded-full h-11 px-1 hidden sm:flex items-center justify-center border-border border gap-1 shadow-md shadow-black/30">{navItems.map((item, index) => <Linker
                        key={index}
                        target={item.target}
                        className={cn(
                            "flex items-center justify-center px-3 h-9 text-sm rounded-full font-normal cursor-pointer select-none",
                            pathname === item.href ? "bg-neutral-900 text-white" : "hover:bg-neutral-900/70 text-white/70 hover:text-white/95 duration-300"
                        )}
                        href={item.href}>{item.name}</Linker>)}</div>
                    <div className="flex items-center justify-end gap-4">
                        <a href="https://github.com/mrgarest/movietimecode" target="_blank" rel="noopener noreferrer" className="cursor-pointer bg-secondary rounded-full size-8 p-1.5 flex items-center justify-center border-border border gap-2 shadow-md shadow-black/30"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg></a>
                    </div>
                </nav>
            </header>
            <FloatingHamburger hidden="sm" isOpen={isOpen} onToggle={() => toggleMenu()} />
            {isOpen && <>
                <div className={cn("fixed top-0 left-0 right-0 -bottom-20 bg-background/50 backdrop-blur-md z-20 pointer-events-none duration-300",
                    isVisible ? "opacity-100" : "opacity-0"
                )} />
                <div className={cn("fixed top-0 left-0 right-0 bottom-0 z-30 overflow-hidden duration-300",
                    isVisible ? "opacity-100" : "opacity-0"
                )}>
                    <div className="relative z-10 flex flex-col p-4 gap-1 overflow-auto max-h-screen">{navItems.map((item, index) => <Linker
                        key={index}
                        target={item.target}
                        onClick={() => toggleMenu()}
                        className={cn(
                            "px-4 py-2 text-base rounded-lg font-medium cursor-pointer select-none",
                            pathname === item.href ? "bg-secondary/40 text-foreground" : "hover:bg-secondary/40 text-foreground/70 hover:text-foreground duration-300"
                        )}
                        href={item.href}>{item.name}</Linker>)}</div>
                </div>
            </>}
        </>
    );
}