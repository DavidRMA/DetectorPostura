import type { IUser } from "../models/User";

export const USER_URL = "http://127.0.0.1:8000/api/usuarios/";

export const getUsersService = async (): Promise<IUser[]> => {
  try {
    const response = await fetch(
      `${USER_URL}listar_usuarios/`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} - ${text}`);
    }

    const data = await response.json();

    return data as User[];
  } catch (err: any) {
    console.error("Error al obtener los usuarios:", err);
    throw err;
  }
};

export const getUserByIdService = async (id: number): Promise<IUser> => {
  const resp = await fetch(
    `${USER_URL}${id}/consultar_usuario/`
  );
  if (!resp.ok) {
    const errorBody = await resp.text();
    console.error("Error response from backend:", errorBody);
    throw new Error(`No fue posible obtener el usuario. Status: ${resp.status}`);
  }

  const data = await resp.json();

  console.log("Usuario obtenido:", data);

  return data;
};

export const postUserService = async (user: Omit<IUser, "id" | "fecha_registro">): Promise<IUser> => {
  try {
    const resp = await fetch(
      `${USER_URL}crear_usuario/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      }
    );

    if (!resp.ok) {
      const errorBody = await resp.text();
      console.error("Error response from backend:", errorBody);
      throw new Error(`No fue posible crear el usuario. Status: ${resp.status}`);
    }

    return await resp.json();

  } catch (err: any) {
    console.error("Error al crear el usuario:", err);
    throw err;
  }
};