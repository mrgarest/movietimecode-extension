import { Outlet } from "react-router-dom";
import HeaderNavbar from "../components/HeaderNavbar";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";

export default function MainLayout() {
    return (
        <div className="min-h-screen grid grid-rows-[1fr_auto] sm:grid-rows-[auto_1fr_auto] max-sm:pt-4 w-full relative">
            <HeaderNavbar />
            <Outlet />
            <Footer />
            
            <BackgroundGradient />
        </div>
    );
}

