import { useState } from 'react';
import { TSettings } from '@/types/storage'
import config from "config";
import i18n from '@/lib/i18n';
import { Button } from '../components/ui/button';
import { HardDriveDownload, HardDriveUpload } from 'lucide-react';
import toast from "react-hot-toast";
import { SpinnerFullScreen } from '../components/ui/spinner';

export default function Backup() {
    const [isSpinner, setSpinner] = useState<boolean>(false);

    /**
     * Processes export of settings.
     */
    const handleExport = () => {
        if (!chrome?.storage?.sync) return;
        setSpinner(true);
        chrome.storage.sync.get('settings', (result) => {
            const curentSettings: TSettings = result.settings ?? {};
            const {
                obsClient,
                obsCensorScene,
                ...settingsForExport
            } = curentSettings;

            const blob = new Blob([JSON.stringify(settingsForExport, null, 2)], { type: "application/json" });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "movietimecode-settings.json";
            a.click();

            URL.revokeObjectURL(url);
            setSpinner(false);
        });
    };

    /**
     * Processes import settings
     */
    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (event) => {
                setSpinner(true);
                try {
                    const text = event.target?.result as string;
                    const imported: any = JSON.parse(text);

                    if (typeof imported !== "object" || imported === null) {
                        toast.error(i18n.t("invalidFileFormat"));
                        return;
                    }

                    chrome.storage.sync.get("settings", (result) => {
                        const current: TSettings = result.settings ?? {};

                        const newSettings: Partial<TSettings> = {};

                        for (const key of Object.keys(current) as (keyof TSettings)[]) {
                            if (key === "obsClient") continue; // do not import obsClient
                            if (key === "obsCensorScene") continue; // do not import obsCensorScene
                            if (key in imported) {
                                const currentValue = current[key];
                                const importedValue = imported[key];

                                // type check
                                if (
                                    currentValue === undefined ||
                                    typeof importedValue === typeof currentValue ||
                                    (Array.isArray(currentValue) && Array.isArray(importedValue))
                                ) {
                                    newSettings[key] = importedValue;
                                } else if (config.debug) {
                                    console.warn(`Type mismatch for key "${key}", skipping.`);
                                }
                            }
                        }

                        chrome.storage.sync.set(
                            { settings: newSettings },
                            () => {
                                toast.success(i18n.t("settingsImportedSuccessfully"));
                                setSpinner(false);
                            }
                        );
                    });

                } catch (error) {
                    toast.error(i18n.t("settingsImportedError"));
                    setSpinner(false);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    };

    return (
        <>
            <div className="space-y-4">
                <div className="space-y-4">
                    <h1 className="text-h1">{i18n.t('backup')}</h1>
                    <p className="text-sm text-foreground font-normal">{i18n.t("backupDescription")}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handleExport}><HardDriveDownload strokeWidth={2.5} />{i18n.t("export")}</Button>
                    <Button onClick={handleImport}><HardDriveUpload strokeWidth={2.5} />{i18n.t("import")}</Button>
                </div>
            </div>
            {isSpinner && <SpinnerFullScreen />}
        </>
    );
}