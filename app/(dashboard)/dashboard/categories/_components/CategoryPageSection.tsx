'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_CURRENCY_OPTIONS } from '@/lib/supported-currencies';
import { ImageUploadField } from '../../_components/ImageUploadField';
import { dt } from "@/lib/dashboard/i18n";

/**
 * The landing page a category owns, as the dashboard edits it.
 *
 * Every category is published as a project page in the shape of
 * `Minbar/مشروع ترميم منازل القدس.dc.html`. The translated copy  the lead, the
 * figure labels, the headings  lives in the form's language tabs above this
 * section, because it is per-locale; everything here is the page's structure:
 * the images, the numbers and the campaign the donation box gives to.
 *
 * Each part is optional. A category with none of it still publishes  as its
 * hero and its campaigns  so this section never has to be filled in to save.
 */

/** A campaign the donation box can give to. */
export interface CampaignOption {
  id: string;
  title: string;
}

/** One per-currency exception to the USD amounts, as the editor types it. */
export interface CurrencyAmountsRow {
  id: string;
  currency: string;
  amountsStr: string;
}

/**
 * The donation box's target, as the select holds it:
 *   ''          → automatic  the first campaign by priority
 *   'category'  → the category itself (the order carries a category item)
 *   <ObjectId>  → that campaign
 */
export const DONATE_TO_CATEGORY = 'category';

export interface CategoryPageValues {
  /** "" for the category's own page, else the site page it is published as. */
  pageTemplate: string;
  heroImage: string;
  heroVideoUrl: string;
  statDoneValue: string;
  statGoalValue: string;
  suggestedAmounts: string;
  suggestedByCurrency: CurrencyAmountsRow[];
  donateTarget: string;
}

export function emptyCategoryPage(): CategoryPageValues {
  return {
    pageTemplate: '',
    heroImage: '',
    heroVideoUrl: '',
    statDoneValue: '',
    statGoalValue: '',
    suggestedAmounts: '',
    suggestedByCurrency: [],
    donateTarget: '',
  };
}

export function currencyAmountsRow(currency = 'EUR', amountsStr = ''): CurrencyAmountsRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, currency, amountsStr };
}

/** `{ EUR: [50, 100] }` → editor rows, in the stored order. */
export function currencyRowsFrom(raw: unknown): CurrencyAmountsRow[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, list]) => Array.isArray(list))
    .map(([currency, list]) => currencyAmountsRow(currency, (list as unknown[]).join(', ')));
}

/** Editor rows → `{ EUR: [50, 100] }`; a row with no currency or no amounts is dropped. */
export function currencyRowsToMap(rows: CurrencyAmountsRow[]): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const row of rows) {
    const code = row.currency.trim().toUpperCase();
    const list = parseAmountList(row.amountsStr);
    if (code && list.length) out[code] = list;
  }
  return out;
}

/** What the API is sent for the box's target  see `DONATE_TO_CATEGORY`. */
export function donateTargetPayload(target: string): { donateToCategory: boolean; donateCampaignId: string | null } {
  return {
    donateToCategory: target === DONATE_TO_CATEGORY,
    donateCampaignId: target && target !== DONATE_TO_CATEGORY ? target : null,
  };
}

