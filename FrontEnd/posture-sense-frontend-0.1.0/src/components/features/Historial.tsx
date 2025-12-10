import { Eye } from "lucide-react";
import { Table } from "../ui/table";
import { useHistoryData } from "../../hooks/useHistoryData";
import { useUserProfile } from "../../hooks/useUserProfile";
import { use, useEffect } from "react";

export function Historial() {
  const storedProfile = localStorage.getItem("postureCorrectUserProfile");
  //const userId = storedProfile ? JSON.parse(storedProfile).data.id : undefined;
  const userId = 1;
  const { historyData, loading, error, refresh } = useHistoryData(userId);

  useEffect(() => {
    console.log("Datos del historial:", historyData);
  }, [historyData]);

  // Recargar historial cada 30 segundos
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      refresh(userId);
      console.log("Historial recargado");
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [userId, refresh]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
        <div className="text-center py-8">Cargando historial...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
        <div className="text-center py-8 text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historial</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-gray-600">Fecha</th>
              <th className="px-6 py-4 text-left text-gray-600">Duración</th>
              <th className="px-6 py-4 text-left text-gray-600">
                Número de Alertas
              </th>
              <th className="px-6 py-4 text-left text-gray-600">Score (%)</th>
              <th className="px-6 py-4 text-left text-gray-600">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {historyData?.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900">
                  {row.fechaRegistro
                    ? new Date(row.fechaRegistro).toLocaleString()
                    : ""}
                </td>
                <td className="px-6 py-4 text-gray-900">{row.duracion}</td>
                <td className="px-6 py-4 text-gray-900">{row.numeroAlertas}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full ${
                      row.score >= 85
                        ? "bg-[#22C55E]/10 text-[#22C55E]"
                        : row.score >= 75
                        ? "bg-[#F97316]/10 text-[#F97316]"
                        : "bg-[#EF4444]/10 text-[#EF4444]"
                    }`}
                  >
                    {row.score}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="flex items-center gap-2 text-[#2563EB] hover:text-[#1d4ed8] transition-colors">
                    <Eye className="w-4 h-4" />
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
