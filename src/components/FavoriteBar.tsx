import type { Favorite } from "../hooks/useFavorites";

interface Props {
  favorites: Favorite[];
  onPick: (f: Favorite) => void;
  onRemove: (id: string) => void;
}

export function FavoriteBar({ favorites, onPick, onRemove }: Props) {
  if (favorites.length === 0) return null;
  return (
    <div className="favbar" aria-label="즐겨찾는 현장">
      <span className="favbar__star" aria-hidden="true">★</span>
      <div className="favbar__scroll">
        {favorites.map((f) => (
          <span key={f.id} className="favchip">
            <button className="favchip__pick" onClick={() => onPick(f)}>
              {f.label.replace(/특별자치도|특별시|광역시|특별자치시/g, "")}
            </button>
            <button
              className="favchip__x"
              onClick={() => onRemove(f.id)}
              aria-label={`${f.label} 삭제`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
