import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import './OrderDetailPage.css'
import {
  orderDemoData,
  type OrderDemoRecord,
  type OrderHistoryEntry,
  type OrderStatus,
} from './orders/orderDemoData'

const currencyFormatter = new Intl.NumberFormat('tr-TR')

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Istanbul',
})

const nextStatusByStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  Hazırlanıyor: 'Teslimata Hazır',
  Yeni: 'Hazırlanıyor',
  'Teslimata Hazır': 'Tamamlandı',
}

const actionLabelByStatus: Partial<Record<OrderStatus, string>> = {
  Hazırlanıyor: 'Teslimata Hazır Olarak İşaretle',
  Yeni: 'Hazırlamaya Başla',
  'Teslimata Hazır': 'Tamamlandı Olarak İşaretle',
}

function formatCurrency(value: number) {
  return `${currencyFormatter.format(value)} TL`
}

function OrderDetailContent({ listPath, order }: { listPath: string; order: OrderDemoRecord }) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status)
  const [history, setHistory] = useState<OrderHistoryEntry[]>(order.history)
  const nextStatus = nextStatusByStatus[currentStatus]
  const actionLabel = actionLabelByStatus[currentStatus]

  const advanceStatus = () => {
    if (!nextStatus) {
      return
    }

    const previousDate = history.at(-1)?.date ?? order.date
    setCurrentStatus(nextStatus)
    setHistory((currentHistory) => [
      ...currentHistory,
      {
        date: new Date(Date.parse(previousDate) + 60 * 60 * 1000).toISOString(),
        status: nextStatus,
      },
    ])
  }

  return (
    <article className="order-detail-page">
      <Link className="order-detail-page__back" to={listPath}>
        Siparişlere geri dön
      </Link>

      <header className="order-detail-page__header">
        <div>
          <h1 id="page-title">Sipariş {order.number}</h1>
          <p>Sipariş detayları</p>
        </div>
        <span
          aria-label={`Sipariş durumu: ${currentStatus}`}
          aria-live="polite"
          className="order-detail-page__status"
        >
          {currentStatus}
        </span>
      </header>

      <div className="order-detail-page__columns">
        <div className="order-detail-page__main-column">
          <section aria-labelledby="order-summary-title" className="order-detail-section">
            <h2 id="order-summary-title">Sipariş Özeti</h2>
            <dl className="order-detail-summary">
              <div>
                <dt>Sipariş No</dt>
                <dd>{order.number}</dd>
              </div>
              <div>
                <dt>Sipariş Tarihi</dt>
                <dd>
                  <time dateTime={order.date}>{dateFormatter.format(new Date(order.date))}</time>
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="order-products-title" className="order-detail-section">
            <h2 id="order-products-title">Ürünler</h2>
            <ul className="order-detail-products">
              {order.items.map((item) => (
                <li key={item.id}>
                  <dl>
                    <div>
                      <dt>Ürün</dt>
                      <dd>{item.product}</dd>
                    </div>
                    <div>
                      <dt>Birim Fiyat</dt>
                      <dd>{formatCurrency(item.unitPrice)}</dd>
                    </div>
                    <div>
                      <dt>Adet</dt>
                      <dd>{item.quantity}</dd>
                    </div>
                    <div>
                      <dt>Toplam</dt>
                      <dd>{formatCurrency(item.total)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="order-detail-page__side-column">
          <section aria-labelledby="customer-delivery-title" className="order-detail-section">
            <h2 id="customer-delivery-title">Müşteri / Teslimat</h2>
            <div className="order-detail-contact">
              <div>
                <h3>Müşteri</h3>
                <dl>
                  <div>
                    <dt>Ad Soyad</dt>
                    <dd>{order.customer}</dd>
                  </div>
                  <div>
                    <dt>Telefon</dt>
                    <dd>{order.phone}</dd>
                  </div>
                  <div>
                    <dt>E-posta</dt>
                    <dd>{order.email}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3>Teslimat</h3>
                <dl>
                  <div>
                    <dt>Yöntem</dt>
                    <dd>{order.delivery.method}</dd>
                  </div>
                  {order.delivery.address ? (
                    <div>
                      <dt>Adres</dt>
                      <dd>{order.delivery.address}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>
          </section>

          <section aria-labelledby="order-amount-title" className="order-detail-section">
            <h2 id="order-amount-title">Tutar</h2>
            <dl className="order-detail-amounts">
              <div>
                <dt>Ara Toplam</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Teslimat</dt>
                <dd>{formatCurrency(order.deliveryFee)}</dd>
              </div>
              <div className="order-detail-amounts__total">
                <dt>Genel Toplam</dt>
                <dd>{formatCurrency(order.amount)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <section aria-labelledby="order-history-title" className="order-detail-section">
        <h2 id="order-history-title">Durum Geçmişi</h2>
        <ol className="order-detail-history">
          {history.map((entry) => (
            <li key={`${entry.status}-${entry.date}`}>
              <strong>{entry.status}</strong>
              <time dateTime={entry.date}>{dateFormatter.format(new Date(entry.date))}</time>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="order-actions-title" className="order-detail-section">
        <h2 id="order-actions-title">Aksiyonlar</h2>
        {nextStatus && actionLabel ? (
          <>
            <button
              className="order-detail-page__primary-action"
              onClick={advanceStatus}
              type="button"
            >
              {actionLabel}
            </button>
            <p className="order-detail-page__demo-note">
              Durum değişikliği yalnızca bu demo görünümünde geçerlidir.
            </p>
          </>
        ) : (
          <p className="order-detail-page__terminal-status">
            Bu sipariş için kullanılabilir durum aksiyonu bulunmuyor.
          </p>
        )}
      </section>
    </article>
  )
}

function OrderDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preservedQuery = searchParams.toString()
  const listPath = `/siparisler${preservedQuery ? `?${preservedQuery}` : ''}`
  const order = orderDemoData.find((item) => item.id === id)

  if (!order) {
    return (
      <section className="order-detail-not-found" aria-labelledby="page-title">
        <h1 id="page-title">Sipariş bulunamadı</h1>
        <p>Aradığınız sipariş kaydı bulunamadı.</p>
        <Link to={listPath}>Siparişlere geri dön</Link>
      </section>
    )
  }

  return <OrderDetailContent key={order.id} listPath={listPath} order={order} />
}

export default OrderDetailPage
