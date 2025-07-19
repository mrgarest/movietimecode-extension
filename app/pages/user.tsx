import { Button } from "@/app/components/ui/button";
import { logIn } from "@/utils/navigation";
import { useEffect, useRef, useState } from "react";
import { TUser } from "types/user";
import { getUser, logOut } from "@/utils/auth";
import config from "../../config.json";

export default function User() {
    const [user, setUser] = useState<TUser | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogIn = async () => {
        logIn();

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        let count: number = 0;
        intervalRef.current = setInterval(async () => {
            const user: TUser | undefined = await getUser();
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
        await logOut();
        setUser(null);
    };

    useEffect(() => {
        /**
         * Checks authorization and launches a method to retrieve data from the backend.
         */
        const init = async () => {
            try {
                const user: TUser | undefined = await getUser();
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
        <div className="space-y-8">
            <h1 className="text-h1">Користувач</h1>
            {user == null ? <div className="space-y-4">
                <p className="description">Для доступу до певних функцій розширення необхідно пройти авторизацію через Twitch. Детальніше про те, які дані будуть використані, можна дізнатися в <a href="https://movietimecode.mrgarest.com/privacy" target="_blank" rel="noopener noreferrer" className="text-link">Політиці конфіденційності</a>.</p>
                <div><Button onClick={handleLogIn}>Увійти через Twitch</Button></div>
            </div>
                : <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img className="bg-primary/10 size-12 flex items-center justify-center rounded-full" src="/images/avatar.png" />
                        <div className="text-xl text-foreground font-bold">{user.username}</div>
                    </div>
                    <Button variant="destructive" onClick={handleLogOut}>Вийти</Button>
                </div>}
        </div>
    );
}