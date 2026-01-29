"use server";

import { ConnectionStats, AnalyzedProfile } from "@/lib/types";
import { getDB } from "@/lib/db-server";

export async function saveStats(stats: ConnectionStats) {
  const db = getDB();
  const insert = db.prepare(
    "INSERT INTO records (category, identifier, data) VALUES (?, ?, ?)",
  );

  const insertMany = db.transaction((stats: ConnectionStats) => {
    // Clear existing data first
    db.prepare("DELETE FROM records").run();

    // Insert contacts
    if (stats.contacts) {
      // Store all contacts as a single blob for now, or split if needed.
      // Given the use case, storing as single blob for contacts might be easier,
      // BUT for consistency let's store individual items if we want granularity.
      // HOWEVER, contact info struct is different. Let's store contacts as one giant JSON blob for simplicity as they aren't "profiles".
      insert.run("contacts", "all_contacts", JSON.stringify(stats.contacts));
    }

    // Helper for profile lists
    const saveList = (category: string, list: AnalyzedProfile[]) => {
      for (const item of list) {
        insert.run(category, item.username, JSON.stringify(item));
      }
    };

    saveList("followers", stats.followers);
    saveList("following", stats.following);
    saveList("fans", stats.fans);
    saveList("notFollowingBack", stats.notFollowingBack);
    saveList("mutual", stats.mutual);
    saveList("pendingRequests", stats.pendingRequests);
    saveList("recentRequests", stats.recentRequests);
    saveList("blocked", stats.blocked);
    saveList("restricted", stats.restricted);
    saveList("closeFriends", stats.closeFriends);
    saveList("hideStoryFrom", stats.hideStoryFrom);
    saveList("favorites", stats.favorites);
    saveList("recentlyUnfollowed", stats.recentlyUnfollowed);
    saveList("removedSuggestions", stats.removedSuggestions);
    saveList("requestsReceived", stats.requestsReceived);
  });

  insertMany(stats);
  return { success: true };
}

export async function getStats(): Promise<ConnectionStats | null> {
  const db = getDB();
  const rows = db.prepare("SELECT category, data FROM records").all() as {
    category: string;
    data: string;
  }[];

  if (rows.length === 0) return null;

  const stats: Partial<ConnectionStats> = {
    followers: [],
    following: [],
    fans: [],
    notFollowingBack: [],
    mutual: [],
    pendingRequests: [],
    recentRequests: [],
    contacts: [],
    blocked: [],
    restricted: [],
    closeFriends: [],
    hideStoryFrom: [],
    favorites: [],
    recentlyUnfollowed: [],
    removedSuggestions: [],
    requestsReceived: [],
  };

  for (const row of rows) {
    if (row.category === "contacts") {
      stats.contacts = JSON.parse(row.data);
    } else {
      // @ts-ignore
      if (stats[row.category]) {
        // @ts-ignore
        stats[row.category].push(JSON.parse(row.data));
      }
    }
  }

  return stats as ConnectionStats;
}

export async function clearData() {
  const db = getDB();
  db.prepare("DELETE FROM records").run();
  return { success: true };
}

export async function deleteProfile(category: string, identifier: string) {
  const db = getDB();
  db.prepare("DELETE FROM records WHERE category = ? AND identifier = ?").run(
    category,
    identifier,
  );

  // Re-fetch fresh stats to return to client
  return getStats();
}
