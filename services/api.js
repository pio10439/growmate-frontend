import axios from "axios";
import { auth } from "../firebaseConfig";

const BACKEND_URL = "https://growmate-backend.onrender.com";

export const api = axios.create({
  baseURL: BACKEND_URL,
});

export const authorizedRequest = async (config) => {
  if (!auth.currentUser) {
    throw new Error("Brak zalogowanego użytkownika");
  }
  const token = await auth.currentUser.getIdToken();
  return api({
    ...config,
    headers: {
      Authorization: `Bearer ${token}`,
      ...config.headers,
    },
  });
};
