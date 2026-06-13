import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Flag,
  Globe2,
  Image,
  Loader2,
  Lock,
  Paintbrush,
  Receipt,
  RotateCcw,
  Save,
  ShieldCheck,
  Store,
  Target,
  Ticket,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  DEFAULT_SETTINGS,
  getStoreSettings,
  saveStoreSettings,
  uploadBusinessLogo,
  StoreSettings,
} from '../lib/settingsService';

const tabs = [
  { id: 'business', label: 'Negocio', icon: Store },
  { id: 'sales', label: 'Ventas', icon: DollarSign },
  { id: 'tickets', label: 'Tickets', icon: Receipt },
  { id: 'cash', label: 'Caja', icon: CreditCard },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'security', label: 'Seguridad', icon: Lock },
  { id: 'appearance', label: 'Apariencia', icon: Paintbrush },
] as const;

type TabId = (typeof tabs)[number]['id'];

type NumericField =
  | 'tax_rate'
  | 'decimal_places'
  | 'ticket_start_number'
  | 'opening_cash_default'
  | 'daily_sales_goal'
  | 'daily_profit_goal'
  | 'monthly_sales_goal'
  | 'items_goal'
  | 'low_stock_threshold'
  | 'session_timeout_minutes';

type TextField =
  | 'business_name'
  | 'business_phone'
  | 'business_email'
  | 'business_address'
  | 'business_logo_url'
  | 'business_contact_name'
  | 'business_tax_id'
  | 'business_website'
  | 'instagram_url'
  | 'facebook_url'
  | 'currency_symbol'
  | 'timezone'
  | 'ticket_prefix'
  | 'ticket_footer'
  | 'ticket_qr_value'
  | 'critical_action_pin'
  | 'primary_color'
  | 'accent_color';

type BooleanField =
  | 'prices_include_tax'
  | 'show_logo_on_ticket'
  | 'show_phone_on_ticket'
  | 'show_email_on_ticket'
  | 'show_address_on_ticket'
  | 'show_qr_on_ticket'
  | 'require_daily_close'
  | 'require_close_note'
  | 'allow_manual_expenses'
  | 'achievement_notifications'
  | 'sound_enabled'
  | 'alert_low_stock'
  | 'alert_goal_reached'
  | 'alert_cash_pending'
  | 'alert_new_sale'
  | 'alert_purchase_registered'
  | 'require_pin_delete_product'
  | 'require_pin_change_price'
  | 'require_pin_cancel_sale'
  | 'require_pin_close_cash'
  | 'confirm_destructive_actions';

const inputClass =
  'w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 font-bold text-white placeholder:text-blue-200/50 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20';

const labelClass =
  'block text-[11px] font-black text-blue-200 mb-2 uppercase tracking-[0.18em]';

