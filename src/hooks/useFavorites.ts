/** 즐겨찾는 현장(작업장소) — localStorage 영속 */
import { useCallback, useState } from "react";
import { loadJson, saveJson } from "../lib/storage";

export interface Favorite {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

const KEY = "feelslike.favorites";
const MAX = 30;

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>(() =>
    loadJson<Favorite[]>(KEY, []),
  );

  const persist = (next: Favorite[]) => {
    setFavorites(next);
    saveJson(KEY, next);
  };

  const add = useCallback((fav: Omit<Favorite, "id">) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.label === fav.label)) return prev;
      const next = [{ ...fav, id: `${fav.lat},${fav.lon},${fav.label}` }, ...prev].slice(0, MAX);
      saveJson(KEY, next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveJson(KEY, next);
      return next;
    });
  }, []);

  const has = useCallback(
    (label: string) => favorites.some((f) => f.label === label),
    [favorites],
  );

  return { favorites, add, remove, has, persist };
}
