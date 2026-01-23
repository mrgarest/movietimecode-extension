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
                    <div className="bg-[#2e2f33] rounded-full h-11 px-1 hidden sm:flex items-center justify-center border-border border gap-1 shadow-md shadow-black/30">{navItems.map((item, index) => <Linker
                        key={index}
                        target={item.target}
                        className={cn(
                            "flex items-center justify-center px-3 h-9 text-sm rounded-full font-normal cursor-pointer select-none",
                            pathname === item.href ? "bg-neutral-900 text-white" : "hover:bg-neutral-900/70 text-white/70 hover:text-white/95 duration-300"
                        )}
                        href={item.href}>{item.name}</Linker>)}</div>
                    <div className="flex items-center justify-end gap-4">
                        <a href="https://github.com/mrgarest/movietimecode" target="_blank" rel="noopener noreferrer" className="cursor-pointer bg-[#2e2f33] rounded-full size-8 p-1.5 flex items-center justify-center border-border border gap-2 shadow-md shadow-black/30"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 152 152"><g transform="matrix(1.15,0,0,1.15,-11.39885129928588,-11.385000228881822)"><path d="M53.1 141c4.6 0 5.9-1.8 5.9-4.1s0-7.3-.1-14.4c-23.9 5.1-29-11.4-29-11.4-3.9-9.7-9.6-12.4-9.6-12.4-7.8-5.2.6-5.1.6-5.1 8.6.6 13.2 8.7 13.2 8.7 7.7 13 20.1 9.2 25 7 .4-4.3 2.3-8.4 5.5-11.4-19.1-2.1-39.2-9.4-39.2-41.8-.1-8.4 3.1-16.6 8.9-22.7-1-2.1-3.9-10.7.7-22.4 0 0 7.2-2.3 23.7 8.7 14.1-3.8 28.9-3.8 43 0C118 8.8 125.3 11 125.3 11c4.6 11.6 1.7 20.2.9 22.4 5.8 6.1 8.9 14.3 8.8 22.7 0 32.5-20.1 39.6-39.3 41.7 3 2.5 5.8 7.7 5.8 15.6 0 11.4-.1 20.4-.1 23.1 0 2.2 1 4 5.9 4z" fill="currentColor" opacity="1"></path></g></svg>
                        </a>
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
                            pathname === item.href ? "bg-[#2e2f33]/40 text-foreground" : "hover:bg-[#2e2f33]/40 text-foreground/70 hover:text-foreground duration-300"
                        )}
                        href={item.href}>{item.name}</Linker>)}</div>
                </div>
            </>}
        </>
    );
}