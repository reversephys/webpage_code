import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Tags worth showing next to a post.
 *
 * `pinned` and `public` control behaviour rather than describe the post.
 * `pinned` already has its own badge, so it is never repeated as a tag.
 * `public` tells members which posts outsiders can read; visitors only ever
 * see public posts, so for them it would sit on every single post.
 */
export function displayTags(tags: string | string[], isMember: boolean): string[] {
    const list = Array.isArray(tags) ? tags : tags.split(",");
    return list
        .map((tag) => tag.trim())
        .filter((tag) => {
            const key = tag.toLowerCase();
            if (!key || key === "pinned") return false;
            if (key === "public" && !isMember) return false;
            return true;
        });
}
