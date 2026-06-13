import { supabase } from './supabase';

export type StoreSettings = {
  id?: string;
  store_id: string;

  business_name: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  business_logo_url: string;
  business_contact_name: string;
  business_tax_id: string;
  business_website: string;
  instagram_url: string;
  facebook_url: string;

  currency: 'USD' | 'MXN';
  currency_symbol: string;
  tax_rate: number;
  prices_include_tax: boolean;
  decimal_places: number;
  rounding_mode: 'none' | 'nearest_05' | 'nearest_10';
  timezone: string;

  ticket_prefix: string;
  ticket_footer: string;
  ticket_start_number: number;
  show_logo_on_ticket: boolean;
  show_phone_on_ticket: boolean;
  show_email_on_ticket: boolean;
  show_address_on_ticket: boolean;
  show_qr_on_ticket: boolean;
  ticket_qr_value: string;

  opening_cash_default: number;
  require_daily_close: boolean;
  require_close_note: boolean;
  allow_manual_expenses: boolean;

  daily_sales_goal: number;
  daily_profit_goal: number;
  monthly_sales_goal: number;
  items_goal: number;
  low_stock_threshold: number;

  achievement_notifications: boolean;
  sound_enabled: boolean;
  alert_low_stock: boolean;
  alert_goal_reached: boolean;
  alert_cash_pending: boolean;
  alert_new_sale: boolean;
  alert_purchase_registered: boolean;

  critical_action_pin: string;
  require_pin_delete_product: boolean;
  require_pin_change_price: boolean;
  require_pin_cancel_sale: boolean;
  require_pin_close_cash: boolean;
  confirm_destructive_actions: boolean;
  session_timeout_minutes: number;

  appearance_mode: 'system' | 'dark' | 'light';
  primary_color: string;
  accent_color: string;
  updated_at?: string;
};

export const DEFAULT_SETTINGS: Omit<StoreSettings, 'store_id'> = {
  business_name: 'Snack Robots',
  business_phone: '',
  business_email: '',
  business_address: '',
  business_logo_url: '',
  business_contact_name: '',
  business_tax_id: '',
  business_website: '',
  instagram_url: '',
  facebook_url: '',

  currency: 'USD',
  currency_symbol: '$',
  tax_rate: 0,
  prices_include_tax: false,
  decimal_places: 2,
  rounding_mode: 'none',
  timezone: 'America/Chicago',

  ticket_prefix: 'SR-',
  ticket_footer: 'Sweet treats, great taste!',
  ticket_start_number: 1,
  show_logo_on_ticket: true,
  show_phone_on_ticket: true,
  show_email_on_ticket: false,
  show_address_on_ticket: false,
  show_qr_on_ticket: false,
  ticket_qr_value: '',

  opening_cash_default: 5,
  require_daily_close: true,
  require_close_note: false,
  allow_manual_expenses: true,

  daily_sales_goal: 50,
  daily_profit_goal: 25,
  monthly_sales_goal: 1000,
  items_goal: 100,
  low_stock_threshold: 3,

  achievement_notifications: true,
  sound_enabled: true,
  alert_low_stock: true,
  alert_goal_reached: true,
  alert_cash_pending: true,
  alert_new_sale: true,
  alert_purchase_registered: true,

  critical_action_pin: '',
  require_pin_delete_product: true,
  require_pin_change_price: false,
  require_pin_cancel_sale: true,
  require_pin_close_cash: false,
  confirm_destructive_actions: true,
  session_timeout_minutes: 60,

  appearance_mode: 'system',
  primary_color: '#2563eb',
  accent_color: '#f97316',
};

async function getCurrentStoreId(userId?: string | null) {
  if (userId) {
    const { data: membership } = await supabase
      .from('store_members')
      .select('store_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (membership?.store_id) return membership.store_id as string;
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .limit(1)
    .maybeSingle();

  return store?.id as string | undefined;
}

function num(value: unknown, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSettings(row: any, storeId: string): StoreSettings {
  return {
    store_id: storeId,
    ...DEFAULT_SETTINGS,
    ...(row ?? {}),
    currency: (row?.currency ?? DEFAULT_SETTINGS.currency) as StoreSettings['currency'],
    rounding_mode: (row?.rounding_mode ?? DEFAULT_SETTINGS.rounding_mode) as StoreSettings['rounding_mode'],
    appearance_mode: (row?.appearance_mode ?? DEFAULT_SETTINGS.appearance_mode) as StoreSettings['appearance_mode'],
    tax_rate: num(row?.tax_rate, DEFAULT_SETTINGS.tax_rate),
    decimal_places: num(row?.decimal_places, DEFAULT_SETTINGS.decimal_places),
    ticket_start_number: num(row?.ticket_start_number, DEFAULT_SETTINGS.ticket_start_number),
    opening_cash_default: num(row?.opening_cash_default, DEFAULT_SETTINGS.opening_cash_default),
    daily_sales_goal: num(row?.daily_sales_goal, DEFAULT_SETTINGS.daily_sales_goal),
    daily_profit_goal: num(row?.daily_profit_goal, DEFAULT_SETTINGS.daily_profit_goal),
    monthly_sales_goal: num(row?.monthly_sales_goal, DEFAULT_SETTINGS.monthly_sales_goal),
    items_goal: num(row?.items_goal, DEFAULT_SETTINGS.items_goal),
    low_stock_threshold: num(row?.low_stock_threshold, DEFAULT_SETTINGS.low_stock_threshold),
    session_timeout_minutes: num(row?.session_timeout_minutes, DEFAULT_SETTINGS.session_timeout_minutes),
  };
}

export async function getStoreSettings(userId?: string | null) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error('No se encontró una tienda activa para cargar configuración.');
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return normalizeSettings(null, storeId);
  }

  return normalizeSettings(data, storeId);
}

export async function saveStoreSettings(settings: StoreSettings) {
  const payload = {
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('store_settings')
    .upsert(payload, { onConflict: 'store_id' })
    .select('*')
    .single();

  if (error) throw error;

  return normalizeSettings(data, settings.store_id);
}

export async function uploadBusinessLogo(userId: string, file: File) {
  const storeId = await getCurrentStoreId(userId);

  if (!storeId) {
    throw new Error('No se encontró una tienda activa para subir el logo.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'png';
  const filePath = `${storeId}/logos/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png',
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
