import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

/**
 * Fetches tags for multiple post UUIDs from PocketBase.
 * Returns a map of { [post_uuid]: string[] }
 */
export async function getTagsForPosts(uuids: string[]): Promise<Record<string, string[]>> {
    if (!uuids || uuids.length === 0) return {};

    try {
        const pb = new PocketBase(PB_URL);
        const filterParts = uuids.map(id => `post_uuid='${id}'`).join(" || ");

        const records = await pb.collection("post_tags").getFullList({
            filter: filterParts,
        });

        const result: Record<string, string[]> = {};
        for (const record of records) {
            const uuid = record.post_uuid as string;
            let tags: string[] = [];

            if (Array.isArray(record.tags)) {
                tags = record.tags.map((t: unknown) => String(t));
            } else if (typeof record.tags === "string") {
                // Handle legacy comma-separated string
                tags = record.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
            }

            result[uuid] = tags;
        }

        return result;
    } catch (e) {
        // PocketBase not running or collection not found — return empty
        return {};
    }
}
