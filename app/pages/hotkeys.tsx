import { useEffect, useMemo, useState } from 'react';
import SettingsCard from '@/app/components/settings-card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { TimecodeAction } from '@/enums/timecode';
import { StorageDefault } from '@/utils/storage-options';
import { TSettings } from '@/types/storage'
import config from "config";
import i18n from '@/lib/i18n';

export default function Hotkeys() {
    const [settings, setSettings] = useState<TSettings>({});
    const [playerContentCensorshipCommand, setPlayerContentCensorshipCommand] = useState<TimecodeAction>(StorageDefault.playerContentCensorshipCommand);

    const altKey: string = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent) ? "⌥" : "Alt";

    useEffect(() => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get('settings', (result) => {
                const curentSettings: TSettings = result.settings ?? {};
                curentSettings.playerContentCensorshipCommand = curentSettings.playerContentCensorshipCommand as TimecodeAction ?? StorageDefault.playerContentCensorshipCommand

                setSettings(curentSettings);

                setPlayerContentCensorshipCommand(curentSettings.playerContentCensorshipCommand);
            });
        } else if (config.debug) {
            console.warn("chrome.storage is not available.");
        }
    }, []);

    const updateSettings = (updates: Partial<TSettings>) => {
        setSettings((prev) => {
            const newSettings = { ...prev, ...updates };
            chrome.storage.sync.set({ settings: newSettings }, () => { });
            return newSettings;
        });
    };

    const handlePlayerContentCensorshipCommand = (value: string) => {
        const n = Number(value);
        setPlayerContentCensorshipCommand(n);
        updateSettings({ playerContentCensorshipCommand: n as TimecodeAction });
    };

    const getSelectItemBehavior = (settings: TSettings) => [
        { disabled: false, value: TimecodeAction.noAction, text: i18n.t("inaction") },
        { disabled: false, value: TimecodeAction.blur, text: i18n.t("blur") },
        { disabled: false, value: TimecodeAction.hide, text: i18n.t("hide") },
        {
            disabled: settings.obsClient == null || settings.obsCensorScene == null,
            value: TimecodeAction.obsSceneChange,
            text: i18n.t("obsSceneSwitching"),
        },
    ];
    const selectItemBehavior = useMemo(() => getSelectItemBehavior(settings), [settings]);

    return (
        <div className="space-y-8">
            <h1 className="text-h1">{i18n.t('hotkeys')}</h1>
            <div className="space-y-4">
                <SettingsCard
                    hotkeys={[altKey, 'X']}
                    title={i18n.t("censoringPlayerContent")}
                    description={i18n.t("censoringPlayerContentDescription")}>
                    <Select
                        onValueChange={handlePlayerContentCensorshipCommand}
                        defaultValue={playerContentCensorshipCommand.toString()}
                        value={playerContentCensorshipCommand.toString()}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder={i18n.t("selectBehavior")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {selectItemBehavior.map((item, index) => <SelectItem key={index} disabled={item.disabled} value={item.value.toString()}>{item.text}</SelectItem>)}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </SettingsCard>
            </div>
        </div>
    );
}