/** `"100, 300, 500"` → `[100, 300, 500]`; the API drops anything ≤ 0 anyway. */
export function parseAmountList(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((v) => Number(v.replace(/[^0-9]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function CategoryPageSection({
  values,
  onChange,
  /** Campaigns of this category, for the donation box's target. */
  campaignOptions,
}: {
  values: CategoryPageValues;
  onChange: (next: CategoryPageValues) => void;
  campaignOptions: CampaignOption[];
}) {
  const set = <K extends keyof CategoryPageValues>(key: K, v: CategoryPageValues[K]) =>
    onChange({ ...values, [key]: v });

  const setCurrencyRow = (id: string, patch: Partial<Pick<CurrencyAmountsRow, 'currency' | 'amountsStr'>>) =>
    set('suggestedByCurrency', values.suggestedByCurrency.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <>
      {/* ── Hero & figures ───────────────────────────────────────────── */}
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-sm font-bold">{dt("صفحة الحملة  الواجهة والأرقام")}</h2>
          <p className="text-xs text-slate-500">
            {dt("تُنشر كل حملة كصفحة مشروع كاملة. النصوص المترجمة (المقدمة، عناوين الأقسام، وصف الأرقام) في تبويبات اللغات بالأعلى؛ هنا بنية الصفحة. كل جزء اختياري  الحملة بلا أي منها تظهر بواجهتها ومشاريعها.")}</p>
        </div>

        {/* A category may be published as one of the site's own pages instead
            of the generic landing page; everything below still applies  the
            page folds it in where it belongs. */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-600">{dt("الصفحة التي تُنشر بها الحملة")}</span>
          <Select value={values.pageTemplate || 'own'} onValueChange={(v) => set('pageTemplate', v === 'own' ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="own">{dt("صفحة الحملة التلقائية")}</SelectItem>
              <SelectItem value="aqsa">{dt("صفحة المسجد الأقصى الثابتة")}</SelectItem>
              <SelectItem value="zakat">{dt("صفحة الزكاة الثابتة")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="block text-[11px] text-slate-500">
            {values.pageTemplate
              ? dt("رابط الحملة يحوّل إلى هذه الصفحة، وتظهر فيها مشاريعها كلها وكل ما تضبطه هنا: الأرقام وصندوق التبرع، كلٌّ في مكانه. صورة الواجهة ومقدمتها وزرّها تحل محل صورة الصفحة ومقدمتها.")
              : dt("الافتراضي: صفحة مستقلة بالشكل الموحّد. اختر صفحة ثابتة لتُدمج الحملة فيها بدل ذلك.")}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ImageUploadField
            label={dt("صورة الواجهة (عريضة، خلف العنوان)")}
            value={values.heroImage}
            onChange={(url) => set('heroImage', url)}
            previewClass="w-56 h-32"
          />
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{dt("فيديو الواجهة (رابط يوتيوب أو معرّف)")}</span>
            <Input dir="ltr" placeholder="https://www.youtube.com/watch?v=..." value={values.heroVideoUrl} onChange={(e) => set('heroVideoUrl', e.target.value)} />
            <span className="block text-[11px] text-slate-500">{dt("يظهر بجانب العنوان في الواجهة. اتركه فارغًا ليأخذ النص العرض كاملًا.")}</span>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{dt("الرقم المُنجز")}</span>
            <Input dir="ltr" inputMode="numeric" placeholder="45" value={values.statDoneValue} onChange={(e) => set('statDoneValue', e.target.value.replace(/[^0-9]/g, ''))} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{dt("رقم الهدف")}</span>
            <Input dir="ltr" inputMode="numeric" placeholder="100" value={values.statGoalValue} onChange={(e) => set('statGoalValue', e.target.value.replace(/[^0-9]/g, ''))} />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          {dt("شريط التقدم تحت الرقمين يُحسب منهما. اترك الهدف فارغًا ليختفي شريط الأرقام كله. وصف كل رقم يُكتب في تبويبات اللغات.")}</p>
      </Card>

      {/* ── The donation box ─────────────────────────────────────────── */}
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-sm font-bold">{dt("صندوق التبرع")}</h2>
          <p className="text-xs text-slate-500">
            {dt("يوجّه الصندوق تبرعه إمّا إلى الحملة نفسها  فيُسجَّل التبرع عليها مباشرة  أو إلى مشروع واحد من مشاريعها. «تلقائي» يختار أول مشروع بحسب الأولوية.")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{dt("وجهة التبرع")}</span>
            <Select
              value={values.donateTarget || 'auto'}
              onValueChange={(v) => set('donateTarget', v === 'auto' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder={dt("تلقائي")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={DONATE_TO_CATEGORY}>{dt("الحملة نفسها  لا مشروعًا بعينه")}</SelectItem>
                <SelectItem value="auto">{dt("تلقائي  أول مشروع بحسب الأولوية")}</SelectItem>
                {campaignOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{dt("المبالغ المقترحة (جميع العملات)")}</span>
            <Input dir="ltr" placeholder="100, 200, 300, 500, 700" value={values.suggestedAmounts} onChange={(e) => set('suggestedAmounts', e.target.value)} />
            <span className="block text-[11px] text-slate-500">
              {dt("بالدولار، مفصولة بفاصلة؛ تُعرض محوَّلة إلى عملة الزائر ما لم تُضف استثناءً أدناه. اتركها فارغة لاستخدام مبالغ الموقع الافتراضية.")}</span>
          </label>
        </div>

        {/* Per-currency exceptions  the same rows as the campaign form's
            suggested donations, so an editor who knows one knows the other. */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">{dt("استثناءات حسب العملة (اختياري)")}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => set('suggestedByCurrency', [...values.suggestedByCurrency, currencyAmountsRow()])}>
              <Plus className="me-1 h-4 w-4" />
              {dt("إضافة عملة")}</Button>
          </div>
          {values.suggestedByCurrency.length === 0 ? (
            <p className="text-[11px] text-slate-500">{dt("بدون استثناءات، تُطبّق المبالغ أعلاه على كل العملات.")}</p>
          ) : (
            <div className="space-y-3">
              {values.suggestedByCurrency.map((row) => (
                <div key={row.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end">
                  <div className="min-w-[140px] flex-1 space-y-1">
                    <span className="text-[11px] text-slate-500">{dt("العملة")}</span>
                    <Select value={row.currency} onValueChange={(v) => setCurrencyRow(row.id, { currency: v })}>
                      <SelectTrigger dir="ltr"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCY_OPTIONS.filter((c) => c.code !== 'USD').map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.code}  {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex-[2] space-y-1">
                    <span className="text-[11px] text-slate-500">{dt("المبالغ لهذه العملة (كما تُعرض، بلا تحويل)")}</span>
                    <Input dir="ltr" className="font-mono" placeholder={dt("مثال: 50, 100, 200")} value={row.amountsStr} onChange={(e) => setCurrencyRow(row.id, { amountsStr: e.target.value })} />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => set('suggestedByCurrency', values.suggestedByCurrency.filter((r) => r.id !== row.id))}
                    aria-label={dt("حذف الصف")}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
