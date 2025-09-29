import i18n from '@/lib/i18n';
import config from 'config';

export const ExtensionDetails = () => {
    return (
        <div className="text-[10px] text-muted text-center font-semibold mt-8 pb-4 space-y-0.5">
            <div>
                <a href="https://movietimecode.mrgarest.com/privacy" target="_blank" rel="noopener noreferrer" className="text-muted underline duration-300 hover:text-foreground">{i18n.t("privacyPolicy")}</a>
            </div>
            <div>{i18n.t("appName")}</div>
            <div>v{config.version}</div>
        </div>
    );
}
