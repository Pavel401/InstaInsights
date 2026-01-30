"use server";

import { ConnectionStats, AnalyzedProfile } from "@/lib/types";
import { getDB } from "@/lib/db-server";

export async function saveStats(stats: ConnectionStats) {
  const db = getDB();
  const insert = db.prepare(
    "INSERT INTO records (category, identifier, data) VALUES (?, ?, ?)",
  );

  const insertMany = db.transaction((stats: ConnectionStats) => {
    // Clear existing data first (excluding settings)
    db.prepare("DELETE FROM records WHERE category != 'settings'").run();

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

export async function setMediaPath(path: string) {
  const db = getDB();
  const insert = db.prepare(
    "INSERT OR REPLACE INTO records (category, identifier, data) VALUES (?, ?, ?)",
  );
  insert.run("settings", "media_path", JSON.stringify({ path }));
  return { success: true };
}

export async function getMediaPath() {
  const db = getDB();
  const row = db
    .prepare("SELECT data FROM records WHERE category = ? AND identifier = ?")
    .get("settings", "media_path") as { data: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.data).path as string;
}

import fs from "fs";
import path from "path";

// Helper to fix Instagram's broken encoding (Latin1 to UTF8)
function decodeInstagramString(str: string): string {
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch (e) {
    return str;
  }
}

// Recursive helper to decode all strings in an object
function decodeObject(obj: any): any {
  if (typeof obj === "string") {
    return decodeInstagramString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(decodeObject);
  }
  if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = decodeObject(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export type ChatThread = {
  folderName: string;
  title: string;
  lastActivity: number;
  path: string;
};

export type ChatMessage = {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  photos?: { uri: string; creation_timestamp: number }[];
  share?: { link: string; share_text: string };
  reactions?: { reaction: string; actor: string }[];
  is_geoblocked_for_viewer: boolean;
};

async function getRootPath() {
  const mediaPath = await getMediaPath();
  if (!mediaPath) return null;
  return path.dirname(mediaPath);
}

export async function getChatList(): Promise<ChatThread[]> {
  const rootPath = await getRootPath();
  if (!rootPath) return [];

  const inboxPath = path.join(
    rootPath,
    "your_instagram_activity",
    "messages",
    "inbox",
  );
  if (!fs.existsSync(inboxPath)) {
    return [];
  }

  const entries = await fs.promises.readdir(inboxPath, { withFileTypes: true });
  const threads: ChatThread[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const messageFile = path.join(inboxPath, entry.name, "message_1.json");
      if (fs.existsSync(messageFile)) {
        try {
          const content = await fs.promises.readFile(messageFile, "utf-8");
          const json = decodeObject(JSON.parse(content));
          let lastActivity = 0;
          if (json.messages && json.messages.length > 0) {
            lastActivity = json.messages[0].timestamp_ms;
          }
          threads.push({
            folderName: entry.name,
            title: json.title,
            lastActivity,
            path: entry.name,
          });
        } catch (e) {
          console.error("Error reading chat file:", messageFile, e);
        }
      }
    }
  }

  return threads.sort((a, b) => b.lastActivity - a.lastActivity);
}

export async function getChatMessages(
  folderName: string,
): Promise<ChatMessage[]> {
  const rootPath = await getRootPath();
  if (!rootPath) return [];

  const messageFile = path.join(
    rootPath,
    "your_instagram_activity",
    "messages",
    "inbox",
    folderName,
    "message_1.json",
  );
  if (!fs.existsSync(messageFile)) return [];

  try {
    const content = await fs.promises.readFile(messageFile, "utf-8");
    const json = decodeObject(JSON.parse(content));
    return json.messages || [];
  } catch (e) {
    console.error("Error reading messages:", e);
    return [];
  }
}

// Helper for recursive file listing
// Helper for recursive file listing
export type MediaItem = {
  path: string;
  name: string;
  size: number;
  date: string;
  type: "image" | "video";
};

// Helper for recursive file listing
async function getFilesRecursively(
  dir: string,
  baseDir: string,
): Promise<MediaItem[]> {
  // console.log("Scanning directory:", dir);
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: MediaItem[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursively(fullPath, baseDir)));
    } else if (/\.(jpg|jpeg|png|mp4|mov|webp)$/i.test(entry.name)) {
      try {
        const stats = await fs.promises.stat(fullPath);
        const relPath = path.relative(baseDir, fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        const type = [".mp4", ".mov"].includes(ext) ? "video" : "image";

        files.push({
          path: relPath,
          name: entry.name,
          size: stats.size,
          date: stats.mtime.toISOString(),
          type,
        });
      } catch (e) {
        console.error("Error getting stats for:", fullPath);
      }
    }
  }
  return files;
}

export async function getMediaFiles(
  type: "posts" | "stories" | "reels" | "other",
) {
  const mediaPath = await getMediaPath();
  // console.log("getMediaFiles called for:", type);

  if (!mediaPath) return [];

  const dirPath = path.join(mediaPath, type);
  // console.log("Looking in directory:", dirPath);

  if (!fs.existsSync(dirPath)) {
    // console.log("Directory does not exist:", dirPath);
    return [];
  }

  try {
    const files = await getFilesRecursively(dirPath, dirPath);
    // console.log(`Found ${files.length} files for ${type}`);
    // Sort by date descending
    return files.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (e) {
    console.error(`Error reading directory ${dirPath}:`, e);
    return [];
  }
}

export type CommentActivity = {
  comment: string;
  owner: string;
  timestamp: number;
};

export type LikeActivity = {
  username: string;
  href: string;
  timestamp: number;
};

// In-memory cache
let cachedComments: CommentActivity[] | null = null;
let cachedLikes: LikeActivity[] | null = null;

export async function getComments(
  page = 1,
  limit = 50,
): Promise<CommentActivity[]> {
  if (!cachedComments) {
    const rootPath = await getRootPath();
    if (!rootPath) return [];

    const commentsDir = path.join(
      rootPath,
      "your_instagram_activity",
      "comments",
    );
    if (!fs.existsSync(commentsDir)) return [];

    const allComments: CommentActivity[] = [];

    try {
      const files = await fs.promises.readdir(commentsDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.promises.readFile(
            path.join(commentsDir, file),
            "utf-8",
          );
          const json = JSON.parse(content);
          const decoded = decodeObject(json);

          if (Array.isArray(decoded)) {
            for (const item of decoded) {
              if (item.string_map_data) {
                const data = item.string_map_data;
                allComments.push({
                  comment: data.Comment?.value || "",
                  owner: data["Media Owner"]?.value || "Unknown",
                  timestamp: data.Time?.timestamp || 0,
                });
              }
            }
          }
        }
      }
      cachedComments = allComments.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Error reading comments:", e);
      return [];
    }
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  // @ts-ignore
  return cachedComments.slice(start, end);
}

export async function getLikes(page = 1, limit = 50): Promise<LikeActivity[]> {
  if (!cachedLikes) {
    const rootPath = await getRootPath();
    if (!rootPath) return [];

    const likesFile = path.join(
      rootPath,
      "your_instagram_activity",
      "likes",
      "liked_posts.json",
    );
    if (!fs.existsSync(likesFile)) return [];

    try {
      const content = await fs.promises.readFile(likesFile, "utf-8");
      const json = JSON.parse(content);
      const decoded = decodeObject(json);

      const activities: LikeActivity[] = [];

      if (
        decoded.likes_media_likes &&
        Array.isArray(decoded.likes_media_likes)
      ) {
        for (const item of decoded.likes_media_likes) {
          const username = item.title;
          if (item.string_list_data && item.string_list_data.length > 0) {
            const data = item.string_list_data[0];
            activities.push({
              username: username,
              href: data.href,
              timestamp: data.timestamp,
            });
          }
        }
      }
      cachedLikes = activities;
    } catch (e) {
      console.error("Error reading likes:", e);
      return [];
    }
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  // @ts-ignore
  return cachedLikes.slice(start, end);
}
