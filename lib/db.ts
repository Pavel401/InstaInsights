import { openDB, DBSchema } from "idb";
import { ConnectionStats, AnalyzedProfile } from "./types";

interface InstaDB extends DBSchema {
  data: {
    key: string;
    value: ConnectionStats;
  };
}

const DB_NAME = "insta-visualizer-db";
const STORE_NAME = "data";
const KEY = "latest_backup";

export async function initDB() {
  return openDB<InstaDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

export async function saveToDB(stats: ConnectionStats) {
  const db = await initDB();
  await db.put(STORE_NAME, stats, KEY);
}

export async function loadFromDB(): Promise<ConnectionStats | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, KEY);
}

export async function clearDB() {
  const db = await initDB();
  await db.delete(STORE_NAME, KEY);
}

export async function deleteProfileFromCategory(
  category: keyof ConnectionStats,
  username: string,
) {
  const db = await initDB();
  const stats = await db.get(STORE_NAME, KEY);

  if (!stats) return;

  // TypeScript check to ensure we are operating on an array
  if (Array.isArray(stats[category])) {
    // @ts-ignore - dynamic key access is safe here given the structure
    stats[category] = stats[category].filter(
      (p: any) => p.username !== username,
    );
    await db.put(STORE_NAME, stats, KEY);
    return stats;
  }
  return stats;
}
