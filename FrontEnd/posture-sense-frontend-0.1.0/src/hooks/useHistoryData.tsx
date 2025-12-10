import { useState, useEffect, use } from 'react';
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
      const mappedData = data.map(item => ({
        ...item,
        fechaRegistro: item.fechaRegistro || (item as any).fecha_registro,
        numeroAlertas: item.numeroAlertas || (item as any).numero_alertas,
      }));
      setHistoryData(mappedData);
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
      setHistoryData(d);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return { historyData, loading, error, refresh };
}