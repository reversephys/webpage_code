import PocketBase from "pocketbase";

export async function getUserMap(): Promise<Map<string, string>> {
    try {
        const pb = new PocketBase("http://127.0.0.1:8090");
        const users = await pb.collection("users").getFullList({ requestKey: null });
        const map = new Map<string, string>();
        users.forEach(u => map.set(u.id, u.username || "Unknown"));
        return map;
    } catch {
        return new Map<string, string>();
    }
}
