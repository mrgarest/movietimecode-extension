import { Outlet, ScrollRestoration } from "react-router-dom";
import SideNavbar from "@/components/dashboard/SideNavbar";
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout() {
    return (
        <>
            <ScrollRestoration />
            <meta name="robots" content="noindex, nofollow" />
            <div className="container grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 min-h-screen">
                <SideNavbar />
                <main className="pt-6"><Outlet /></main>
            </div>
            <Toaster
                position="top-right"
                reverseOrder={true}
            />
        </>
    );
}

