// Rewrites an external image URL through the local /api/img proxy.
// Used for ShopMy / LTK product images which don't allow hotlinking.
export function proxyImg(url: string): string {
  return `/api/img?url=${encodeURIComponent(url)}`;
}
