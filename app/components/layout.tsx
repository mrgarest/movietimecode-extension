import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Aperture, Settings, User } from "lucide-react";
import { ExtensionDetails } from "./extension-details";

const navItems = [
    {
        ico: Settings,
        to: '/settings',
        text: "Налаштування",
    },
    {
        ico: Aperture,
        to: '/settings/obs-control',
        text: "Управління OBS",
    },
    {
        ico: User,
        to: '/user',
        text: "Користувач",
    }
]

export const SideNavLayout = () => {
    const [navigationValue, setNavigationValue] = useState<string>("/settings");
    return (
        <div className="container pt-6 grid grid-cols-[auto_1fr] gap-8 min-h-screen">
            <div className="flex flex-col space-y-0.5 w-48">
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
            <main>
                <Outlet />
                <ExtensionDetails />
            </main>
        </div>
    );
}
