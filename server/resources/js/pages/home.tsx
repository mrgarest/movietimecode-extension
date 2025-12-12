import { useTranslation } from "react-i18next";

export default function Home() {
    const { t } = useTranslation();
    return (<>
        <title>Movie Timecode</title>
        <meta name="description" content={t('homePage.description')} />
        <div className="flex items-center justify-center px-4">
            <div className="pb-20">
                <div className="size-24 relative mx-auto select-none pointer-events-none">
                    <img src="/images/icon.gif" className="size-full rounded-full absolute z-[1]" />
                    <div className="size-18 bg-[#598e3f] blur-xl rounded-full absolute z-0 -left-1 -bottom-2 opacity-45" />
                </div>
                <h1 className="text-5xl min-[370px]:text-6xl min-[420px]:text-7xl text-center font-semibold mt-6 mb-3 text-shadow-lg/40  text-shadow-white/30 flex flex-col sm:flex-row sm:gap-4"><span>Movie</span><span>Timecode</span></h1>
                <p className="max-w-lg mx-auto text-center text-sm sm:text-base font-normal text-white/70 text-shadow-lg/20  text-shadow-white/20">{t('homePage.description')}</p>
                <div className="mt-5 flex justify-center">
                    <a href="https://chromewebstore.google.com/detail/oicfghfgplgplodmidellkbfoachacjb?utm_source=movietimecod" target="_blank" rel="noopener noreferrer"
                        className="flex gap-3 items-center bg-white shadow-xl/20 shadow-foreground/50 px-3 py-1.5 rounded-lg hover:opacity-80 duration-300 select-none">
                        <img
                            className="size-8 pointer-events-none"
                            src="/images/google-chrome-web-store_icon.svg" />
                        <div className="pointer-events-none">
                            <div className="text-sm text-black/80 font-bold">{t("download")}</div>
                            <div className="text-xs text-black/60 font-medium">Chrome Web Store</div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </>);
};