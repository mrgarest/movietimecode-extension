import { Routes, Route } from "react-router-dom";
import Settings from "./pages/settings";
import OBSControl from "./pages/obs-control";
import { SideNavLayout } from "@/app/components/layout";
import NotFound from "./pages/not-found";
import TimecodePage from "./pages/timecode";
import User from "./pages/user";

export default function App() {
    return (
        <Routes>
            <Route path="/settings" element={<SideNavLayout />}>
                <Route index element={<Settings />} />
                <Route path="obs-control" element={<OBSControl />} />
            </Route>
            <Route path="/" element={<SideNavLayout />}>
                <Route path="user" element={<User />} />
            </Route>
            <Route path="timecode" element={<TimecodePage />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}