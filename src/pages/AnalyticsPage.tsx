import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AnalyticsApiPeriod, AnalyticsResponse } from '../contracts/analytics'
import { apiJson } from '../lib/api'
import './AnalyticsPage.css'
import AnalyticsLineChart, { type AnalyticsChartPoint } from './analytics/AnalyticsLineChart'

type AnalyticsPeriod = '7' | '30' | '90' | 'ozel'

const periodOptions: { label: string; value: AnalyticsPeriod }[] = [
  { label: 'Son 7 Gün', value: '7' }, { label: 'Son 30 Gün', value: '30' },
  { label: 'Son 90 Gün', value: '90' }, { label: 'Özel Tarih', value: 'ozel' },
]
const validPeriods = new Set<AnalyticsPeriod>(periodOptions.map((option) => option.value))
const dayInMilliseconds = 24 * 60 * 60 * 1000
const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
const defaultCustomEndDate = today
const defaultCustomStartDate = new Date(Date.parse(`${today}T00:00:00Z`) - 13 * dayInMilliseconds).toISOString().slice(0, 10)
const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', maximumFractionDigits: 2, style: 'currency' })
const integerFormatter = new Intl.NumberFormat('tr-TR')
const percentageFormatter = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const rangeDateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', timeZone: 'UTC', year: 'numeric' })

function formatCurrency(valueMinor: number) { return currencyFormatter.format(valueMinor / 100) }
function formatDate(value: string) { return rangeDateFormatter.format(new Date(`${value}T00:00:00Z`)) }
function isValidDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value)
}
function offsetDate(date: string, days: number) { return new Date(Date.parse(`${date}T00:00:00Z`) + days * dayInMilliseconds).toISOString().slice(0, 10) }
function getPresetDates(period: Exclude<AnalyticsPeriod, 'ozel'>) { return { endDate: today, startDate: offsetDate(today, -(Number(period) - 1)) } }
function getComparisonLabel(current: number, previous: number) {
  if (previous === 0) return 'Önceki dönemde karşılaştırılabilir veri yok'
  const change = ((current - previous) / previous) * 100
  if (change === 0) return 'Önceki eşdeğer döneme göre değişim yok'
  return `Önceki eşdeğer döneme göre %${percentageFormatter.format(Math.abs(change))} ${change > 0 ? 'artış' : 'azalış'}`
}

function normalizeSearchParams(searchParams: URLSearchParams) {
  const normalized = new URLSearchParams(searchParams)
  const rawPeriod = searchParams.get('donem')
  const period = validPeriods.has(rawPeriod as AnalyticsPeriod) ? rawPeriod as AnalyticsPeriod : '30'
  if (period === 'ozel') {
    const rawStartDate = searchParams.get('baslangic')
    const rawEndDate = searchParams.get('bitis')
    const validRange = isValidDate(rawStartDate) && isValidDate(rawEndDate) && rawStartDate <= rawEndDate
    const startDate = validRange ? rawStartDate : defaultCustomStartDate
    const endDate = validRange ? rawEndDate : defaultCustomEndDate
    normalized.set('donem', 'ozel'); normalized.set('baslangic', startDate); normalized.set('bitis', endDate)
    return { endDate, normalized, period, startDate }
  }
  const dates = getPresetDates(period)
  normalized.delete('baslangic'); normalized.delete('bitis')
  if (period === '30') normalized.delete('donem'); else normalized.set('donem', period)
  return { ...dates, normalized, period }
}

function createChartData(current: { date: string; value: number }[], previous?: number[]): AnalyticsChartPoint[] {
  return current.map((point, index) => ({ current: point.value, date: point.date, previous: previous?.[index] }))
}

