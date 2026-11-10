export type TrackedAdAccount = {
  id: string;
  name: string | null;
  currency: string | null;
  timezone: string | null;
  // When its numbers were last pulled from Meta; null while the first pull runs.
  synced_at?: string | null;
};

export type MetaAdsSettings = {
  connected: boolean;
  ad_account_id: string | null;
  account_name: string | null;
  // The main account first, then extra ones synced for the Ads page.
  accounts: TrackedAdAccount[];
  currency: string | null;
  timezone: string | null;
  token_hint: string | null;
  dataset_id: string | null;
  send_conversions: boolean;
  connected_at: string | null;
  last_sync_at: string | null;
  last_sync_error: string | null;
  conversions_sent_7d: number;
  last_conversion_error: string | null;
  login_available: boolean;
  connected_via: 'facebook' | 'token' | null;
  connected_by: string | null;
  token_expires_at: string | null;
  // Signed in with Facebook, ad account not picked yet.
  pending_user: string | null;
};

export type MetaAdAccount = {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  business: string | null;
  active: boolean;
};

export type MetaDataset = { id: string; name: string };

export type MetaCampaign = {
  campaign_id: string;
  ad_account_id?: string | null;
  campaign_name: string | null;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversations: number;
  purchases: number;
  purchase_value: number;
  cost_per_conversation: number | null;
  roas: number | null;
  ctr: number | null;
  // First and last day with spend in the period asked for.
  first_day: string | null;
  last_day: string | null;
};

export type MetaAdsReportDay = {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversations: number;
  orders: number;
  revenue: number;
  // WhatsApp orders that aren't distributor orders: the sales ads can bring in.
  chat_orders: number;
  chat_revenue: number;
  new_customers: number;
};

export type MetaAdsReport = {
  from: string;
  to: string;
  account: string;
  accounts: TrackedAdAccount[];
  currency: string | null;
  data_since: string | null;
  last_spend_day: string | null;
  totals: Omit<MetaAdsReportDay, 'date'> & { purchases: number; purchase_value: number };
  days: MetaAdsReportDay[];
  campaigns: MetaCampaign[];
};

export type FacebookPage = {
  id: string;
  name: string;
  followers: number | null;
  picture: string | null;
  link: string | null;
  // False for a business page the signed-in person has no role on.
  access: boolean;
  business: string | null;
};

export type FacebookPageDay = {
  date: string;
  views: number;
  viewers: number;
  engagements: number;
  visits: number;
  follows: number;
  unfollows: number;
  video_views: number;
};

export type FacebookPagePost = {
  id: string;
  message: string | null;
  created_time: string;
  permalink: string | null;
  picture: string | null;
  reactions: number;
  comments: number;
  shares: number;
};

export type FacebookPageReport = {
  page: FacebookPage;
  from: string;
  to: string;
  days: FacebookPageDay[];
  totals: Omit<FacebookPageDay, 'date' | 'viewers'>;
  posts: FacebookPagePost[];
};

export type AdComment = {
  id: string;
  message: string;
  from: string | null;
  created_time: string;
  replies: number;
  likes: number;
  permalink: string | null;
  post_id: string;
  post_permalink: string | null;
  ads: string[];
  campaign: string | null;
};
