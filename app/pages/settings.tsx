import { useEffect, useMemo, useState } from 'react';
import SettingsCard from '@/app/components/settings-card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { BlurPower, TimecodeAction } from '@/enums/timecode';
import { Input } from '@/app/components/ui/input';
import { StorageDefault } from '@/utils/storage-options';
import { TSettings } from '@/types/storage'
import config from "../../config.json";

export default function Settings() {
    const [settings, setSettings] = useState<TSettings>({});
    const [timeBuffer, setTimeBuffer] = useState<number>(StorageDefault.timeBuffer);
    const [blurPower, setBlurPower] = useState<BlurPower>(StorageDefault.blurPower);
    const [nudity, setNudity] = useState<TimecodeAction>(StorageDefault.nudity);

    useEffect(() => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get('settings', (result) => {
                const curentSettings: TSettings = result.settings ?? {};
                curentSettings.timeBuffer = curentSettings.timeBuffer as number ?? StorageDefault.timeBuffer
                curentSettings.blurPower = curentSettings.blurPower as BlurPower ?? StorageDefault.blurPower
                curentSettings.nudity = curentSettings.nudity as TimecodeAction ?? StorageDefault.nudity

                setSettings(curentSettings)

                setTimeBuffer(curentSettings.timeBuffer);
                setBlurPower(curentSettings.blurPower);
                setNudity(curentSettings.nudity);

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

    const getSelectItemBehavior = (settings: TSettings) => [
        { disabled: false, value: TimecodeAction.noAction, text: 'Бездіяльність' },
        { disabled: false, value: TimecodeAction.blur, text: 'Розмити' },
        { disabled: false, value: TimecodeAction.hide, text: 'Приховати' },
        { disabled: false, value: TimecodeAction.skip, text: 'Пропустити' },
        { disabled: false, value: TimecodeAction.pause, text: 'Пауза' },
        { disabled: false, value: TimecodeAction.mute, text: 'Вимкнути звук' },
        {
            disabled: settings.obsClient == null || settings.obsCensorScene == null,
            value: TimecodeAction.obsSceneChange,
            text: 'Перемикання сцен OBS',
        },
    ];
    const selectItemBehavior = useMemo(() => getSelectItemBehavior(settings), [settings]);

    return (
        <div className="space-y-8">
            <h1 className="text-h1">Налаштування</h1>
            <div className="space-y-4">
                <SettingsCard
                    title="Сила розмиття"
                    description="Дозволяє застосувати ефект розмиття до плеєра під час відтворення таймкоду.">
                    <Select
                        onValueChange={handleBlurPower}
                        defaultValue={blurPower}
                        value={blurPower}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Виберіть силу розмиття" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value={BlurPower.light}>Легка</SelectItem>
                                <SelectItem value={BlurPower.base}>Стандартна</SelectItem>
                                <SelectItem value={BlurPower.strong}>Сильна</SelectItem>
                                <SelectItem value={BlurPower.max}>Максимальна</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </SettingsCard>
                <hr />
                <SettingsCard
                    title="Буфер часу"
                    description="Допомагає уникнути випадкового відображення небажаного контенту в різних версіях хронометражу фільму, додаючи додатковий часовий буфер до та після зазначеного таймкоду.">
                    <Input type="number" min={0} max={59} value={timeBuffer} onChange={handleTimeBuffer} />
                </SettingsCard>
                <hr />
            </div>
            <div className="space-y-4">
                <h4 className="text-xl font-bold">Поведінка</h4>
                <SettingsCard
                    title="Оголеність">
                    <Select
                        onValueChange={handleNudity}
                        defaultValue={nudity.toString()}
                        value={nudity.toString()}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Виберіть поведінку" />
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