export interface Author {
 name: string;
 role?: string;
 url?: string;
 github?: string;
}
export interface Resource {
 resource_title: string;
 resource_url: string;
}
export interface Project {
 id?: number;
 title: string;
 slug?: string;
 summary?: string;
 cover?: string;
 gallery?: (string | GallerySlide)[] | string;
 authors?: Author[] | string;
 resources?: Resource[] | string;
 tags?: string[] | string;
 published?: boolean | number;
 published_at?: string;
 hide_cover?: boolean | number;
 body?: string | {type: string; text?: string; html?: string; src?: string}[];
 draft_payload?: string;
}
export interface GallerySlide { src: string; alt: string; caption: string; }
