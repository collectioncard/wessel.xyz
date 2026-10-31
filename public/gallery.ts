import type { GallerySlide } from '../app/types.js';
export function normalizeSlides(value: unknown): GallerySlide[] {
 if(!Array.isArray(value))return [];
 return value.map(item=>typeof item==='string'?{src:item,alt:'',caption:''}:item).filter(item=>item&&typeof item.src==='string').map(item=>({src:item.src,alt:item.alt||'',caption:item.caption||''}));
}
