import { useState, useMemo, useEffect } from "react";
import { Volume2, Vibrate, Save, User, Settings } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useUserProfile } from '../../hooks/useUserProfile';
import type { IUser } from "../../models/user";

export function Configuracion() {
  const { userProfile, isNewUser, createUserProfile, loading, error } = useUserProfile();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    edad: 0,
  });

  useEffect(() => {
    if (userProfile && !isNewUser) {
      console.log("Cargando datos del perfil de usuario en el formulario:", userProfile);
      setFormData({
        nombre: userProfile.nombre || "",
        apellido: userProfile.apellido || "",
        edad: userProfile.edad || 0,
      });
    }
  }, [userProfile, isNewUser]);

    // Estados para la configuración de Figma
  const [sensibilidad, setSensibilidad] = useState<"baja" | "media" | "alta">("media");
  const [sonidoActivado, setSonidoActivado] = useState(true);
  const [vibracionActivada, setVibracionActivada] = useState(false);

  // Calcular umbral automático basado en la edad
  //const umbralAutomatico = useMemo(() => {
  //  if (!userProfile) return 15;
  //  return userProfile.thresholds.neutral;
  //}, [userProfile]);

  // Función para manejar el guardado (solo creación)
  const handleSave = async () => {
    // Solo permitimos guardar si es un nuevo usuario, ya que no hay función de actualizar
    if (isNewUser) {
      try {
        await createUserProfile(formData);
        alert("Perfil creado correctamente");
      } catch (err: any) {
        alert(`Error al crear el perfil: ${err?.message || "Error desconocido"}`);
      }
    }
  };
  

  const handleReset = () => {
    if (userProfile) {
      setFormData({
        nombre: userProfile.nombre,
        apellido: userProfile.apellido,
        edad: userProfile.edad
      });
    }
  };

  const hasChanges = useMemo(() => {
    if (isNewUser) {
      // Si es un nuevo usuario, hay cambios si se ha llenado el formulario
      return formData.nombre !== "" || formData.apellido !== "" || formData.edad > 0;
    }
    if (!userProfile) return false;
    
    // Si es un usuario existente, compara con los datos del perfil
    return (
      formData.nombre !== userProfile.nombre ||
      formData.apellido !== userProfile.apellido ||
      formData.edad !== userProfile.edad
    );
  }, [formData, userProfile, isNewUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <div className="text-center py-8">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
      return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <div className="text-center py-8 text-red-600">
            Error al cargar el perfil: {error}
        </div>
      </div>
    );
  }

  // 3. ¡NO RENDERIZAR NADA MÁS SI NO HAY PERFIL!
  // Esto previene que el formulario se monte con datos vacíos.
  if (!userProfile && !isNewUser) {
    return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <div className="text-center py-8">No se encontró el perfil de usuario.</div>
        </div>
    );
  }

  const getAgeGroupDescription = (ageGroup: string) => {
    switch (ageGroup) {
      case 'CHILD': return 'Infante (0-12 años)';
      case 'TEEN': return 'Adolescente (13-17 años)';
      case 'ADULT': return 'Adulto (18-59 años)';
      case 'SENIOR': return 'Adulto Mayor (60+ años)';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {/* Indicador de cambios */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Tienes cambios sin guardar
          </p>
        </div>
      )}

      {/* Sección 1: Perfil de Usuario - Estilo Figma */}
      <Card className="p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
            <User className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isNewUser ? "Crear Perfil de Usuario" : "Perfil de Usuario"}
            </h2>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Perfil de Usuario</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-gray-900 mb-3">Nombre</label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Tu nombre"
              disabled={loading || (!isNewUser && !!userProfile)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-900 mb-3">Apellido</label>
            <Input
              value={formData.apellido}
              onChange={(e) => setFormData({...formData, apellido: e.target.value})}
              placeholder="Tu apellido"
              disabled={loading || (!isNewUser && !!userProfile)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-900 mb-3">Edad</label>
            <Input
              type="number"
              value={formData.edad}
              onChange={(e) => setFormData({...formData, edad: parseInt(e.target.value) || 0})}
              placeholder="Tu edad"
              min="1"
              max="120"
              disabled={loading || (!isNewUser && !!userProfile)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
            {userProfile && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Grupo:</strong> {getAgeGroupDescription(userProfile.ageGroup)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Sección 2: Umbral Automático - Estilo Figma */}
      <Card className="p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#22C55E]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Umbral de Postura</h2>
        </div>

        <div>
          <label className="block text-gray-900 mb-4">
            Umbral Automático: <span className="text-[#2563EB]">0°</span>
          </label>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Configuración automática:</strong> El umbral se ajusta automáticamente según tu edad ({userProfile?.age} años) para garantizar una postura saludable.
            </p>
            {userProfile && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>• Umbral neutral: 0°</p>
                <p>• Umbral riesgo leve: 0°</p>
                <p>• Umbral alto riesgo: 0°</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Sección 3: Sensibilidad - Estilo Figma */}
      <Card className="p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sensibilidad del Sistema</h2>
        
        <div>
          <label className="block text-gray-900 mb-4">Nivel de Sensibilidad</label>
          <div className="flex gap-3">
            {[
              { value: "baja", label: "Baja", desc: "Menos alertas" },
              { value: "media", label: "Media", desc: "Balanceado" },
              { value: "alta", label: "Alta", desc: "Más alertas" }
            ].map((nivel) => (
              <button
                key={nivel.value}
                onClick={() => setSensibilidad(nivel.value as typeof sensibilidad)}
                className={`flex-1 py-4 px-4 rounded-lg transition-all border-2 ${
                  sensibilidad === nivel.value
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium">{nivel.label}</div>
                <div className="text-xs opacity-80 mt-1">{nivel.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sección 4: Notificaciones - Estilo Figma */}
      <Card className="p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Notificaciones</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-gray-900 font-medium">Sonido</p>
                <p className="text-gray-600 text-sm">Reproducir alerta de sonido</p>
              </div>
            </div>
            <button
              onClick={() => setSonidoActivado(!sonidoActivado)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                sonidoActivado ? "bg-[#2563EB]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  sonidoActivado ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-gray-900 font-medium">Vibración</p>
                <p className="text-gray-600 text-sm">Activar vibración en alertas</p>
              </div>
            </div>
            <button
              onClick={() => setVibracionActivada(!vibracionActivada)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                vibracionActivada ? "bg-[#2563EB]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  vibracionActivada ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Botones de acción - Estilo Figma */}
      <div className="flex justify-end gap-4">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || loading || !isNewUser}
          className={`px-6 py-3 flex items-center gap-2 ${
            hasChanges 
              ? "bg-[#2563EB] hover:bg-[#1d4ed8]" 
              : "bg-gray-400 cursor-not-allowed"
          } text-white`}
        >
          <Save className="w-4 h-4" />
          {isNewUser ? "Crear Perfil" : (hasChanges ? "Guardar Cambios" : "Sin Cambios")}
        </Button>
      </div>
    </div>
  );
}