import { useState, useEffect, use } from 'react';
import type { IUser } from '../models/user';
import { getUserByIdService, postUserService } from '../services/userService';

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  console.log("Estado actual de userProfile en el hook:", userProfile);

  useEffect(() => {
    const loadProfile = () => {
      setLoading(true);
      try {
        const storedProfile = localStorage.getItem('postureCorrectUserProfile');
        console.log("Valor en localStorage:", storedProfile);
        if (storedProfile) {
          const profile: IUser = JSON.parse(storedProfile);
          setUserProfile(profile);
          setIsNewUser(false);
        } else {
          // Si no hay perfil, no es un error, simplemente no hay usuario aún.
          setUserProfile(null);
          setIsNewUser(true);
        }
      } catch (err: any) {
        console.error("Error al cargar el perfil desde localStorage:", err);
        setError("No se pudo cargar el perfil guardado.");
        setUserProfile(null);
        setIsNewUser(true);
        localStorage.removeItem('postureCorrectUserProfile'); // Limpiar storage si está corrupto
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const createUserProfile = async (userData: Omit<IUser, "id" | "fecha_registro">) => {
    setLoading(true);
    try {
      const response = await postUserService(userData);
      setUserProfile(response.data);
      setIsNewUser(false);
      localStorage.setItem('postureCorrectUserProfile', JSON.stringify(response.data));
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err?.message ?? "Error al crear el perfil de usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Implementa una función para actualizar, aunque no se use en `Configuracion.tsx`
  // Sería el siguiente paso para tener la funcionalidad completa.
  const updateUserProfile = async (userData: IUser) => {
    const data = await getUserByIdService(userData.id);
    setUserProfile(data);
    console.log("Perfil de usuario obtenido por ID:", data);
  };

  const fetchUserProfileById = async (id: number) => {
    setLoading(true);
    try {
      const data = await getUserByIdService(id);
      setUserProfile(data);
      console.log("Perfil de usuario obtenido por ID:", data);
      setIsNewUser(false);
      localStorage.setItem('postureCorrectUserProfile', JSON.stringify(data));
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Error al obtener el perfil de usuario");
      setUserProfile(null);
      setIsNewUser(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    userProfile,
    isNewUser,
    createUserProfile,
    updateUserProfile,
    fetchUserProfileById,
    loading,
    error
  };
}

//function calculateAgeGroup(age: number): UserProfile['ageGroup'] {
//  if (age <= 12) return 'CHILD';
//  if (age <= 17) return 'TEEN';
//  if (age <= 59) return 'ADULT';
//  return 'SENIOR';
//}

//function getThresholdsByAgeGroup(ageGroup: UserProfile['ageGroup']) {
//  switch (ageGroup) {
//    case 'CHILD':
//      return { neutral: 10, mildRisk: 20 };
//    case 'TEEN':
//      return { neutral: 12, mildRisk: 22 };
//    case 'ADULT':
//      return { neutral: 15, mildRisk: 25 };
//    case 'SENIOR':
//      return { neutral: 20, mildRisk: 30 };
//    default:
//      return { neutral: 15, mildRisk: 25 };
//  }
//}