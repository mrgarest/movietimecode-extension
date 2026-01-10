import { Button } from "@/app/components/ui/button";
import { login } from "@/utils/navigation";
import { useEffect, useRef, useState } from "react";
import { User } from "@/interfaces/user";
import { getUser, logout } from "@/utils/user";
import config from "config";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function UserPage() {
    const [user, setUser] = useState<User | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogIn = async () => {
        login();

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        let count: number = 0;
        intervalRef.current = setInterval(async () => {
            const user: User | undefined = await getUser();
            if (user) {
                setUser(user);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                return;
            }
            count++;
            if (count >= 50 && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }, 5000);
    };

    const handleLogOut = async () => {
        await logout();
        setUser(null);
    };

    useEffect(() => {
        /**
         * Checks authorization and launches a method to retrieve data from the backend.
         */
        const init = async () => {
            try {
                const user: User | undefined = await getUser();
                if (!user) {
                    return;
                }
                setUser(user);
            } catch (e) {
                if (config.debug) {
                    console.error(e);
                }
            }
        };
        init();
    }, []);

    return (
        <div className={cn(user == null ? "space-y-4" : "space-y-8")}>
            <div className="space-y-4">
                <h1 className="text-h1">{i18n.t('user')}</h1>
                {user == null && <p className="text-sm text-foreground font-normal" dangerouslySetInnerHTML={{
                    __html: i18n.t("authorizationDescription", {
                        url: config.privacyPolicyUrl,
                        interpolation: {
                            escapeValue: false,
                        },
                    })
                }} />}
            </div>

            {user == null && <div><Button onClick={handleLogIn}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitch-icon lucide-twitch"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" /></svg>{i18n.t("logInTwitch")}</Button></div>}

            {user != null && <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <img className="bg-primary/10 size-12 flex items-center justify-center rounded-full" src={user.picture ?? "/images/avatar.png"} />
                    <div className="text-xl text-foreground font-bold">{user.username}</div>
                </div>
                <Button variant="destructive" onClick={handleLogOut}>{i18n.t("logout")}</Button>
            </div>}
        </div>
    );
}