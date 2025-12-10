import type { IPosture } from "../models/posture";

export const POSTURE_URL = "http://localhost:8000/api/usuarios/";

export const getPostureService = async (userId: number): Promise<IPosture[]> => {
    try {
        const response = await fetch(
            `${POSTURE_URL}${userId}/registros/`, {
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status} - ${text}`);
        }
        const data = await response.json();
        return data as IPosture[];
    } catch (error: any) {
        console.error("Error fetching posture data:", error);
        throw error;
    }
};

