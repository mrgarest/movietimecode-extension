import { ServerResponseError } from "@/interfaces/response";
import Cookies from "js-cookie";

interface FetchOptions {
    method?: "GET" | "POST" | "DELETE";
    body?: any | undefined;
    headers?: Record<string, string>;
}

export class ApiError extends Error {
    status: number;
    error: ServerResponseError | null;

    constructor(
        message: string,
        status: number,
        error: ServerResponseError | null,
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.error = error;
    }
}

export const fetchApi = async <T>(
    url: string,
    options: FetchOptions = {
        method: "GET",
    },
): Promise<T> => {
    const isGet = options.method === "GET";
    let queryString = "";

    if (isGet && options.body && typeof options.body === "object") {
        const params = Object.fromEntries(
            Object.entries(options?.body)
                .filter(([_, value]) => value != null)
                .map(([key, value]) => [key, String(value)]),
        );

        const searchParams = new URLSearchParams(params).toString();
        queryString = searchParams ? `?${searchParams}` : "";
    }

    options.headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
    };

    const accessToken = Cookies.get("uat");

    if (accessToken) {
        options.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const xsrfToken = Cookies.get("XSRF-TOKEN");
    if (xsrfToken && !isGet) {
        options.headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
    }

    const response = await fetch(`${url}${queryString}`, {
        method: options.method,
        credentials: "include",
        headers: options.headers,
        body: !isGet && options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(
            data?.erorr?.message ?? "Response not ok",
            response.status,
            data.erorr as ServerResponseError,
        );
    }

    return data as T;
};
