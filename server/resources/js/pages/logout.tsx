import { useUserStore } from "@/store/useUserStore";

export default function LogoutPage() {
    const { logout } = useUserStore();
    logout();

    return <></>
};