function money(settings: StoreSettings | null, value: number) {
  const symbol = settings?.currency_symbol ?? '$';
  const decimals = settings?.decimal_places ?? 2;
  return `${symbol}${Number(value || 0).toFixed(decimals)}`;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs font-bold text-blue-200/70">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/15 p-4 text-left transition hover:bg-white/10"
    >
      <span>
        <span className="block text-sm font-black uppercase tracking-wide text-white">{label}</span>
        <span className="mt-1 block text-xs font-bold text-blue-200/75">{description}</span>
      </span>
      <span
        className={`relative h-8 w-14 shrink-0 rounded-full border transition ${
          checked ? 'border-emerald-300 bg-emerald-400' : 'border-white/20 bg-black/30'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-300">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
          <p className="mt-1 text-sm font-bold text-blue-200">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">{label}</p>
      <p className="mt-2 text-xl font-black text-yellow-300">{value}</p>
    </div>
  );
}

export function Settings() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('business');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await getStoreSettings(user?.id);
        if (mounted) setSettings(data);
      } catch (err) {
        console.error(err);
        if (mounted) setError('No se pudo cargar la configuración. Verifica el SQL de store_settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const dirtyPreview = useMemo(() => {
    if (!settings) return [];
    return [
      { label: 'Negocio', value: settings.business_name || 'Sin nombre' },
      { label: 'Moneda', value: `${settings.currency_symbol} ${settings.currency}` },
      { label: 'Meta diaria', value: money(settings, settings.daily_sales_goal) },
      { label: 'Stock bajo', value: `${settings.low_stock_threshold} pieza(s)` },
    ];
  }, [settings]);

  const ticketPreview = useMemo(() => {
    if (!settings) return null;
    return {
      folio: `${settings.ticket_prefix}${String(settings.ticket_start_number).padStart(4, '0')}`,
      subtotal: money(settings, 12.5),
      tax: money(settings, 12.5 * (settings.tax_rate / 100)),
      total: money(settings, settings.prices_include_tax ? 12.5 : 12.5 + 12.5 * (settings.tax_rate / 100)),
    };
  }, [settings]);

  function setText(field: TextField, value: string) {
    setSettings((current) => (current ? { ...current, [field]: value } : current));
  }

  function setNumber(field: NumericField, value: string) {
    const nextValue = value === '' ? 0 : Number(value);
    setSettings((current) => (current ? { ...current, [field]: Number.isNaN(nextValue) ? 0 : nextValue } : current));
  }

  function setBoolean(field: BooleanField, value: boolean) {
    setSettings((current) => (current ? { ...current, [field]: value } : current));
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!user?.id) {
      setError('No hay usuario activo para subir el logo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen válida para el logo.');
      return;
    }

    const maxSizeMb = 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`El logo debe pesar menos de ${maxSizeMb} MB.`);
      return;
    }

    setUploadingLogo(true);
    setMessage('');
    setError('');

    try {
      const publicUrl = await uploadBusinessLogo(user.id, file);
      setText('business_logo_url', publicUrl);
      setMessage('Logo subido correctamente. Presiona guardar cambios para dejarlo aplicado.');
      window.setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      console.error(err);
      setError('No se pudo subir el logo. Revisa que el bucket de imágenes permita subir archivos.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  function clearLogo() {
    setText('business_logo_url', '');
    setMessage('Logo removido. Presiona guardar cambios para aplicar.');
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const saved = await saveStoreSettings(settings);
      setSettings(saved);
      setMessage('Configuración guardada correctamente.');
      window.setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la configuración. Revisa permisos/RLS o conexión con Supabase.');
    } finally {
      setSaving(false);
    }
  }

  function restoreDefaults() {
    setSettings((current) => (current ? { ...current, ...DEFAULT_SETTINGS } : current));
    setMessage('Valores base cargados. Presiona guardar para aplicarlos.');
  }

  return (
    <div className="space-y-8 pb-10 text-white">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-yellow-300">Centro de control</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Configuración</h2>
          <p className="mt-2 text-xl font-medium text-blue-200">
            Ajustes avanzados para operar Snack Robots como un POS profesional.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={restoreDefaults}
            disabled={!settings || saving}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar base
          </button>
          <button
            onClick={handleSave}
            disabled={!settings || saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/30 transition hover:bg-orange-400 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </header>

      <div className="rounded-[28px] border-4 border-white/80 bg-sky-400/90 p-4 shadow-xl">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🤖</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Robo Blue dice:</p>
            <p className="text-sm font-black text-blue-900">
              Configura una vez y todos los módulos podrán usar estos valores: caja, metas, tickets, reportes y alertas.
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-3xl border border-emerald-300/40 bg-emerald-400/20 px-5 py-4 text-sm font-black text-emerald-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-300/40 bg-red-500/20 px-5 py-4 text-sm font-black text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="rounded-[32px] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md xl:sticky xl:top-6 xl:self-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black uppercase tracking-wide transition ${
                  active ? 'bg-white text-blue-700 shadow-lg' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}

          <div className="mt-4 rounded-3xl bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">Usuario actual</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-black">{profile?.display_name || 'Usuario'}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-300">
                  {profile?.global_role === 'super_admin' ? 'Super admin' : 'Administrador'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main>
          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[32px] border border-white/20 bg-white/10">
              <Loader2 className="h-10 w-10 animate-spin text-yellow-300" />
            </div>
          ) : settings ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {dirtyPreview.map((item) => (
                  <MiniCard key={item.label} label={item.label} value={item.value} />
                ))}
              </div>

              {activeTab === 'business' ? (
                <Section title="Datos del negocio" subtitle="Identidad visible en tickets, reportes y pantalla principal." icon={Building2}>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <Field label="Nombre del negocio">
                      <input className={inputClass} value={settings.business_name} onChange={(e) => setText('business_name', e.target.value)} />
                    </Field>
                    <Field label="Responsable / contacto">
                      <input className={inputClass} value={settings.business_contact_name} onChange={(e) => setText('business_contact_name', e.target.value)} placeholder="Ej. Angel" />
                    </Field>
                    <Field label="Teléfono">
                      <input className={inputClass} value={settings.business_phone} onChange={(e) => setText('business_phone', e.target.value)} placeholder="Ej. 832-000-0000" />
                    </Field>
                    <Field label="Correo">
                      <input className={inputClass} value={settings.business_email} onChange={(e) => setText('business_email', e.target.value)} placeholder="contacto@snackrobots.com" />
                    </Field>
                    <Field label="RFC / Tax ID" hint="Opcional. Útil para reportes formales.">
                      <input className={inputClass} value={settings.business_tax_id} onChange={(e) => setText('business_tax_id', e.target.value)} placeholder="Opcional" />
                    </Field>
                    <Field label="Sitio web">
                      <input className={inputClass} value={settings.business_website} onChange={(e) => setText('business_website', e.target.value)} placeholder="https://..." />
                    </Field>
                    <Field label="Instagram">
                      <input className={inputClass} value={settings.instagram_url} onChange={(e) => setText('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
                    </Field>
                    <Field label="Facebook">
                      <input className={inputClass} value={settings.facebook_url} onChange={(e) => setText('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
                    </Field>
                    <div className="lg:col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px]">
                      <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                        <span className={labelClass}>Logo del negocio</span>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={uploadingLogo}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                              {uploadingLogo ? 'Subiendo logo...' : 'Seleccionar logo'}
                            </button>
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                            {settings.business_logo_url ? (
                              <button
                                type="button"
                                onClick={clearLogo}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/15 px-5 py-3 text-xs font-black uppercase text-red-100 transition hover:bg-red-500/25"
                              >
                                <X className="h-4 w-4" />
                                Quitar logo
                              </button>
                            ) : null}
                          </div>
                          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">Vista previa</p>
                            <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-white/10">
                              {settings.business_logo_url ? (
                                <img src={settings.business_logo_url} alt="Logo" className="max-h-20 max-w-[160px] object-contain" />
                              ) : (
                                <Image className="h-10 w-10 text-blue-200" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Field label="Logo URL" hint="Puedes subir el logo o pegar una URL externa. Se guardará en la configuración del negocio.">
                            <input className={inputClass} value={settings.business_logo_url} onChange={(e) => setText('business_logo_url', e.target.value)} placeholder="https://..." />
                          </Field>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <Field label="Dirección">
                        <textarea className={`${inputClass} min-h-[110px] resize-none`} value={settings.business_address} onChange={(e) => setText('business_address', e.target.value)} placeholder="Dirección o ubicación del negocio" />
                      </Field>
                    </div>
                  </div>
                </Section>
              ) : null}

              {activeTab === 'sales' ? (
                <Section title="Ventas y moneda" subtitle="Impuestos, zona horaria y reglas para cálculos comerciales." icon={Calculator}>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                    <Field label="Moneda">
                      <select
                        className={inputClass}
                        value={settings.currency}
                        onChange={(e) => {
                          const currency = e.target.value as StoreSettings['currency'];
                          setSettings((current) =>
                            current
                              ? {
                                  ...current,
                                  currency,
                                  currency_symbol: '$',
                                }
                              : current,
                          );
                        }}
                      >
                        <option value="USD">Dólar estadounidense (USD)</option>
                        <option value="MXN">Peso mexicano (MXN)</option>
                      </select>
                    </Field>
                    <Field label="Símbolo">
                      <input className={inputClass} value={settings.currency_symbol} onChange={(e) => setText('currency_symbol', e.target.value)} />
                    </Field>
                    <Field label="Decimales">
                      <input type="number" min="0" max="4" className={inputClass} value={settings.decimal_places} onChange={(e) => setNumber('decimal_places', e.target.value)} />
                    </Field>
                    <Field label="Impuesto %">
                      <input type="number" step="0.01" className={inputClass} value={settings.tax_rate} onChange={(e) => setNumber('tax_rate', e.target.value)} />
                    </Field>
                    <Field label="Redondeo">
                      <select className={inputClass} value={settings.rounding_mode} onChange={(e) => setSettings((current) => (current ? { ...current, rounding_mode: e.target.value as StoreSettings['rounding_mode'] } : current))}>
                        <option value="none">Sin redondeo</option>
                        <option value="nearest_05">Al 0.05 más cercano</option>
                        <option value="nearest_10">Al 0.10 más cercano</option>
                      </select>
                    </Field>
                    <div className="lg:col-span-3">
                      <Field label="Zona horaria">
                        <input className={inputClass} value={settings.timezone} onChange={(e) => setText('timezone', e.target.value)} placeholder="America/Chicago" />
                      </Field>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Toggle label="Precios incluyen impuesto" description="Útil si vendes con precio final redondeado." checked={settings.prices_include_tax} onChange={(v) => setBoolean('prices_include_tax', v)} />
                    <Toggle label="Sonidos del sistema" description="Activa o apaga sonidos de venta, logro o alerta." checked={settings.sound_enabled} onChange={(v) => setBoolean('sound_enabled', v)} />
                  </div>
                </Section>
              ) : null}

              {activeTab === 'tickets' ? (
                <Section title="Tickets" subtitle="Define folios, pie de ticket y datos visibles al imprimir." icon={Receipt}>
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
                    <div>
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        <Field label="Prefijo de folio">
                          <input className={inputClass} value={settings.ticket_prefix} onChange={(e) => setText('ticket_prefix', e.target.value)} placeholder="SR-" />
                        </Field>
                        <Field label="Folio inicial">
                          <input type="number" className={inputClass} value={settings.ticket_start_number} onChange={(e) => setNumber('ticket_start_number', e.target.value)} />
                        </Field>
                        <Field label="QR / enlace">
                          <input className={inputClass} value={settings.ticket_qr_value} onChange={(e) => setText('ticket_qr_value', e.target.value)} placeholder="https://..." />
                        </Field>
                      </div>
                      <div className="mt-5">
                        <Field label="Mensaje al pie">
                          <input className={inputClass} value={settings.ticket_footer} onChange={(e) => setText('ticket_footer', e.target.value)} />
                        </Field>
                      </div>
                      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Toggle label="Mostrar logo" description="Usar logo del negocio en tickets y reportes." checked={settings.show_logo_on_ticket} onChange={(v) => setBoolean('show_logo_on_ticket', v)} />
                        <Toggle label="Mostrar teléfono" description="Agregar teléfono del negocio al ticket." checked={settings.show_phone_on_ticket} onChange={(v) => setBoolean('show_phone_on_ticket', v)} />
                        <Toggle label="Mostrar correo" description="Agregar correo del negocio al ticket." checked={settings.show_email_on_ticket} onChange={(v) => setBoolean('show_email_on_ticket', v)} />
                        <Toggle label="Mostrar dirección" description="Agregar dirección o ubicación al ticket." checked={settings.show_address_on_ticket} onChange={(v) => setBoolean('show_address_on_ticket', v)} />
                        <Toggle label="Mostrar QR" description="Preparado para QR de redes, web o promociones." checked={settings.show_qr_on_ticket} onChange={(v) => setBoolean('show_qr_on_ticket', v)} />
                      </div>
                    </div>
                    <div className="rounded-[28px] border border-white/15 bg-white/95 p-5 text-slate-900 shadow-xl">
                      <div className="text-center">
                        <p className="text-lg font-black">{settings.business_name}</p>
                        {settings.show_phone_on_ticket && settings.business_phone ? <p className="text-xs font-bold">{settings.business_phone}</p> : null}
                        {settings.show_email_on_ticket && settings.business_email ? <p className="text-xs font-bold">{settings.business_email}</p> : null}
                        {settings.show_address_on_ticket && settings.business_address ? <p className="text-xs font-bold">{settings.business_address}</p> : null}
                      </div>
                      <div className="my-4 border-t border-dashed border-slate-300" />
                      <div className="text-xs font-black uppercase tracking-wide text-slate-500">Ticket {ticketPreview?.folio}</div>
                      <div className="mt-3 space-y-2 text-sm font-bold">
                        <div className="flex justify-between"><span>Combo snacks</span><span>{ticketPreview?.subtotal}</span></div>
                        <div className="flex justify-between"><span>Impuesto</span><span>{ticketPreview?.tax}</span></div>
                        <div className="flex justify-between border-t pt-2 text-lg font-black"><span>Total</span><span>{ticketPreview?.total}</span></div>
                      </div>
                      {settings.show_qr_on_ticket ? <div className="mt-4 rounded-xl bg-slate-100 p-3 text-center text-xs font-black text-slate-500">QR preparado</div> : null}
                      <p className="mt-4 text-center text-xs font-black text-slate-500">{settings.ticket_footer}</p>
                    </div>
                  </div>
                </Section>
              ) : null}

              {activeTab === 'cash' ? (
                <Section title="Caja" subtitle="Reglas para apertura, cierre y control de efectivo." icon={CreditCard}>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <Field label="Fondo inicial por defecto">
                      <input type="number" step="0.01" className={inputClass} value={settings.opening_cash_default} onChange={(e) => setNumber('opening_cash_default', e.target.value)} />
                    </Field>
                    <Field label="Stock bajo desde">
                      <input type="number" className={inputClass} value={settings.low_stock_threshold} onChange={(e) => setNumber('low_stock_threshold', e.target.value)} />
                    </Field>
                    <Field label="Tiempo sesión (min)">
                      <input type="number" className={inputClass} value={settings.session_timeout_minutes} onChange={(e) => setNumber('session_timeout_minutes', e.target.value)} />
                    </Field>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Toggle label="Requerir cierre diario" description="Ayuda a mantener auditoría de caja." checked={settings.require_daily_close} onChange={(v) => setBoolean('require_daily_close', v)} />
                    <Toggle label="Requerir nota al cerrar" description="Pide explicación si hay diferencia de efectivo." checked={settings.require_close_note} onChange={(v) => setBoolean('require_close_note', v)} />
                    <Toggle label="Permitir gastos manuales" description="Preparado para gastos no relacionados a compras." checked={settings.allow_manual_expenses} onChange={(v) => setBoolean('allow_manual_expenses', v)} />
                  </div>
                </Section>
              ) : null}

              {activeTab === 'goals' ? (
                <Section title="Metas" subtitle="Valores base para objetivos diarios y mensuales." icon={Flag}>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                    <Field label="Venta diaria">
                      <input type="number" step="0.01" className={inputClass} value={settings.daily_sales_goal} onChange={(e) => setNumber('daily_sales_goal', e.target.value)} />
                    </Field>
                    <Field label="Utilidad diaria">
                      <input type="number" step="0.01" className={inputClass} value={settings.daily_profit_goal} onChange={(e) => setNumber('daily_profit_goal', e.target.value)} />
                    </Field>
                    <Field label="Venta mensual">
                      <input type="number" step="0.01" className={inputClass} value={settings.monthly_sales_goal} onChange={(e) => setNumber('monthly_sales_goal', e.target.value)} />
                    </Field>
                    <Field label="Piezas meta">
                      <input type="number" className={inputClass} value={settings.items_goal} onChange={(e) => setNumber('items_goal', e.target.value)} />
                    </Field>
                  </div>
                </Section>
              ) : null}

              {activeTab === 'alerts' ? (
                <Section title="Alertas y gamificación" subtitle="Notificaciones que harán sentir vivo al sistema." icon={Trophy}>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Toggle label="Notificar logros" description="Mostrar avisos cuando se desbloqueen medallas." checked={settings.achievement_notifications} onChange={(v) => setBoolean('achievement_notifications', v)} />
                    <Toggle label="Sonidos activos" description="Habilita efectos suaves para ventas, metas y alertas." checked={settings.sound_enabled} onChange={(v) => setBoolean('sound_enabled', v)} />
                    <Toggle label="Stock bajo" description="Avisar cuando un producto llegue al mínimo configurado." checked={settings.alert_low_stock} onChange={(v) => setBoolean('alert_low_stock', v)} />
                    <Toggle label="Meta cumplida" description="Avisar cuando se alcance una meta diaria o mensual." checked={settings.alert_goal_reached} onChange={(v) => setBoolean('alert_goal_reached', v)} />
                    <Toggle label="Nueva venta" description="Preparado para alertas en dashboard y caja." checked={settings.alert_new_sale} onChange={(v) => setBoolean('alert_new_sale', v)} />
                    <Toggle label="Compra registrada" description="Aviso cuando entre mercancía nueva al inventario." checked={settings.alert_purchase_registered} onChange={(v) => setBoolean('alert_purchase_registered', v)} />
                    <Toggle label="Caja pendiente" description="Recordatorio si falta cerrar caja." checked={settings.alert_cash_pending} onChange={(v) => setBoolean('alert_cash_pending', v)} />
                  </div>
                </Section>
              ) : null}

              {activeTab === 'security' ? (
                <Section title="Seguridad" subtitle="Base para permisos, auditoría y acciones críticas." icon={ShieldCheck}>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                      <div className="mb-3 flex items-center gap-3 text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-black uppercase tracking-wide">Rol activo</p>
                      </div>
                      <p className="text-2xl font-black">{profile?.global_role === 'super_admin' ? 'SUPER ADMIN' : 'ADMINISTRADOR'}</p>
                      <p className="mt-2 text-sm font-bold text-blue-200">Super Admin controla todo. Store Admin puede operar la tienda, pero acciones críticas deben pedir PIN superior.</p>
                    </div>
                    <Field label="PIN de Super Admin" hint="Este PIN protege acciones delicadas del Store Admin: precios, cancelaciones, cierre de caja, roles y configuración crítica.">
                      <input className={inputClass} value={settings.critical_action_pin} onChange={(e) => setText('critical_action_pin', e.target.value)} placeholder="Ej. 1234" />
                    </Field>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-yellow-300/20 bg-yellow-400/10 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-300">Super Admin</p>
                      <p className="mt-2 text-sm font-bold text-yellow-50">Dueño del sistema. Autoriza cambios críticos, roles, configuración y reportes sensibles.</p>
                    </div>
                    <div className="rounded-3xl border border-sky-300/20 bg-sky-400/10 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Store Admin</p>
                      <p className="mt-2 text-sm font-bold text-blue-50">Administrador de tienda. Tiene permisos avanzados, pero acciones delicadas requieren PIN de Super Admin.</p>
                    </div>
                    <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Staff</p>
                      <p className="mt-2 text-sm font-bold text-emerald-50">Cajero/empleado. Opera ventas y consulta lo necesario sin tocar datos sensibles.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Toggle label="Confirmar acciones destructivas" description="Confirmación visual antes de desactivar o modificar datos críticos." checked={settings.confirm_destructive_actions} onChange={(v) => setBoolean('confirm_destructive_actions', v)} />
                    <Toggle label="PIN para eliminar producto" description="Protege desactivación o eliminación futura de productos." checked={settings.require_pin_delete_product} onChange={(v) => setBoolean('require_pin_delete_product', v)} />
                    <Toggle label="PIN para cambiar precio" description="Evita cambios accidentales en precios de venta." checked={settings.require_pin_change_price} onChange={(v) => setBoolean('require_pin_change_price', v)} />
                    <Toggle label="PIN para cancelar venta" description="Preparado para cancelaciones y devoluciones." checked={settings.require_pin_cancel_sale} onChange={(v) => setBoolean('require_pin_cancel_sale', v)} />
                    <Toggle label="PIN para cerrar caja" description="Puede obligar validación antes del cierre del día." checked={settings.require_pin_close_cash} onChange={(v) => setBoolean('require_pin_close_cash', v)} />
                  </div>
                </Section>
              ) : null}

              {activeTab === 'appearance' ? (
                <Section title="Apariencia" subtitle="Branding visual de la tienda y preparación para temas futuros." icon={Paintbrush}>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <Field label="Modo visual">
                      <select className={inputClass} value={settings.appearance_mode} onChange={(e) => setSettings((current) => (current ? { ...current, appearance_mode: e.target.value as StoreSettings['appearance_mode'] } : current))}>
                        <option value="system">Sistema</option>
                        <option value="dark">Oscuro</option>
                        <option value="light">Claro</option>
                      </select>
                    </Field>
                    <Field label="Color principal">
                      <input className={inputClass} value={settings.primary_color} onChange={(e) => setText('primary_color', e.target.value)} placeholder="#2563eb" />
                    </Field>
                    <Field label="Color acento">
                      <input className={inputClass} value={settings.accent_color} onChange={(e) => setText('accent_color', e.target.value)} placeholder="#f97316" />
                    </Field>
                  </div>
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                    <div className="mb-4 flex items-center gap-3 text-blue-200">
                      <Globe2 className="h-5 w-5" />
                      <p className="font-black uppercase tracking-wide">Vista de marca</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl p-5 font-black text-white" style={{ background: settings.primary_color }}>Principal</div>
                      <div className="rounded-2xl p-5 font-black text-white" style={{ background: settings.accent_color }}>Acento</div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 font-black text-white">Snack Robots Premium</div>
                    </div>
                    <p className="mt-4 text-sm font-bold text-blue-200">
                      Por ahora estos valores quedan guardados para preparar temas por tienda. El branding principal azul/morado/naranja sigue activo en la UI.
                    </p>
                  </div>
                </Section>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[32px] border border-white/20 bg-white/10 p-8 text-center font-black">
              No se pudo cargar la configuración.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
