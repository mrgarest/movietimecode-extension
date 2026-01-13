import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { UserRole } from "@/enums/user";
import { SpinnerFullScreen } from "./ui/spinner";

const ProtectedRoute = () => {
    const { user, isInitialized } = useUserStore();

    if (!isInitialized) {
        return <SpinnerFullScreen />;
    }

    if (!user || user.roleId !== UserRole.admin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;