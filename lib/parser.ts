import {
  AnalyzedProfile,
  ConnectionStats,
  InstagramFollowerItem,
  InstagramFollowingResponse,
} from "./types";

export const parseGenericList = (
  data: any,
  rootKey: string,
): AnalyzedProfile[] => {
  if (!data || !data[rootKey]) return [];

  return data[rootKey].map((item: any) => {
    let username = item.title;
    let url = "";
    let timestamp = 0;

    if (item.string_list_data && item.string_list_data.length > 0) {
      const linkData = item.string_list_data[0];
      if (!username) username = linkData.value;
      url = linkData.href;
      timestamp = linkData.timestamp;
    }

    return {
      username: username || "Unknown",
      url: url,
      timestamp: timestamp,
    };
  });
};

export const parseFollowers = (
  data: InstagramFollowerItem[],
): AnalyzedProfile[] => {
  return data.map((item) => {
    const linkData = item.string_list_data[0];
    return {
      username: linkData.value,
      url: linkData.href,
      timestamp: linkData.timestamp,
    };
  });
};

export const parseFollowing = (
  data: InstagramFollowingResponse,
): AnalyzedProfile[] => {
  return data.relationships_following.map((item) => {
    const linkData = item.string_list_data[0];
    const username = item.title || linkData.value;
    return {
      username: username,
      url: linkData.href,
      timestamp: linkData.timestamp,
    };
  });
};

export const parseContacts = (data: any): any[] => {
  if (!data || !data.contacts_contact_info) return [];

  return data.contacts_contact_info.map((item: any) => {
    const info = item.string_map_data;
    return {
      firstName: info?.["First Name"]?.value || "",
      lastName: info?.["Last Name"]?.value || "",
      contactInfo: info?.["Contact Information"]?.value || "",
    };
  });
};

export const analyzeConnections = (
  followers: AnalyzedProfile[],
  following: AnalyzedProfile[],
  pendingRequests: AnalyzedProfile[] = [],
  recentRequests: AnalyzedProfile[] = [],
  contacts: any[] = [],
  blocked: AnalyzedProfile[] = [],
  restricted: AnalyzedProfile[] = [],
  closeFriends: AnalyzedProfile[] = [],
  hideStoryFrom: AnalyzedProfile[] = [],
  favorites: AnalyzedProfile[] = [],
  recentlyUnfollowed: AnalyzedProfile[] = [],
  removedSuggestions: AnalyzedProfile[] = [],
  requestsReceived: AnalyzedProfile[] = [],
): ConnectionStats => {
  const followersMap = new Set(followers.map((f) => f.username));
  const followingMap = new Set(following.map((f) => f.username));

  const mutual = following.filter((f) => followersMap.has(f.username));
  const notFollowingBack = following.filter(
    (f) => !followersMap.has(f.username),
  );
  const fans = followers.filter((f) => !followingMap.has(f.username));

  return {
    followers,
    following,
    mutual,
    notFollowingBack,
    fans,
    pendingRequests,
    recentRequests,
    contacts,
    blocked,
    restricted,
    closeFriends,
    hideStoryFrom,
    favorites,
    recentlyUnfollowed,
    removedSuggestions,
    requestsReceived,
  };
};
