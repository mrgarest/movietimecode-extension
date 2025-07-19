import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { StorageDefault } from '@/utils/storage-options'
import { TSettings } from '@/types/storage'
import { Input } from '@/app/components/ui/input';
import config from '../../config.json';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import OBSClient, { OBSType } from "@/lib/obs-client"
import { Button } from "@/app/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/app/components/ui/form"
import toast from 'react-hot-toast';
import SettingsCard from '@/app/components/settings-card';
import { cn } from '@/lib/utils';

const formSchemaConnection = z.object({
    host: z.string().ip(),
    port: z.number().min(1),
    auth: z.string().min(1),
    type: z.string().min(1),
});

const formSchemaScene = z.object({
    censorScene: z.string().min(1).max(32)
});
export default function OBSControl() {
    const [settings, setSettings] = useState<TSettings>({});
    const [isConnectionEnabled, setConnectionEnabled] = useState<boolean>(true);
    const [isSceneEnabled, setSceneEnabled] = useState<boolean>(false);
    const [isTestEnabled, setTestEnabled] = useState<boolean>(false);
    const [getTestLogs, setTestLog] = useState<{
        ok: boolean,
        msg: string
    }[]>([]);

    const formConnection = useForm<z.infer<typeof formSchemaConnection>>({
        resolver: zodResolver(formSchemaConnection),
        defaultValues: {
            host: '127.0.0.1',
            port: 0,
            auth: '',
            type: ''
        },
    });

    const formScene = useForm<z.infer<typeof formSchemaScene>>({
        resolver: zodResolver(formSchemaScene),
        defaultValues: {
            censorScene: StorageDefault.obsCensorScene
        },
    });

    useEffect(() => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get('settings', (result) => {
                const curentSettings: TSettings = result.settings ?? {};

                if (curentSettings.obsClient) {
                    formConnection.setValue('host', curentSettings.obsClient.host);
                    formConnection.setValue('port', curentSettings.obsClient.port);
                    formConnection.setValue('auth', curentSettings.obsClient.auth);
                    formConnection.setValue('type', curentSettings.obsClient.type);
                    setTestEnabled(true);
                    setSceneEnabled(true);
                } else curentSettings.obsClient = null;

                if (!curentSettings.obsCensorScene) curentSettings.obsCensorScene = StorageDefault.obsCensorScene;
                else formScene.setValue('censorScene', curentSettings.obsCensorScene);

                setSettings(curentSettings)
            });
        } else {
            console.warn("chrome.storage is not available.");
        }
    }, []);

    const setStorage = (settings: TSettings, callback: () => void) => {
        setSettings(settings);
        chrome.storage.sync.set({ settings: settings }, callback);
    }

    const setEnabledButtons = (enabled: boolean) => {
        setSceneEnabled(enabled);
        setTestEnabled(enabled);
        setConnectionEnabled(enabled);
    };

    const handleConnection = async (values: z.infer<typeof formSchemaConnection>) => {

        if (!isConnectionEnabled) return;
        try {
            setEnabledButtons(false);
            settings.obsClient = {
                type: values.type,
                host: values.host,
                port: values.port,
                auth: values.auth,
            };
            const obsClient = new OBSClient(settings.obsClient);
            obsClient.onError((_msg) => {
                setConnectionEnabled(true);
            });
            // obsClient.onClose((_msg) => {
            //     setConnectionEnabled(true);
            // });

            const isConnected = await obsClient.connect();
            obsClient.disconnect();
            if (isConnected) {
                setStorage(settings, () => {
                    toast.success("OBS успішно підключено")
                    setEnabledButtons(true);
                });
                return;
            }
        } catch (e) {

        }
        toast.error("Не вдалося встановити з'єднання!");
        settings.obsClient = null;
        setConnectionEnabled(true);
    }

    const handleScene = async (values: z.infer<typeof formSchemaScene>) => {
        if (!isSceneEnabled) return;
        if (!settings.obsClient) {
            toast.error("Не вдалося встановити з'єднання!");
            return;
        }
        try {
            setEnabledButtons(false);

            const obsClient = new OBSClient(settings.obsClient);
            obsClient.onError((_msg) => {
                setEnabledButtons(true);
            });

            const isConnected = await obsClient.connect();
            if (!isConnected) {
                toast.error("Не вдалося встановити з'єднання!");
                obsClient.disconnect();
                setEnabledButtons(true);
                return;
            }

            const scenes = await obsClient.getScene();
            if (!scenes) {
                toast.error(`Не вдалося отримати сцени`);
                obsClient.disconnect();
                setEnabledButtons(true);
                return;
            }

            const censorScene = await obsClient.findScene(values.censorScene, scenes) || null;
            if (!censorScene) {
                toast.error(`Не вдалося знайти сцену: ${values.censorScene}`);
                obsClient.disconnect();
                setEnabledButtons(true);
                return;
            }

            obsClient.disconnect();

            settings.obsCensorScene = values.censorScene;
            setStorage(settings, () => {
                toast.success("Нову сцену успішно підключено");
                setEnabledButtons(true);
            });

            return;
        } catch (e) {
            if (config.debug) { console.error(e); }
            toast.error("Виникла невідома помилка!");
            setEnabledButtons(true);
        }
    }

    const delay = (m: number) => new Promise((resolve) => setTimeout(resolve, m));

    const handleTest = async () => {
        if (!isTestEnabled) return;
        if (!settings.obsClient) {
            toast.error("Не вдалося встановити з'єднання!");
            return;
        }
        setEnabledButtons(false);
        setTestLog([]);

        try {
            const obsClient = new OBSClient(settings.obsClient);
            obsClient.onError((_msg) => {
                setEnabledButtons(true);
            })

            const isConnected = await obsClient.connect();
            if (isConnected) {
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: "OBS успішно підключено" }]);
                const scenes = await obsClient.getScene();
                if (!scenes) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: "Не вдалося знайти сцени" }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }

                const obsCensorScene = settings.obsCensorScene;
                const censorScene = await obsClient.findScene(obsCensorScene!, scenes);
                if (!censorScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: `Не вдалося знайти сцену: ${obsCensorScene}` }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: `Сцену "${obsCensorScene}" знайдено` }]);

                const activeScene = await obsClient.getActiveScene();
                if (!activeScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: `Не вдалося знайти активну сцену` }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                if (activeScene.id == censorScene.id) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: `Виберіть будь-яку іншу сцену в OBS і повторіть тест` }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: `Сцену "${activeScene.name}" знайдено` }]);

                const s = 10000;

                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: "Пауза ..." }]);
                await delay(s);
                let isSetScene = await obsClient.setActiveScene(censorScene);

                if (!isSetScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: `Не вдалося показти сцену: ${obsCensorScene}` }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: `Активовано сцену: ${obsCensorScene}` }]);

                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: "Пауза ..." }]);
                await delay(s);
                isSetScene = await obsClient.setActiveScene(activeScene);

                if (!isSetScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: `Не вдалося показти сцену: ${activeScene.name}` }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: `Активовано сцену: ${activeScene.name}` }]);

                obsClient.disconnect();

                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: "Тест успішно пройдено" }]);
            } else {
                obsClient.disconnect();
                setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: "Не вдалося встановити з'єднання" }]);
            }
        } catch (e) {
            if (config.debug) { console.error(e); }
            setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: "Виникла невідома помилка!" }]);
        }
        setEnabledButtons(true);
    }

    const sceneName = () => (<code className="font-semibold bg-neutral-700 px-1 py-0.5 rounded-sm">{settings.obsCensorScene || StorageDefault.obsCensorScene}</code>)

    const guideLink = (text: string, image: string) => <a href={`/images/guide/${image}`} target="_blank" className="text-link">{text}</a>;

    return (
        <div className="space-y-8">
            <h1 className="text-h1">Управління OBS</h1>
            <Form {...formConnection}>
                <form onSubmit={formConnection.handleSubmit(handleConnection)} className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-xl font-bold">Підключення</h4>
                        <div className="text-xs text-muted font-medium">Щоб розширення могло керувати OBS, необхідно налаштувати підключення OBS до цього розширення.</div>
                        <div className="text-xs text-muted font-medium">Інструкція щодо отримання авторизаційних даних для: {guideLink('Streamlabs', 'streamlabs.png')}, {guideLink('OBS Studio', 'obsstudio.png')}.</div>
                    </div>
                    <FormField
                        control={formConnection.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Тип OBS</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger className="w-full order-3 sm:order-2 max-sm:col-span-2">
                                            <SelectValue placeholder="Виберіть тип OBS" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={OBSType.streamlabs}>Streamlabs</SelectItem>
                                        <SelectItem value={OBSType.obsstudio}>OBS Studio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                            <FormField
                                control={formConnection.control}
                                name="host"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Хост</FormLabel>
                                        <FormControl>
                                            <Input readOnly placeholder='127.0.0.1' {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formConnection.control}
                                name="port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Порт</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''}
                                                onChange={(e) => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <FormField
                        control={formConnection.control}
                        name="auth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Пароль/Токен</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={!isConnectionEnabled}>Підключити</Button>
                    <hr />
                </form>
            </Form>
            <Form {...formScene}>
                <form onSubmit={formScene.handleSubmit(handleScene)} className="space-y-4">
                    <h4 className="text-xl font-bold">Сцена</h4>
                    <FormField
                        control={formScene.control}
                        name="censorScene"
                        render={({ field }) => (
                            <FormItem>
                                <SettingsCard
                                    title="Сцена цензури"
                                    description="Введіть назву сцени, яка буде використовуватися для цензури.">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                </SettingsCard>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={!isSceneEnabled}>Підключити</Button>
                    <hr />
                </form>
            </Form>
            <div className="space-y-4">
                <h4 className="text-xl font-bold">Тестування</h4>
                <div className="space-y-2 font-medium">
                    <div className="text-base"> Інструкція для тестування переключення сцен:</div>
                    <ol className="list-decimal text-sm pl-4 space-y-1">
                        <li>Перед початком тестування переконайтесь, що у вас є сцена з назвою {sceneName()}. Якщо її немає, створіть нову сцену з таким ім’ям.</li>
                        <li>Виберіть будь-яку іншу сцену, яка буде вашою початковою сценою для тестування.</li>
                        <li>Запустіть тестування. Через 10 секунд поточну сцену буде змінено на сцену {sceneName()}.</li>
                        <li>Через ще 10 секунд сцена автоматично повернеться до попередньої активної сцени.</li>
                    </ol>
                </div>
                <Button onClick={handleTest} disabled={!isTestEnabled}>Запустити тест</Button>
                {getTestLogs.length > 0 && (
                    <div className="bg-secondary text-xs font-semibold flex flex-col gap-0.5 p-2 rounded-md border">
                        {getTestLogs.map((log, index) => (
                            <code key={index} className={cn(log.ok ? "text-green-500" : "text-red-500")}>{log.msg}</code>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}