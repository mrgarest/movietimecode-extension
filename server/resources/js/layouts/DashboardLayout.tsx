import { Outlet } from "react-router-dom";
import SideNavbar from "@/components/dashboard/SideNavbar";

export default function DashboardLayout() {
    return (
        <>
            <meta name="robots" content="noindex, nofollow" />
            <div className="container grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 min-h-screen">
                <SideNavbar />
                <main className="pt-6"><Outlet /></main>
            </div>
        </>
    );
}

