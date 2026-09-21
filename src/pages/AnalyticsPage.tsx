import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import './AnalyticsPage.css'
import AnalyticsLineChart, {
  type AnalyticsChartPoint,
} from './analytics/AnalyticsLineChart'
import {
  createAnalyticsView,
  defaultCustomEndDate,
  defaultCustomStartDate,
  getPresetDates,
  type AnalyticsPeriod,
} from './analytics/analyticsDemoData'

const periodOptions: { label: string; value: AnalyticsPeriod }[] = [
  { label: 'Son 7 Gün', value: '7' },
  { label: 'Son 30 Gün', value: '30' },
  { label: 'Son 90 Gün', value: '90' },
  { label: 'Özel Tarih', value: 'ozel' },
]

const validPeriods = new Set<AnalyticsPeriod>(periodOptions.map((option) => option.value))

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  currency: 'TRY',
  maximumFractionDigits: 2,
  style: 'currency',
})
const integerFormatter = new Intl.NumberFormat('tr-TR')
const percentageFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})
const rangeDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

function formatCurrency(valueInKurus: number) {
  return currencyFormatter.format(valueInKurus / 100)
}

function formatDate(value: string) {
  return rangeDateFormatter.format(new Date(`${value}T00:00:00Z`))
}

function isValidDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
}

function getComparisonLabel(current: number, previous: number) {
  if (previous === 0) {
    return 'Önceki dönemde karşılaştırılabilir veri yok'
  }

  const change = ((current - previous) / previous) * 100

  if (change === 0) {
    return 'Önceki eşdeğer döneme göre değişim yok'
  }

  return `Önceki eşdeğer döneme göre %${percentageFormatter.format(Math.abs(change))} ${
    change > 0 ? 'artış' : 'azalış'
  }`
}

