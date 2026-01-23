import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PrivacyPage from "./pages/privacy";
import HomePage from "./pages";
import NotFoundPage from "./pages/not-found";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/dashboard";
import LogoutPage from "./pages/logout";
import TimecodePage from "./pages/dashboard/timecode";
import MovieDetailPage from "./pages/movies/detail";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            { index: true, element: <HomePage /> },
            {
                path: "movies",
                children: [
                    { path: ":id", element: <MovieDetailPage /> }
                ]
            },
            { path: "/privacy", element: <PrivacyPage /> },
            { path: "/logout", element: <LogoutPage /> },
            { path: "*", element: <NotFoundPage /> }
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/dashboard",
                element: <DashboardLayout />,
                children: [
                    { index: true, element: <DashboardPage /> },
                    { path: 'timecodes', element: <TimecodePage /> },
                ],
            },
        ],
    },
]);

export default router;