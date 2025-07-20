import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { StorageDefault } from '@/utils/storage-options'
import { TSettings } from '@/types/storage'
import { Input } from '@/app/components/ui/input';
import config from 'config';
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
import i18n from '@/lib/i18n';

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
        } else if (config.debug) {
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
                    toast.success(i18n.t("obsSuccessfullyConnected"))
                    setEnabledButtons(true);
                });
                return;
            }
        } catch (e) {

        }
        toast.error(i18n.t("connectionFailed"));
        settings.obsClient = null;
        setConnectionEnabled(true);
    }

    const handleScene = async (values: z.infer<typeof formSchemaScene>) => {
        if (!isSceneEnabled) return;
        if (!settings.obsClient) {
            toast.error(i18n.t("connectionFailed"));
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
                toast.error(i18n.t("connectionFailed"));
                obsClient.disconnect();
                setEnabledButtons(true);
                return;
            }

            const scenes = await obsClient.getScene();
            if (!scenes) {
                toast.error(i18n.t("failedGetScenes"));
                obsClient.disconnect();
                setEnabledButtons(true);
                return;
            }

            const censorScene = await obsClient.findScene(values.censorScene, scenes) || null;
            if (!censorScene) {
                toast.error(i18n.t("unableFindScene", { scene: values.censorScene }));
                obsClient.disconnect();
                setEnabledButtons(true);
                return;
            }

            obsClient.disconnect();

            settings.obsCensorScene = values.censorScene;
            setStorage(settings, () => {
                toast.success(i18n.t("newSceneSuccessfullyConnected"));
                setEnabledButtons(true);
            });

            return;
        } catch (e) {
            if (config.debug) { console.error(e); }
            toast.error(i18n.t("unknownError"));
            setEnabledButtons(true);
        }
    }

    const delay = (m: number) => new Promise((resolve) => setTimeout(resolve, m));

    const handleTest = async () => {
        if (!isTestEnabled) return;
        if (!settings.obsClient) {
            toast.error(i18n.t("connectionFailed"));
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
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("obsSuccessfullyConnected") }]);
                const scenes = await obsClient.getScene();
                if (!scenes) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("unableFindScenes") }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }

                const obsCensorScene = settings.obsCensorScene;
                const censorScene = await obsClient.findScene(obsCensorScene!, scenes);
                if (!censorScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("unableFindScene", { scene: obsCensorScene }) }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("sceneFound", { scene: obsCensorScene }) }]);

                const activeScene = await obsClient.getActiveScene();
                if (!activeScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("unableFindActiveScene") }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                if (activeScene.id == censorScene.id) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("selectOtherSceneAndRepeatTest") }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("sceneFound", { scene: activeScene.name }) }]);

                const s = 10000;

                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("pause") + " ..." }]);
                await delay(s);
                let isSetScene = await obsClient.setActiveScene(censorScene);

                if (!isSetScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("unableDisplayScene", { scene: obsCensorScene }) }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("sceneActivated", { scene: obsCensorScene }) }]);

                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("pause") + " ..." }]);
                await delay(s);
                isSetScene = await obsClient.setActiveScene(activeScene);

                if (!isSetScene) {
                    setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("unableDisplayScene", { scene: activeScene.name }) }]);
                    obsClient.disconnect();
                    setEnabledButtons(true);
                    return;
                }
                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("sceneActivated", { scene: activeScene.name }) }]);

                obsClient.disconnect();

                setTestLog((prevLogs) => [...prevLogs, { ok: true, msg: i18n.t("testSuccessfullyPassed") }]);
            } else {
                obsClient.disconnect();
                setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("connectionFailed") }]);
            }
        } catch (e) {
            if (config.debug) { console.error(e); }
            setTestLog((prevLogs) => [...prevLogs, { ok: false, msg: i18n.t("unknownError") }]);
        }
        setEnabledButtons(true);
    }

    const sceneName = settings.obsCensorScene || StorageDefault.obsCensorScene

    const guideLink = (text: string, image: string) => <a href={`/images/guide/${image}`} target="_blank" className="text-link">{text}</a>;

    return (
        <div className="space-y-8">
            <h1 className="text-h1">{i18n.t('obsManagement')}</h1>
            <Form {...formConnection}>
                <form onSubmit={formConnection.handleSubmit(handleConnection)} className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-xl font-bold">{i18n.t("connection")}</h4>
                        <div className="text-xs text-muted font-medium">{i18n.t("descriptionObsConnectionManagement")}</div>
                        <div className="text-xs text-muted font-medium">{i18n.t("obsConnectionInstructions")} {guideLink('Streamlabs', 'streamlabs.png')}, {guideLink('OBS Studio', 'obsstudio.png')}.</div>
                    </div>
                    <FormField
                        control={formConnection.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{i18n.t("obsType")}</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger className="w-full order-3 sm:order-2 max-sm:col-span-2">
                                            <SelectValue placeholder={i18n.t("selectObsType")} />
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
                                        <FormLabel>{i18n.t("host")}</FormLabel>
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
                                        <FormLabel>{i18n.t("port")}</FormLabel>
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
                                <FormLabel>{i18n.t("passwordToken")}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={!isConnectionEnabled}>{i18n.t("connect")}</Button>
                    <hr />
                </form>
            </Form>
            <Form {...formScene}>
                <form onSubmit={formScene.handleSubmit(handleScene)} className="space-y-4">
                    <h4 className="text-xl font-bold">{i18n.t("scene")}</h4>
                    <FormField
                        control={formScene.control}
                        name="censorScene"
                        render={({ field }) => (
                            <FormItem>
                                <SettingsCard
                                    title={i18n.t("censorshipScene")}
                                    description={i18n.t("enterNameScene")}>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                </SettingsCard>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={!isSceneEnabled}>{i18n.t("connect")}</Button>
                    <hr />
                </form>
            </Form>
            <div className="space-y-4">
                <h4 className="text-xl font-bold">{i18n.t("testing")}</h4>
                <div className="space-y-2 font-medium">
                    <div className="text-base">{i18n.t("instructionsTestingSceneSwitching")}</div>
                    <ol className="list-decimal text-sm pl-4 space-y-1">
                        <li>{i18n.t("instructionsTestingSceneSwitchingDescription.0", { scene: sceneName })}</li>
                        <li>{i18n.t("instructionsTestingSceneSwitchingDescription.1")}</li>
                        <li>{i18n.t("instructionsTestingSceneSwitchingDescription.2", { scene: sceneName })}</li>
                        <li>{i18n.t("instructionsTestingSceneSwitchingDescription.3")}</li>
                    </ol>
                </div>
                <Button onClick={handleTest} disabled={!isTestEnabled}>{i18n.t("runTest")}</Button>
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