function normalizeSearchParams(searchParams: URLSearchParams) {
  const normalized = new URLSearchParams(searchParams)
  const rawPeriod = searchParams.get('donem')
  const period = validPeriods.has(rawPeriod as AnalyticsPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : '30'

  if (period === 'ozel') {
    const rawStartDate = searchParams.get('baslangic')
    const rawEndDate = searchParams.get('bitis')
    const hasValidRange =
      isValidDate(rawStartDate) && isValidDate(rawEndDate) && rawStartDate <= rawEndDate
    const startDate = hasValidRange ? rawStartDate : defaultCustomStartDate
    const endDate = hasValidRange ? rawEndDate : defaultCustomEndDate

    normalized.set('donem', 'ozel')
    normalized.set('baslangic', startDate)
    normalized.set('bitis', endDate)

    return { endDate, normalized, period, startDate }
  }

  const dates = getPresetDates(period)
  normalized.delete('baslangic')
  normalized.delete('bitis')

  if (period === '30') {
    normalized.delete('donem')
  } else {
    normalized.set('donem', period)
  }

  return { ...dates, normalized, period }
}

function createChartData(
  currentValues: { date: string; value: number }[],
  previousValues?: number[],
): AnalyticsChartPoint[] {
  return currentValues.map((point, index) => ({
    current: point.value,
    date: point.date,
    previous: previousValues?.[index],
  }))
}

function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentSearch = searchParams.toString()
  const { endDate, normalized, period, startDate } = normalizeSearchParams(searchParams)
  const normalizedSearch = normalized.toString()
  const analytics = useMemo(
    () => createAnalyticsView(startDate, endDate, period),
    [endDate, period, startDate],
  )
  const periodLabel =
    period === 'ozel'
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : periodOptions.find((option) => option.value === period)?.label

  useEffect(() => {
    if (currentSearch !== normalizedSearch) {
      setSearchParams(normalized, { replace: true })
    }
  }, [currentSearch, normalized, normalizedSearch, setSearchParams])

  const handlePeriodChange = (nextPeriod: AnalyticsPeriod) => {
    const nextSearchParams = new URLSearchParams(searchParams)

    nextSearchParams.delete('baslangic')
    nextSearchParams.delete('bitis')

    if (nextPeriod === '30') {
      nextSearchParams.delete('donem')
    } else {
      nextSearchParams.set('donem', nextPeriod)
    }

    if (nextPeriod === 'ozel') {
      nextSearchParams.set('baslangic', defaultCustomStartDate)
      nextSearchParams.set('bitis', defaultCustomEndDate)
    }

    setSearchParams(nextSearchParams)
  }

  const handleCustomDateChange = (key: 'baslangic' | 'bitis', value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('donem', 'ozel')
    nextSearchParams.set(key, value)
    setSearchParams(nextSearchParams, { replace: true })
  }

  const kpis: { comparison: string; label: string; value: string }[] = [
    {
      comparison: getComparisonLabel(
        analytics.current.totalSalesInKurus,
        analytics.previous.totalSalesInKurus,
      ),
      label: 'Toplam Satış',
      value: formatCurrency(analytics.current.totalSalesInKurus),
    },
    {
      comparison: getComparisonLabel(
        analytics.current.totalOrderCount,
        analytics.previous.totalOrderCount,
      ),
      label: 'Sipariş Sayısı',
      value: integerFormatter.format(analytics.current.totalOrderCount),
    },
    {
      comparison: getComparisonLabel(
        analytics.current.averageOrderAmountInKurus ?? 0,
        analytics.previous.averageOrderAmountInKurus ?? 0,
      ),
      label: 'Ortalama Sipariş Tutarı',
      value:
        analytics.current.averageOrderAmountInKurus === null
          ? '—'
          : formatCurrency(analytics.current.averageOrderAmountInKurus),
    },
    {
      comparison: getComparisonLabel(
        analytics.current.soldUnitCount,
        analytics.previous.soldUnitCount,
      ),
      label: 'Satılan Ürün Adedi',
      value: integerFormatter.format(analytics.current.soldUnitCount),
    },
  ]

  const salesChartData = createChartData(
    analytics.currentTrend.map((point) => ({ date: point.date, value: point.salesInKurus })),
    analytics.previousTrend.map((point) => point.salesInKurus),
  )
  const orderChartData = createChartData(
    analytics.currentTrend.map((point) => ({ date: point.date, value: point.orderCount })),
  )
  const averageChartData = createChartData(
    analytics.currentTrend.map((point) => ({
      date: point.date,
      value: point.averageOrderAmountInKurus ?? 0,
    })),
  )

  return (
    <div className="analytics-page">
      <header className="analytics-page__header">
        <div>
          <h1 id="page-title">Analizler</h1>
          <p>Dönemsel satış, sipariş ve ürün performansını değerlendirin.</p>
        </div>

        <div className="analytics-period-control">
          <label htmlFor="analytics-period">Tarih aralığı</label>
          <select
            id="analytics-period"
            onChange={(event) => handlePeriodChange(event.target.value as AnalyticsPeriod)}
            value={period}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {period === 'ozel' ? (
        <fieldset className="analytics-custom-range">
          <legend>Özel tarih aralığı</legend>
          <label>
            Başlangıç
            <input
              max={endDate}
              onChange={(event) => handleCustomDateChange('baslangic', event.target.value)}
              type="date"
              value={startDate}
            />
          </label>
          <label>
            Bitiş
            <input
              min={startDate}
              onChange={(event) => handleCustomDateChange('bitis', event.target.value)}
              type="date"
              value={endDate}
            />
          </label>
        </fieldset>
      ) : null}

      <p className="analytics-page__range-summary">Gösterilen dönem: {periodLabel}</p>

      <section aria-label="Analiz özeti" className="analytics-kpis">
        {kpis.map((kpi) => (
          <article className="analytics-kpi" key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <p>{kpi.comparison}</p>
          </article>
        ))}
      </section>

      <AnalyticsLineChart
        ariaLabel={`${periodLabel} satış trendi`}
        chartId="sales-trend"
        data={salesChartData}
        description="Seçili dönem ve önceki eşdeğer dönem karşılaştırması"
        key={`sales-${startDate}-${endDate}`}
        title="Satış Trendi"
        valueFormatter={formatCurrency}
      />

      <div className="analytics-grid analytics-grid--trends">
        <AnalyticsLineChart
          ariaLabel={`${periodLabel} sipariş trendi`}
          chartId="orders-trend"
          data={orderChartData}
          description="İptal hariç geçerli siparişler"
          key={`orders-${startDate}-${endDate}`}
          title="Sipariş Trendi"
          valueFormatter={(value) => `${integerFormatter.format(value)} sipariş`}
        />
        <AnalyticsLineChart
          ariaLabel={`${periodLabel} ortalama sipariş tutarı trendi`}
          chartId="average-order-trend"
          data={averageChartData}
          description="Yalnız tamamlanmış siparişler"
          key={`average-${startDate}-${endDate}`}
          title="Ortalama Sipariş Tutarı"
          valueFormatter={formatCurrency}
        />
      </div>

      <div className="analytics-grid analytics-grid--performance">
        <section aria-labelledby="top-products-title" className="analytics-panel">
          <header className="analytics-panel__header">
            <div>
              <h2 id="top-products-title">En Çok Satan 5 Ürün</h2>
              <p>Satılan ürün adedine göre sıralanır</p>
            </div>
          </header>
          <ol className="analytics-products">
            {analytics.topProducts.map((product) => (
              <li key={product.name}>
                <strong>{product.name}</strong>
                <span>{integerFormatter.format(product.soldUnitCount)} adet</span>
                <span>{formatCurrency(product.revenueInKurus)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="category-performance-title" className="analytics-panel">
          <header className="analytics-panel__header">
            <div>
              <h2 id="category-performance-title">Kategori Performansı</h2>
              <p>Satış tutarı ve toplam satış içindeki pay</p>
            </div>
          </header>
          <ul className="analytics-categories">
            {analytics.categories.map((category) => (
              <li key={category.name}>
                <div>
                  <strong>{category.name}</strong>
                  <span>
                    {formatCurrency(category.revenueInKurus)} · %
                    {percentageFormatter.format(category.share)}
                  </span>
                </div>
                <div
                  aria-label={`${category.name} payı yüzde ${percentageFormatter.format(category.share)}`}
                  className="analytics-category-bar"
                  role="img"
                >
                  <span style={{ width: `${category.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default AnalyticsPage
