import axios from 'axios';
import {
  FacebookPage,
  FacebookPageReport,
  MetaAdAccount,
  MetaAdsReport,
  MetaAdsSettings,
  MetaCampaign,
  MetaDataset,
} from '@/types/meta-ads';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/meta-ads`,
  headers: { 'Content-Type': 'application/json' },
});

function apiError(error: unknown, fallback: string) {
  const body = axios.isAxiosError(error) ? error.response?.data : undefined;
  return new Error(body?.message || body?.error || fallback);
}

export async function getMetaAdsSettings() {
  const { data } = await api.get('/settings');
  return data.settings as MetaAdsSettings;
}

export async function saveMetaAdsSettings(patch: {
  ad_account_id?: string;
  access_token?: string;
  dataset_id?: string | null;
  send_conversions?: boolean;
}) {
  try {
    const { data } = await api.put('/settings', patch);
    return data.settings as MetaAdsSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t save the Meta ads settings');
  }
}

export async function disconnectMetaAds() {
  try {
    const { data } = await api.delete('/settings');
    return data.settings as MetaAdsSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t disconnect');
  }
}

export async function syncMetaAds() {
  try {
    const { data } = await api.post('/sync');
    return data.settings as MetaAdsSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t sync with Meta');
  }
}

export async function getMetaCampaigns(month: string) {
  const { data } = await api.get('/campaigns', { params: { month } });
  return data.campaigns as MetaCampaign[];
}

export async function getMetaAdsReport(from: string, to: string, account: string) {
  try {
    const { data } = await api.get('/report', { params: { from, to, account } });
    return data as MetaAdsReport;
  } catch (error) {
    throw apiError(error, 'Couldn’t load the ads report');
  }
}

// Where the "Continue with Facebook" button sends the browser.
export function facebookSignInUrl(returnTo: string) {
  return `${API_BASE_URL}/api/meta-ads/oauth/start?return_to=${encodeURIComponent(returnTo)}`;
}

export async function getMetaAdAccounts() {
  try {
    const { data } = await api.get('/oauth/accounts');
    return data as { user: string | null; accounts: MetaAdAccount[] };
  } catch (error) {
    throw apiError(error, 'Couldn’t list your ad accounts');
  }
}

export async function getMetaDatasets(adAccountId: string) {
  try {
    const { data } = await api.get('/oauth/datasets', { params: { account: adAccountId } });
    return data.datasets as MetaDataset[];
  } catch (error) {
    throw apiError(error, 'Couldn’t list datasets');
  }
}

export async function finishMetaSignIn(adAccountId: string, datasetId: string | null) {
  try {
    const { data } = await api.post('/oauth/finish', { ad_account_id: adAccountId, dataset_id: datasetId ?? '' });
    return data.settings as MetaAdsSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t connect the ad account');
  }
}

export async function cancelMetaSignIn() {
  const { data } = await api.post('/oauth/cancel');
  return data.settings as MetaAdsSettings;
}

// Every ad account the saved sign-in can open.
export async function getAvailableAdAccounts() {
  try {
    const { data } = await api.get('/accounts/available');
    return data.accounts as MetaAdAccount[];
  } catch (error) {
    throw apiError(error, 'Couldn’t list your ad accounts');
  }
}

export async function saveExtraAdAccounts(ids: string[]) {
  try {
    const { data } = await api.put('/accounts', { extra: ids });
    return data.settings as MetaAdsSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t save the ad accounts');
  }
}

// Switching to an ad account on the Ads page that isn't synced yet adds it.
export async function addAdAccount(id: string) {
  try {
    const { data } = await api.post('/accounts/add', { id });
    return data.settings as MetaAdsSettings;
  } catch (error) {
    throw apiError(error, 'Couldn’t switch to that ad account');
  }
}

export async function getFacebookPages() {
  try {
    const { data } = await api.get('/pages');
    return data.pages as FacebookPage[];
  } catch (error) {
    throw apiError(error, 'Couldn’t list your Facebook pages');
  }
}

export async function getFacebookPageReport(pageId: string, from: string, to: string) {
  try {
    const { data } = await api.get(`/pages/${pageId}/report`, { params: { from, to } });
    return data.report as FacebookPageReport;
  } catch (error) {
    throw apiError(error, 'Couldn’t load the page insights');
  }
}
