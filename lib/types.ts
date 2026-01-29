export interface InstagramLink {
  href: string;
  value: string;
  timestamp: number;
}

export interface InstagramFollowerItem {
  title: string;
  media_list_data: any[];
  string_list_data: InstagramLink[];
}

export interface InstagramFollowingItem {
  title: string;
  media_list_data: any[];
  string_list_data: InstagramLink[];
}

export interface InstagramFollowingResponse {
  relationships_following: InstagramFollowingItem[];
}

export interface AnalyzedProfile {
  username: string;
  url: string;
  timestamp: number;
}

export interface ContactInfo {
  firstName: string;
  lastName?: string;
  contactInfo: string;
}

export interface ConnectionStats {
  followers: AnalyzedProfile[];
  following: AnalyzedProfile[];
  fans: AnalyzedProfile[]; // They follow you, you don't follow them
  notFollowingBack: AnalyzedProfile[]; // You follow them, they don't follow you
  mutual: AnalyzedProfile[]; // You follow each other

  pendingRequests: AnalyzedProfile[];
  recentRequests: AnalyzedProfile[];
  contacts: ContactInfo[];

  // New Categories
  blocked: AnalyzedProfile[];
  restricted: AnalyzedProfile[];
  closeFriends: AnalyzedProfile[];
  hideStoryFrom: AnalyzedProfile[];
  favorites: AnalyzedProfile[];
  recentlyUnfollowed: AnalyzedProfile[];
  removedSuggestions: AnalyzedProfile[];
  requestsReceived: AnalyzedProfile[];
}
