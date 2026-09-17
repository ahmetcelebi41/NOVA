import { useMemo, useState, type KeyboardEvent } from 'react'

type Period = 7 | 30 | 90

type SalesPoint = {
  date: Date
  orders: number
  sales: number
}

const chartWidth = 720
const chartHeight = 300
const chartPaddingX = 32
const chartPaddingTop = 96
const chartPaddingBottom = 28
const periods: Period[] = [7, 30, 90]

const numberFormatter = new Intl.NumberFormat('tr-TR')
const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const periodComparisons: Record<Period, string> = {
  7: 'Önceki 7 güne göre %12,4 artış',
  30: 'Önceki 30 güne göre %8,7 artış',
  90: 'Önceki 90 güne göre %6,2 artış',
}

function formatCurrency(value: number) {
  return `${numberFormatter.format(value)} TL`
}

function createSalesData(days: Period): SalesPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(2026, 8, 17)
    date.setDate(date.getDate() - (days - index - 1))
    const weeklyLift = date.getDay() === 0 || date.getDay() === 6 ? 1300 : 0
    const sales = Math.round(
      10800 +
        Math.sin(index * 0.55) * 2100 +
        Math.cos(index * 0.18) * 1200 +
        (index / days) * 1600 +
        weeklyLift,
    )

    return {
      date,
      orders: Math.max(6, Math.round(sales / 760) + (index % 3)),
      sales,
    }
  })
}

function SalesChart() {
  const [period, setPeriod] = useState<Period>(7)
  const data = useMemo(() => createSalesData(period), [period])
  const [activeIndex, setActiveIndex] = useState(6)
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const safeActiveIndex = Math.min(activeIndex, data.length - 1)
  const activePoint = data[safeActiveIndex]
  const salesValues = data.map((point) => point.sales)
  const minimumSales = Math.min(...salesValues)
  const maximumSales = Math.max(...salesValues)
  const salesRange = maximumSales - minimumSales || 1

  const coordinates = data.map((point, index) => {
    const availableWidth = chartWidth - chartPaddingX * 2
    const availableHeight = chartHeight - chartPaddingTop - chartPaddingBottom

    return {
      x: chartPaddingX + (index / (data.length - 1)) * availableWidth,
      y:
        chartPaddingTop +
        (1 - (point.sales - minimumSales) / salesRange) * availableHeight,
    }
  })

  const activeCoordinate = coordinates[safeActiveIndex]
  const activeEdge =
    safeActiveIndex === 0
      ? 'start'
      : safeActiveIndex === data.length - 1
        ? 'end'
        : 'middle'

  const handlePeriodChange = (nextPeriod: Period) => {
    setPeriod(nextPeriod)
    setActiveIndex(nextPeriod - 1)
  }

  const handleChartKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(0, Math.min(current, data.length - 1) - 1))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(data.length - 1, current + 1))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(data.length - 1)
    }
  }

  return (
    <section className="overview-section overview-chart" aria-labelledby="sales-chart-title">
      <div className="overview-section__header overview-chart__header">
        <div>
          <h2 id="sales-chart-title">Satış Performansı</h2>
          <p>{periodComparisons[period]}</p>
        </div>

        <div aria-label="Satış performansı zaman aralığı" className="overview-periods" role="group">
          {periods.map((option) => (
            <button
              aria-pressed={period === option}
              key={option}
              onClick={() => handlePeriodChange(option)}
              type="button"
            >
              {option} Gün
            </button>
          ))}
        </div>
      </div>

      <div
        aria-describedby="sales-chart-help sales-chart-active"
        aria-label={`Son ${period} gün satış grafiği`}
        className="overview-chart__canvas"
        onBlur={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onKeyDown={handleChartKeyDown}
        onMouseLeave={() => setIsTooltipVisible(false)}
        role="group"
        tabIndex={0}
      >
        <p className="overview-chart__help" id="sales-chart-help">
          Günler arasında gezinmek için sol ve sağ ok tuşlarını kullanın.
        </p>
        <p aria-live="polite" className="overview-chart__help" id="sales-chart-active">
          {dateFormatter.format(activePoint.date)}, {formatCurrency(activePoint.sales)} satış,{' '}
          {activePoint.orders} sipariş
        </p>

        <svg
          aria-hidden="true"
          className="overview-chart__svg"
          focusable="false"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {[0, 1, 2].map((line) => {
            const y = chartPaddingTop + (line / 2) * (chartHeight - chartPaddingTop - chartPaddingBottom)

            return (
              <line
                className="overview-chart__grid-line"
                key={line}
                x1={chartPaddingX}
                x2={chartWidth - chartPaddingX}
                y1={y}
                y2={y}
              />
            )
          })}

          <polyline
            className="overview-chart__line"
            points={coordinates.map(({ x, y }) => `${x},${y}`).join(' ')}
          />

          {coordinates.map(({ x, y }, index) => (
            <g key={data[index].date.toISOString()}>
              <circle
                className="overview-chart__hit-area"
                cx={x}
                cy={y}
                onMouseEnter={() => {
                  setActiveIndex(index)
                  setIsTooltipVisible(true)
                }}
                r="10"
              />
              <circle
                className="overview-chart__point"
                cx={x}
                cy={y}
                data-active={index === safeActiveIndex}
                r={index === safeActiveIndex ? 5 : 3}
              />
            </g>
          ))}
        </svg>

        {isTooltipVisible ? (
          <div
            aria-hidden="true"
            className="overview-chart__tooltip"
            data-edge={activeEdge}
            style={{
              left: `${(activeCoordinate.x / chartWidth) * 100}%`,
              top: `${(activeCoordinate.y / chartHeight) * 100}%`,
            }}
          >
            <strong>{dateFormatter.format(activePoint.date)}</strong>
            <span>{formatCurrency(activePoint.sales)} satış</span>
            <span>{activePoint.orders} sipariş</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default SalesChart
