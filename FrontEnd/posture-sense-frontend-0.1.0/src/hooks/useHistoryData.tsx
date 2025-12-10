import { useState, useEffect } from 'react';
import type { IPosture } from '../models/posture';
import { getPostureService } from '../services/postureServices';

export function useHistoryData(userId?: number) {
  const [historyData, setHistoryData] = useState<IPosture[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!userId) {
      setLoading(false);
      setError("No user ID provided");
      return;
    }

    setLoading(true);

    getPostureService(userId).then((data) => {
      if (!mounted) return;
      const array = Array.isArray(data) ? data : data.data;
      setHistoryData(array ?? []);
      setError(null);
    })
    .catch((err) => {
      if (!mounted) return;
      setError(err?.message ?? "Error al obtener el historial");
      setHistoryData(null);
    })
    .finally(() => {
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [userId]);

  const refresh = async (userId: number) => {
    setLoading(true);
    try {
      const d = await getPostureService(userId);
      const array = Array.isArray(d) ? d : d.data;
      setHistoryData(array ?? []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return { historyData, loading, error, refresh };
}