import { useState, type KeyboardEvent } from 'react'
import type { OverviewSalesPeriod } from '../../contracts/overview'

type Period = 7 | 30 | 90

const chartWidth = 720
const chartHeight = 300
const chartPaddingX = 32
const chartPaddingTop = 96
const chartPaddingBottom = 28
const periods: Period[] = [7, 30, 90]
const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', style: 'currency' })
const percentageFormatter = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', timeZone: 'UTC', year: 'numeric' })

function formatCurrency(valueMinor: number) { return currencyFormatter.format(valueMinor / 100) }
function formatDate(value: string) { return dateFormatter.format(new Date(`${value}T00:00:00Z`)) }
function comparisonLabel(current: number, previous: number, days: number) {
  if (previous === 0) return `Önceki ${days} günde karşılaştırılabilir veri yok`
  const change = ((current - previous) / previous) * 100
  if (change === 0) return `Önceki ${days} güne göre değişim yok`
  return `Önceki ${days} güne göre %${percentageFormatter.format(Math.abs(change))} ${change > 0 ? 'artış' : 'azalış'}`
}

function SalesChart({ salesPeriods }: { salesPeriods: OverviewSalesPeriod[] }) {
  const [period, setPeriod] = useState<Period>(7)
  const selected = salesPeriods.find((item) => item.days === period) ?? salesPeriods[0]
  const data = selected.points
  const [activeIndex, setActiveIndex] = useState(6)
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const safeActiveIndex = Math.min(activeIndex, data.length - 1)
  const activePoint = data[safeActiveIndex]
  const salesValues = data.map((point) => point.salesMinor)
  const minimumSales = Math.min(...salesValues)
  const maximumSales = Math.max(...salesValues)
  const salesRange = maximumSales - minimumSales || 1
  const coordinates = data.map((point, index) => ({
    x: chartPaddingX + (index / Math.max(1, data.length - 1)) * (chartWidth - chartPaddingX * 2),
    y: chartPaddingTop + (1 - (point.salesMinor - minimumSales) / salesRange) * (chartHeight - chartPaddingTop - chartPaddingBottom),
  }))
  const activeCoordinate = coordinates[safeActiveIndex]
  const activeEdge = safeActiveIndex === 0 ? 'start' : safeActiveIndex === data.length - 1 ? 'end' : 'middle'

  const handlePeriodChange = (nextPeriod: Period) => {
    setPeriod(nextPeriod)
    const next = salesPeriods.find((item) => item.days === nextPeriod)
    setActiveIndex(Math.max(0, (next?.points.length ?? 1) - 1))
  }
  const handleChartKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); setActiveIndex((current) => Math.max(0, Math.min(current, data.length - 1) - 1)) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); setActiveIndex((current) => Math.min(data.length - 1, current + 1)) }
    else if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0) }
    else if (event.key === 'End') { event.preventDefault(); setActiveIndex(data.length - 1) }
  }

  return <section className="overview-section overview-chart" aria-labelledby="sales-chart-title">
    <div className="overview-section__header overview-chart__header"><div><h2 id="sales-chart-title">Satış Performansı</h2><p>{comparisonLabel(selected.currentSalesMinor, selected.previousSalesMinor, period)}</p></div><div aria-label="Satış performansı zaman aralığı" className="overview-periods" role="group">{periods.map((option) => <button aria-pressed={period === option} key={option} onClick={() => handlePeriodChange(option)} type="button">{option} Gün</button>)}</div></div>
    <div aria-describedby="sales-chart-help sales-chart-active" aria-label={`Son ${period} gün satış grafiği`} className="overview-chart__canvas" onBlur={() => setIsTooltipVisible(false)} onFocus={() => setIsTooltipVisible(true)} onKeyDown={handleChartKeyDown} onMouseLeave={() => setIsTooltipVisible(false)} role="group" tabIndex={0}>
      <p className="overview-chart__help" id="sales-chart-help">Günler arasında gezinmek için sol ve sağ ok tuşlarını kullanın.</p><p aria-live="polite" className="overview-chart__help" id="sales-chart-active">{formatDate(activePoint.date)}, {formatCurrency(activePoint.salesMinor)} satış, {activePoint.orderCount} sipariş</p>
      <svg aria-hidden="true" className="overview-chart__svg" focusable="false" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {[0, 1, 2].map((line) => { const y = chartPaddingTop + (line / 2) * (chartHeight - chartPaddingTop - chartPaddingBottom); return <line className="overview-chart__grid-line" key={line} x1={chartPaddingX} x2={chartWidth - chartPaddingX} y1={y} y2={y} /> })}
        <polyline className="overview-chart__line" points={coordinates.map(({ x, y }) => `${x},${y}`).join(' ')} />
        {coordinates.map(({ x, y }, index) => <g key={data[index].date}><circle className="overview-chart__hit-area" cx={x} cy={y} onMouseEnter={() => { setActiveIndex(index); setIsTooltipVisible(true) }} r="10" /><circle className="overview-chart__point" cx={x} cy={y} data-active={index === safeActiveIndex} r={index === safeActiveIndex ? 5 : 3} /></g>)}
      </svg>
      {isTooltipVisible ? <div aria-hidden="true" className="overview-chart__tooltip" data-edge={activeEdge} style={{ left: `${(activeCoordinate.x / chartWidth) * 100}%`, top: `${(activeCoordinate.y / chartHeight) * 100}%` }}><strong>{formatDate(activePoint.date)}</strong><span>{formatCurrency(activePoint.salesMinor)} satış</span><span>{activePoint.orderCount} sipariş</span></div> : null}
    </div>
  </section>
}

export default SalesChart