function AnalyticsContent({ analytics, endDate, periodLabel, startDate }: { analytics: AnalyticsResponse; endDate: string; periodLabel: string; startDate: string }) {
  const kpis = [
    { comparison: getComparisonLabel(analytics.current.totalSalesMinor, analytics.previous.totalSalesMinor), label: 'Toplam Satış', value: formatCurrency(analytics.current.totalSalesMinor) },
    { comparison: getComparisonLabel(analytics.current.totalOrderCount, analytics.previous.totalOrderCount), label: 'Sipariş Sayısı', value: integerFormatter.format(analytics.current.totalOrderCount) },
    { comparison: getComparisonLabel(analytics.current.averageOrderMinor ?? 0, analytics.previous.averageOrderMinor ?? 0), label: 'Ortalama Sipariş Tutarı', value: analytics.current.averageOrderMinor === null ? '—' : formatCurrency(analytics.current.averageOrderMinor) },
    { comparison: getComparisonLabel(analytics.current.soldUnitCount, analytics.previous.soldUnitCount), label: 'Satılan Ürün Adedi', value: integerFormatter.format(analytics.current.soldUnitCount) },
  ]
  const salesChartData = createChartData(analytics.currentTrend.map((point) => ({ date: point.date, value: point.salesMinor })), analytics.previousTrend.map((point) => point.salesMinor))
  const orderChartData = createChartData(analytics.currentTrend.map((point) => ({ date: point.date, value: point.orderCount })))
  const averageChartData = createChartData(analytics.currentTrend.map((point) => ({ date: point.date, value: point.averageOrderMinor ?? 0 })))
  const isEmpty = analytics.current.totalOrderCount === 0 && analytics.current.soldUnitCount === 0

  return <>
    {isEmpty ? <p className="analytics-empty" role="status">Seçili dönemde analiz verisi bulunmuyor.</p> : null}
    <section aria-label="Analiz özeti" className="analytics-kpis">{kpis.map((kpi) => <article className="analytics-kpi" key={kpi.label}><span>{kpi.label}</span><strong>{kpi.value}</strong><p>{kpi.comparison}</p></article>)}</section>
    <AnalyticsLineChart ariaLabel={`${periodLabel} satış trendi`} chartId="sales-trend" data={salesChartData} description="Seçili dönem ve önceki eşdeğer dönem karşılaştırması" key={`sales-${startDate}-${endDate}`} title="Satış Trendi" valueFormatter={formatCurrency} />
    <div className="analytics-grid analytics-grid--trends"><AnalyticsLineChart ariaLabel={`${periodLabel} sipariş trendi`} chartId="orders-trend" data={orderChartData} description="İptal hariç geçerli siparişler" key={`orders-${startDate}-${endDate}`} title="Sipariş Trendi" valueFormatter={(value) => `${integerFormatter.format(value)} sipariş`} /><AnalyticsLineChart ariaLabel={`${periodLabel} ortalama sipariş tutarı trendi`} chartId="average-order-trend" data={averageChartData} description="Yalnız tamamlanmış siparişler" key={`average-${startDate}-${endDate}`} title="Ortalama Sipariş Tutarı" valueFormatter={formatCurrency} /></div>
    <div className="analytics-grid analytics-grid--performance">
      <section aria-labelledby="top-products-title" className="analytics-panel"><header className="analytics-panel__header"><div><h2 id="top-products-title">En Çok Satan 5 Ürün</h2><p>Satılan ürün adedine göre sıralanır</p></div></header>{analytics.topProducts.length ? <ol className="analytics-products">{analytics.topProducts.map((product) => <li key={`${product.category}-${product.name}`}><strong>{product.name}</strong><span>{integerFormatter.format(product.soldUnitCount)} adet</span><span>{formatCurrency(product.revenueMinor)}</span></li>)}</ol> : <p className="analytics-panel__empty">Ürün performans verisi bulunmuyor.</p>}</section>
      <section aria-labelledby="category-performance-title" className="analytics-panel"><header className="analytics-panel__header"><div><h2 id="category-performance-title">Kategori Performansı</h2><p>Satış tutarı ve toplam satış içindeki pay</p></div></header>{analytics.categories.length ? <ul className="analytics-categories">{analytics.categories.map((category) => <li key={category.name}><div><strong>{category.name}</strong><span>{formatCurrency(category.revenueMinor)} · %{percentageFormatter.format(category.share)}</span></div><div aria-label={`${category.name} payı yüzde ${percentageFormatter.format(category.share)}`} className="analytics-category-bar" role="img"><span style={{ width: `${category.share}%` }} /></div></li>)}</ul> : <p className="analytics-panel__empty">Kategori performans verisi bulunmuyor.</p>}</section>
    </div>
  </>
}

