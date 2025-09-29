import { JSX } from "react";

interface SettingsCardProps {
    title: string;
    description?: string;
    hotkeys?: string[];
    children: React.ReactNode;
}

export default function SettingsCard({ title, description = undefined, hotkeys = undefined, children }: SettingsCardProps) {

    const TitleComp = ({ children }: { children: string }): JSX.Element => (<div className="text-base font-medium">{children}</div>);

    return (
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="space-y-1">
                {hotkeys ? <div className="flex gap-1.5 items-center">
                    <div className="text-sm bg-secondary px-1 py-0.5 border border-border leading-none rounded-sm select-none">{hotkeys.flatMap((key, i) => [
                        i > 0 && <span key={`sep-${i}`} className="text-foreground/70 font-normal">+</span>,
                        <span key={`key-${i}`} className="text-foreground font-medium">{key}</span>
                    ])}</div>
                    <TitleComp>{title}</TitleComp>
                </div>
                    : <TitleComp>{title}</TitleComp>}
                {description && <p className="description">{description}</p>}
            </div>
            <div>
                {children}
            </div>
        </div>
    );
}