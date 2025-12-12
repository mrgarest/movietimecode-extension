import { useTranslation } from 'react-i18next';
import { HTMLAttributeAnchorTarget } from "react";
import Linker from "./Linker";

export default function Footer() {
    const { t } = useTranslation();

    const navItems: {
        name: string;
        href: string;
        target?: HTMLAttributeAnchorTarget | undefined;
    }[] = [
            { name: t("privacyPolicyShort"), href: "/privacy" },
            { name: "Telegram", href: "https://t.me/+B-6MNbF-t6cyZDVi", target: "_blank" },
        ];

    return (
        <footer className="flex items-center justify-center px-4 py-6">
            <div className="space-y-1">
                <nav className="flex items-center justify-center gap-3">{navItems.map((item, index) => <Linker
                    key={index}
                    target={item.target}
                    className="text-xs p-0.5 text-muted font-medium hover:text-foreground duration-300 select-none"
                    href={item.href}>{item.name}</Linker>)}</nav>
                <div className="text-xs text-muted/60 font-medium text-center">Developed by Garest</div>
            </div>
        </footer>
    );
}