function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reloadKey, setReloadKey] = useState(0)
  const [loadState, setLoadState] = useState<{ key: string; data: AnalyticsResponse | null; error: boolean }>({ key: '', data: null, error: false })
  const currentSearch = searchParams.toString()
  const normalizedView = useMemo(() => normalizeSearchParams(new URLSearchParams(currentSearch)), [currentSearch])
  const { endDate, normalized, period, startDate } = normalizedView
  const normalizedSearch = normalized.toString()
  const apiPeriod: AnalyticsApiPeriod = period === 'ozel' ? 'custom' : period
  const apiQuery = new URLSearchParams({ endDate, period: apiPeriod, startDate }).toString()
  const requestKey = `${apiQuery}:${reloadKey}`
  const isLoading = loadState.key !== requestKey
  const analytics = isLoading ? null : loadState.data
  const hasError = !isLoading && loadState.error
  const periodLabel = period === 'ozel' ? `${formatDate(startDate)} – ${formatDate(endDate)}` : periodOptions.find((option) => option.value === period)?.label ?? ''

  useEffect(() => { if (currentSearch !== normalizedSearch) setSearchParams(normalized, { replace: true }) }, [currentSearch, normalized, normalizedSearch, setSearchParams])
  useEffect(() => {
    const controller = new AbortController()
    apiJson<AnalyticsResponse>(`/api/analytics?${apiQuery}`, { signal: controller.signal })
      .then((data) => setLoadState({ key: requestKey, data, error: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState({ key: requestKey, data: null, error: true })
      })
    return () => controller.abort()
  }, [apiQuery, requestKey])

  const handlePeriodChange = (nextPeriod: AnalyticsPeriod) => {
    const next = new URLSearchParams(searchParams); next.delete('baslangic'); next.delete('bitis')
    if (nextPeriod === '30') next.delete('donem'); else next.set('donem', nextPeriod)
    if (nextPeriod === 'ozel') { next.set('baslangic', defaultCustomStartDate); next.set('bitis', defaultCustomEndDate) }
    setSearchParams(next)
  }
  const handleCustomDateChange = (key: 'baslangic' | 'bitis', value: string) => { const next = new URLSearchParams(searchParams); next.set('donem', 'ozel'); next.set(key, value); setSearchParams(next, { replace: true }) }

  return <div className="analytics-page"><header className="analytics-page__header"><div><h1 id="page-title">Analizler</h1><p>Dönemsel satış, sipariş ve ürün performansını değerlendirin.</p></div><div className="analytics-period-control"><label htmlFor="analytics-period">Tarih aralığı</label><select id="analytics-period" onChange={(event) => handlePeriodChange(event.target.value as AnalyticsPeriod)} value={period}>{periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></header>{period === 'ozel' ? <fieldset className="analytics-custom-range"><legend>Özel tarih aralığı</legend><label>Başlangıç<input max={endDate} onChange={(event) => handleCustomDateChange('baslangic', event.target.value)} type="date" value={startDate} /></label><label>Bitiş<input min={startDate} onChange={(event) => handleCustomDateChange('bitis', event.target.value)} type="date" value={endDate} /></label></fieldset> : null}<p className="analytics-page__range-summary">Gösterilen dönem: {periodLabel}</p>{isLoading ? <section className="analytics-panel analytics-state" role="status"><h2>Analizler yükleniyor</h2><p>Lütfen bekleyin.</p></section> : hasError ? <section className="analytics-panel analytics-state" role="alert"><h2>Analizler yüklenemedi</h2><p>Bağlantıyı kontrol edip yeniden deneyin.</p><button onClick={() => setReloadKey((key) => key + 1)} type="button">Yeniden Dene</button></section> : analytics ? <AnalyticsContent analytics={analytics} endDate={endDate} periodLabel={periodLabel} startDate={startDate} /> : null}</div>
}

export default AnalyticsPage
