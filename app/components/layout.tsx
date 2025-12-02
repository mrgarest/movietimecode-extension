import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Aperture, BotMessageSquare, Command, HardDriveDownload, Settings, User } from "lucide-react";
import { Footer } from "./footer";
import i18n from "@/lib/i18n";

const navItems = [
    {
        ico: Settings,
        to: '/settings',
        text: i18n.t('settings')
    },
    {
        ico: Aperture,
        to: '/settings/obs-control',
        text: i18n.t('obsManagement')
    },
    {
        ico: BotMessageSquare,
        to: '/settings/chatbot',
        text: i18n.t('chatbot')
    },
    {
        ico: Command,
        to: '/settings/hotkeys',
        text: i18n.t('hotkeys')
    },
    {
        ico: User,
        to: '/user',
        text: i18n.t('user')
    },
    {
        ico: HardDriveDownload,
        to: '/backup',
        text: i18n.t('backup')
    }
]

export const SideNavLayout = () => {
    const [navigationValue, setNavigationValue] = useState<string>("/settings");
    return (
        <div className="container pt-6 grid grid-cols-[auto_1fr] gap-8 min-h-screen">
            <div className="relative">
                <div className="flex flex-col space-y-0.5 w-48 sticky top-6">
                    {navItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.to}
                            className={cn('flex items-center gap-2 px-3 py-2 font-normal rounded-md text-sm select-none cursor-pointer', (item.to == navigationValue ? 'bg-primary/10 text-primary' : ''))}
                            onClick={() => setNavigationValue(item.to)}>
                            <item.ico size={16} />
                            {item.text}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="grid grid-rows-[1fr_auto]">
                <Outlet />
                <Footer />
            </div>
        </div>
    );
}
