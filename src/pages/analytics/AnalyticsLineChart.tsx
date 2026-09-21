import { useState, type KeyboardEvent } from 'react'

export type AnalyticsChartPoint = {
  current: number
  date: string
  previous?: number
}

type AnalyticsLineChartProps = {
  ariaLabel: string
  chartId: string
  data: AnalyticsChartPoint[]
  description: string
  title: string
  valueFormatter: (value: number) => string
}

const chartWidth = 720
const chartHeight = 260
const chartPaddingX = 28
const chartPaddingTop = 28
const chartPaddingBottom = 28

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`))
}

function AnalyticsLineChart({
  ariaLabel,
  chartId,
  data,
  description,
  title,
  valueFormatter,
}: AnalyticsLineChartProps) {
  const [activeIndex, setActiveIndex] = useState(data.length - 1)
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, data.length - 1))
  const activePoint = data[safeActiveIndex]
  const allValues = data.flatMap((point) =>
    point.previous === undefined ? [point.current] : [point.current, point.previous],
  )
  const minimumValue = Math.min(...allValues)
  const maximumValue = Math.max(...allValues)
  const valueRange = maximumValue - minimumValue || 1
  const availableWidth = chartWidth - chartPaddingX * 2
  const availableHeight = chartHeight - chartPaddingTop - chartPaddingBottom
  const denominator = Math.max(1, data.length - 1)
  const getX = (index: number) => chartPaddingX + (index / denominator) * availableWidth
  const getY = (value: number) =>
    chartPaddingTop + (1 - (value - minimumValue) / valueRange) * availableHeight
  const currentCoordinates = data.map((point, index) => ({
    x: getX(index),
    y: getY(point.current),
  }))
  const previousCoordinates = data.every((point) => point.previous !== undefined)
    ? data.map((point, index) => ({
        x: getX(index),
        y: getY(point.previous ?? 0),
      }))
    : null
  const activeCoordinate = currentCoordinates[safeActiveIndex]
  const activeEdge =
    safeActiveIndex === 0
      ? 'start'
      : safeActiveIndex === data.length - 1
        ? 'end'
        : 'middle'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
    <section aria-labelledby={`${chartId}-title`} className="analytics-panel analytics-chart">
      <header className="analytics-panel__header">
        <div>
          <h2 id={`${chartId}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
        {previousCoordinates ? (
          <div aria-label="Grafik serileri" className="analytics-chart__legend">
            <span>Seçili dönem</span>
            <span>Önceki dönem</span>
          </div>
        ) : null}
      </header>

      <div
        aria-describedby={`${chartId}-help ${chartId}-active`}
        aria-label={ariaLabel}
        className="analytics-chart__canvas"
        onBlur={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setIsTooltipVisible(false)}
        role="group"
        tabIndex={0}
      >
        <p className="analytics-visually-hidden" id={`${chartId}-help`}>
          Veri noktaları arasında gezinmek için sol ve sağ ok tuşlarını, ilk ve son nokta için
          Home ve End tuşlarını kullanın.
        </p>
        <p aria-live="polite" className="analytics-visually-hidden" id={`${chartId}-active`}>
          {formatDate(activePoint.date)}, seçili dönem {valueFormatter(activePoint.current)}
          {activePoint.previous === undefined
            ? ''
            : `, önceki dönem ${valueFormatter(activePoint.previous)}`}
        </p>

        <svg
          aria-hidden="true"
          className="analytics-chart__svg"
          focusable="false"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {[0, 1, 2].map((line) => {
            const y = chartPaddingTop + (line / 2) * availableHeight

            return (
              <line
                className="analytics-chart__grid-line"
                key={line}
                x1={chartPaddingX}
                x2={chartWidth - chartPaddingX}
                y1={y}
                y2={y}
              />
            )
          })}

          {previousCoordinates ? (
            <polyline
              className="analytics-chart__line analytics-chart__line--previous"
              points={previousCoordinates.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
          ) : null}
          <polyline
            className="analytics-chart__line"
            points={currentCoordinates.map(({ x, y }) => `${x},${y}`).join(' ')}
          />

          {currentCoordinates.map(({ x, y }, index) => (
            <g key={data[index].date}>
              <circle
                className="analytics-chart__hit-area"
                cx={x}
                cy={y}
                onMouseEnter={() => {
                  setActiveIndex(index)
                  setIsTooltipVisible(true)
                }}
                r="10"
              />
              <circle
                className="analytics-chart__point"
                cx={x}
                cy={y}
                data-active={index === safeActiveIndex}
                r={index === safeActiveIndex ? 5 : 3}
              />
            </g>
          ))}
        </svg>

        <div className="analytics-chart__axis" aria-hidden="true">
          <span>{formatDate(data[0].date)}</span>
          <span>{formatDate(data[data.length - 1].date)}</span>
        </div>

        {isTooltipVisible ? (
          <div
            aria-hidden="true"
            className="analytics-chart__tooltip"
            data-edge={activeEdge}
            style={{
              left: `${(activeCoordinate.x / chartWidth) * 100}%`,
              top: `${(activeCoordinate.y / chartHeight) * 100}%`,
            }}
          >
            <strong>{formatDate(activePoint.date)}</strong>
            <span>Seçili dönem: {valueFormatter(activePoint.current)}</span>
            {activePoint.previous === undefined ? null : (
              <span>Önceki dönem: {valueFormatter(activePoint.previous)}</span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default AnalyticsLineChart
