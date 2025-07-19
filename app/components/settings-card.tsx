
interface SettingsCardProps {
    title: string;
    description?: string | null;
    children: React.ReactNode;
}

export default function SettingsCard({title, description = null, children}:SettingsCardProps) {
    return (
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="space-y-1">
                <div className="text-base font-medium">{title}</div>
                {description && <p className="description">{description}</p>}
            </div>
            <div>
                {children}
            </div>
        </div>
    );
}