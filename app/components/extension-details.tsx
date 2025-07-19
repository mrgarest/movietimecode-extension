import config from '../../config.json';

export const ExtensionDetails = () => {
    return (
        <div className="text-[10px] text-muted text-center font-semibold mt-8 pb-4 space-y-0.5">
            <div>
                <a href="https://movietimecode.mrgarest.com/privacy" target="_blank" rel="noopener noreferrer" className="text-link">Політика конфіденційності</a>
            </div>
            <div>Movie Timecode</div>
            <div>v{config.version} (beta)</div>
        </div>
    );
}
