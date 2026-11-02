export type MetaAdsSettings = {
  connected: boolean;
  ad_account_id: string | null;
  account_name: string | null;
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
};
