import { useTranslation } from "react-i18next";
import MovieSanctionAddForm from "@/components/movies/MovieSanctionAddForm";
import { useState } from "react";
import { SpinnerFullScreen } from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";

export default function MovieSanctionAddPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setLoading] = useState<boolean>(false);

    return (
        <>
            <title>{t("reportSanction")}</title>
            <div>
                <h1 className="text-2xl font-bold mb-6">{t("reportSanction")}</h1>
                <MovieSanctionAddForm
                    onSuccess={() => navigate('/dashboard/movies/sanctions')}
                    onLoading={setLoading} />
                {isLoading && <SpinnerFullScreen />}
            </div>
        </>
    );
}