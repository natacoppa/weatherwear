import { proxyImg } from "@/lib/proxy";
import { safeHref } from "@/lib/safe-href";
import type { CreatorOutfitItem } from "@/lib/types";

// Shop-the-look collage of creator catalog items. Layout:
//   top row:    accessories stack | main garment | layer
//   bottom row: shoes             | bottom
// Images are proxied through /api/img so ShopMy/LTK CDNs hotlink. Raw
// <img> is intentional — see Phase 2 decision in the refactor plan:
// next/image + custom loader would double-proxy through serverless.
/* eslint-disable @next/next/no-img-element */
export function OutfitCollage({ items }: { items: (CreatorOutfitItem | null)[] }) {
  const valid = items.filter(Boolean) as CreatorOutfitItem[];
  if (valid.length === 0) return null;

  return (
    <div className="relative bg-card rounded-2xl p-4 min-h-[300px]">
      {/* Top row: small accessories + main garment */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col gap-2 w-[68px] shrink-0 pt-1">
          {valid.slice(4).map((item, i) => (
            <a key={i} href={safeHref(item.url)} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={proxyImg(item.image)}
                alt={item.title}
                loading="lazy"
                className="w-[68px] h-[68px] object-contain drop-shadow-sm"
              />
            </a>
          ))}
        </div>
        <div className="flex-1 flex justify-center">
          {valid[0] && (
            <a href={safeHref(valid[0].url)} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={proxyImg(valid[0].image)}
                alt={valid[0].title}
                loading="lazy"
                className="w-[150px] h-[170px] object-contain drop-shadow-sm"
              />
            </a>
          )}
        </div>
        {valid[1] && (
          <div className="w-[85px] shrink-0 pt-4">
            <a href={safeHref(valid[1].url)} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={proxyImg(valid[1].image)}
                alt={valid[1].title}
                loading="lazy"
                className="w-[85px] h-[100px] object-contain drop-shadow-sm"
              />
            </a>
          </div>
        )}
      </div>
      {/* Bottom row: shoes + bottom */}
      <div className="flex items-end gap-3">
        {valid[3] && (
          <a href={safeHref(valid[3].url)} target="_blank" rel="noopener noreferrer" className="block shrink-0">
            <img
              src={proxyImg(valid[3].image)}
              alt={valid[3].title}
              loading="lazy"
              className="w-[85px] h-[75px] object-contain drop-shadow-sm"
            />
          </a>
        )}
        {valid[2] && (
          <div className="flex-1 flex justify-center">
            <a href={safeHref(valid[2].url)} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={proxyImg(valid[2].image)}
                alt={valid[2].title}
                loading="lazy"
                className="w-[130px] h-[130px] object-contain drop-shadow-sm"
              />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
