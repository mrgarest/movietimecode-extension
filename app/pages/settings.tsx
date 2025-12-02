import { useEffect, useMemo, useState } from 'react';
import SettingsCard from '@/app/components/settings-card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { BlurPower, TimecodeAction } from '@/enums/timecode';
import { Input } from '@/app/components/ui/input';
import { StorageDefault } from '@/utils/storage-options';
import { TSettings } from '@/types/storage'
import config from "config";
import i18n from '@/lib/i18n';

export default function Settings() {
    const [settings, setSettings] = useState<TSettings>({});
    const [timeBuffer, setTimeBuffer] = useState<number>(StorageDefault.timeBuffer);
    const [blurPower, setBlurPower] = useState<BlurPower>(StorageDefault.blurPower);
    const [nudity, setNudity] = useState<TimecodeAction>(StorageDefault.nudity);
    const [sexualContentWithoutNudity, setSexualContentWithoutNudity] = useState<TimecodeAction>(StorageDefault.sexualContentWithoutNudity);
    const [violence, setViolence] = useState<TimecodeAction>(StorageDefault.violence);
    const [sensitiveExpressions, setSensitiveExpressions] = useState<TimecodeAction>(StorageDefault.sensitiveExpressions);

    useEffect(() => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get('settings', (result) => {
                const curentSettings: TSettings = result.settings ?? {};
                curentSettings.timeBuffer = curentSettings.timeBuffer as number ?? StorageDefault.timeBuffer;
                curentSettings.blurPower = curentSettings.blurPower as BlurPower ?? StorageDefault.blurPower;
                curentSettings.nudity = curentSettings.nudity as TimecodeAction ?? StorageDefault.nudity;
                curentSettings.sexualContentWithoutNudity = curentSettings.sexualContentWithoutNudity as TimecodeAction ?? StorageDefault.sexualContentWithoutNudity;
                curentSettings.violence = curentSettings.violence as TimecodeAction ?? StorageDefault.violence;
                curentSettings.sensitiveExpressions = curentSettings.sensitiveExpressions as TimecodeAction ?? StorageDefault.sensitiveExpressions;

                setSettings(curentSettings);

                setTimeBuffer(curentSettings.timeBuffer);
                setBlurPower(curentSettings.blurPower);
                setNudity(curentSettings.nudity);
                setViolence(curentSettings.violence);
                setSensitiveExpressions(curentSettings.sensitiveExpressions);
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

    const handleTimeBuffer = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = Math.max(0, Math.min(59, parseInt(event.target.value)));
        setTimeBuffer(value);
        updateSettings({ timeBuffer: value });
    };

    const handleBlurPower = (value: BlurPower) => {
        setBlurPower(value);
        updateSettings({ blurPower: value });
    };

    const handleNudity = (value: string) => {
        const n = Number(value);
        setNudity(n);
        updateSettings({ nudity: n as TimecodeAction });
    };

    const handleSexualContentWithoutNudity = (value: string) => {
        const n = Number(value);
        setSexualContentWithoutNudity(n);
        updateSettings({ sexualContentWithoutNudity: n as TimecodeAction });
    };

    const handleViolence = (value: string) => {
        const n = Number(value);
        setViolence(n);
        updateSettings({ violence: n as TimecodeAction });
    };

    const handleSensitiveExpressions = (value: string) => {
        const n = Number(value);
        setSensitiveExpressions(n);
        updateSettings({ sensitiveExpressions: n as TimecodeAction });
    };

    const getSelectItemBehavior = (settings: TSettings) => [
        { disabled: false, value: TimecodeAction.noAction, text: i18n.t("inaction") },
        { disabled: false, value: TimecodeAction.blur, text: i18n.t("blur") },
        { disabled: false, value: TimecodeAction.hide, text: i18n.t("hide") },
        { disabled: false, value: TimecodeAction.skip, text: i18n.t("skip") },
        { disabled: false, value: TimecodeAction.pause, text: i18n.t("pause") },
        { disabled: false, value: TimecodeAction.mute, text: i18n.t("mute") },
        {
            disabled: settings.obsClient == null || settings.obsCensorScene == null,
            value: TimecodeAction.obsSceneChange,
            text: i18n.t("obsSceneSwitching"),
        },
    ];
    const selectItemBehavior = useMemo(() => getSelectItemBehavior(settings), [settings]);

    return (
        <div className="space-y-8">
            <h1 className="text-h1">{i18n.t('settings')}</h1>
            <div className="space-y-4">
                <SettingsCard
                    title={i18n.t("blurStrength")}
                    description={i18n.t("blurStrengthDescription")}>
                    <Select
                        onValueChange={handleBlurPower}
                        defaultValue={blurPower}
                        value={blurPower}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder={i18n.t("selectBlurStrength")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value={BlurPower.light}>{i18n.t("blurStrengthOptions.light")}</SelectItem>
                                <SelectItem value={BlurPower.base}>{i18n.t("blurStrengthOptions.standard")}</SelectItem>
                                <SelectItem value={BlurPower.strong}>{i18n.t("blurStrengthOptions.strong")}</SelectItem>
                                <SelectItem value={BlurPower.max}>{i18n.t("blurStrengthOptions.maximum")}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </SettingsCard>
                <hr />
                <SettingsCard
                    title={i18n.t("timeBuffer")}
                    description={i18n.t("timeBufferDescription")}>
                    <Input type="number" min={0} max={59} value={timeBuffer} onChange={handleTimeBuffer} />
                </SettingsCard>
                <hr />
            </div>
            <div className="space-y-4">
                <h4 className="text-xl font-bold">{i18n.t("behavior")}</h4>
                <SettingsCard
                    title={i18n.t("nudity")}
                    description={i18n.t("nudityDescription")}>
                    <Select
                        onValueChange={handleNudity}
                        defaultValue={nudity.toString()}
                        value={nudity.toString()}>
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
                <hr />
                <SettingsCard
                    title={i18n.t("sexualContentWithoutNudity")}
                    description={i18n.t("sexualContentWithoutNudityDescription")}>
                    <Select
                        onValueChange={handleSexualContentWithoutNudity}
                        defaultValue={sexualContentWithoutNudity.toString()}
                        value={sexualContentWithoutNudity.toString()}>
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
                <hr />
                <SettingsCard
                    title={i18n.t("violence")}
                    description={i18n.t("violenceDescription")}>
                    <Select
                        onValueChange={handleViolence}
                        defaultValue={violence.toString()}
                        value={violence.toString()}>
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
                <hr />
                <SettingsCard
                    title={i18n.t("sensitiveExpressions")}
                    description={i18n.t("sensitiveExpressionsDescription")}>
                    <Select
                        onValueChange={handleSensitiveExpressions}
                        defaultValue={sensitiveExpressions.toString()}
                        value={sensitiveExpressions.toString()}>
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