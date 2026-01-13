import './lib/i18n';
import { useEffect, useState } from 'react';
import { createRoot } from "react-dom/client";
import { getPageData } from './utils/json-page-data';
import { useTranslation } from 'react-i18next';
import BackgroundGradient from './components/BackgroundGradient';
import { isValidValue } from './utils/helpers';
import { Spinner } from './components/ui/spinner';
import { PostMessageSource } from './enums/post-command';

const App = () => {
    const { t } = useTranslation();
    const [text, setText] = useState<string | undefined>(undefined);
    const [isSpinner, setSpinner] = useState<boolean>(true);

    useEffect(() => {
        const pageData = getPageData();
        window.history.replaceState(null, '', window.location.href.split('?')[0]);

        if (!pageData?.success) {
            setText(t(pageData.lang_key));
            setSpinner(false);
            return;
        }

        if (!isValidValue(pageData?.id) || !isValidValue(pageData?.token) || !isValidValue(pageData?.target)) {
            setText(t("auth.dataMissing"));
            setSpinner(false);
            return;
        }

        /**
         * Handles incoming postMessage events.
         * If the message is from the "auth" source, displays a success message.
         * @param {MessageEvent} event - The message event object.
         */
        const onMessage = (event: MessageEvent) => {
            if (event.data?.source !== `movietimecode:${pageData.target}`) return;
            switch (event.data?.type) {
                case "success":
                    setText(t('auth.completedSuccessfully'));
                    setSpinner(false);
                    break;
                case "error":
                    setText(t('auth.error'));
                    setSpinner(false);
                    break;
                default:
                    break;
            }
        };

        // Post the authentication data to the window after a short delay
        setTimeout(() => window.postMessage({
            source: PostMessageSource.SERVER,
            auth: {
                id: pageData.id,
                token: pageData.token
            }
        }, '*'), 800);

        // Timeout for authentication process
        setTimeout(() => setText(t("auth.timeout")), 180000);

        // Listen for messages from the window
        window.addEventListener("message", onMessage);

        return () => {
            window.removeEventListener("message", onMessage);
        };
    }, []);

    return (<>
        <title>{t("auth.extensionTitle")}</title>
        <div className="min-h-screen p-4 w-full relative flex items-center justify-center">
            {!isSpinner && text && <h1 className="text-lg sm:text-2xl font-semibold text-center">{text}</h1>}
            {isSpinner && <Spinner className="size-26" />}

            <BackgroundGradient />
        </div>
    </>);
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}


