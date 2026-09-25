import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { OrderDetailResponse, OrderStatus, UpdateOrderStatusInput } from '../contracts/orders'
import { ApiError, apiJson } from '../lib/api'
import './OrderDetailPage.css'

const orderStatusLabels: Record<OrderStatus, string> = {
  cancelled: 'İptal', completed: 'Tamamlandı', new: 'Yeni', preparing: 'Hazırlanıyor', ready_for_delivery: 'Teslimata Hazır',
}
const nextActionByStatus: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  new: { label: 'Hazırlamaya Başla', status: 'preparing' },
  preparing: { label: 'Teslimata Hazır Olarak İşaretle', status: 'ready_for_delivery' },
  ready_for_delivery: { label: 'Tamamlandı Olarak İşaretle', status: 'completed' },
}
const statusErrorMessages: Record<string, string> = {
  INVALID_ORDER_TRANSITION: 'Sipariş durumu bu adıma geçirilemiyor. Güncel bilgiler yeniden yüklendi.',
  STOCK_CONFLICT: 'Stok aynı anda değiştiği için işlem tamamlanamadı. Güncel bilgiler yeniden yüklendi.',
}
const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', style: 'currency' })
const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeZone: 'Europe/Istanbul' })

function formatCurrency(valueMinor: number) { return currencyFormatter.format(valueMinor / 100) }

function OrderDetailContent({ data, listPath, onRefresh }: { data: OrderDetailResponse; listPath: string; onRefresh: () => Promise<void> }) {
  const { order, customer, delivery, totals, items, statusHistory } = data
  const [mutationStatus, setMutationStatus] = useState<OrderStatus | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [confirmingCancellation, setConfirmingCancellation] = useState(false)
  const nextAction = nextActionByStatus[order.status]
  const canCancel = order.status !== 'completed' && order.status !== 'cancelled'

  const updateStatus = async (status: OrderStatus) => {
    setMutationStatus(status)
    setFeedback(null)
    try {
      const body: UpdateOrderStatusInput = { status }
      await apiJson<OrderDetailResponse>(`/api/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify(body) })
      setConfirmingCancellation(false)
      await onRefresh()
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        await onRefresh()
        setFeedback(statusErrorMessages[caught.code ?? ''] ?? 'Sipariş durumu değiştirilemedi. Güncel bilgiler yeniden yüklendi.')
      } else {
        setFeedback('Durum değişikliği kaydedilemedi. Lütfen yeniden deneyin.')
      }
    } finally {
      setMutationStatus(null)
    }
  }

  const deliveryDate = delivery.date ? dateFormatter.format(new Date(`${delivery.date}T00:00:00`)) : '—'
  const deliveryTime = delivery.startTime && delivery.endTime ? `${delivery.startTime}–${delivery.endTime}` : '—'

  return <article className="order-detail-page">
    <Link className="order-detail-page__back" to={listPath}>Siparişlere geri dön</Link>
    <header className="order-detail-page__header"><div><h1 id="page-title">Sipariş {order.orderNumber}</h1><p>Sipariş detayları</p></div><span aria-label={`Sipariş durumu: ${orderStatusLabels[order.status]}`} aria-live="polite" className="order-detail-page__status">{orderStatusLabels[order.status]}</span></header>
    <div className="order-detail-page__columns">
      <div className="order-detail-page__main-column">
        <section aria-labelledby="order-summary-title" className="order-detail-section"><h2 id="order-summary-title">Sipariş Özeti</h2><dl className="order-detail-summary"><div><dt>Sipariş No</dt><dd>{order.orderNumber}</dd></div><div><dt>Sipariş Tarihi</dt><dd><time dateTime={order.createdAt}>{dateTimeFormatter.format(new Date(order.createdAt))}</time></dd></div>{order.notes ? <div><dt>Not</dt><dd>{order.notes}</dd></div> : null}</dl></section>
        <section aria-labelledby="order-products-title" className="order-detail-section"><h2 id="order-products-title">Ürünler</h2><ul className="order-detail-products">{items.map((item) => <li key={item.id}><dl><div><dt>Ürün</dt><dd>{item.name}{item.sku ? ` · ${item.sku}` : ''}<br /><small>{item.category}</small></dd></div><div><dt>Birim Fiyat</dt><dd>{formatCurrency(item.unitPriceMinor)}</dd></div><div><dt>Adet</dt><dd>{item.quantity}</dd></div><div><dt>Toplam</dt><dd>{formatCurrency(item.lineTotalMinor)}</dd></div></dl></li>)}</ul></section>
      </div>
      <div className="order-detail-page__side-column">
        <section aria-labelledby="customer-delivery-title" className="order-detail-section"><h2 id="customer-delivery-title">Müşteri / Teslimat</h2><div className="order-detail-contact"><div><h3>Müşteri</h3><dl><div><dt>Ad Soyad</dt><dd>{customer.name}</dd></div><div><dt>Telefon</dt><dd>{customer.phone}</dd></div><div><dt>E-posta</dt><dd>{customer.email ?? '—'}</dd></div></dl></div><div><h3>Teslimat</h3><dl><div><dt>Yöntem</dt><dd>{delivery.method === 'delivery' ? 'Teslimat' : 'Mağazadan Teslim Alma'}</dd></div>{delivery.address ? <div><dt>Adres</dt><dd>{delivery.address}</dd></div> : null}<div><dt>Tarih</dt><dd>{deliveryDate}</dd></div><div><dt>Saat</dt><dd>{deliveryTime}</dd></div></dl></div></div></section>
        <section aria-labelledby="order-amount-title" className="order-detail-section"><h2 id="order-amount-title">Tutar</h2><dl className="order-detail-amounts"><div><dt>Ara Toplam</dt><dd>{formatCurrency(totals.subtotalMinor)}</dd></div><div><dt>Teslimat</dt><dd>{formatCurrency(totals.deliveryFeeMinor)}</dd></div><div className="order-detail-amounts__total"><dt>Genel Toplam</dt><dd>{formatCurrency(totals.totalMinor)}</dd></div></dl></section>
      </div>
    </div>
    <section aria-labelledby="order-history-title" className="order-detail-section"><h2 id="order-history-title">Durum Geçmişi</h2><ol className="order-detail-history">{statusHistory.map((entry) => <li key={entry.id}><strong>{orderStatusLabels[entry.status]}</strong><time dateTime={entry.createdAt}>{dateTimeFormatter.format(new Date(entry.createdAt))}</time></li>)}</ol></section>
    <section aria-labelledby="order-actions-title" className="order-detail-section"><h2 id="order-actions-title">Aksiyonlar</h2>{nextAction || canCancel ? <div className="order-detail-page__actions">{nextAction ? <button className="order-detail-page__primary-action" disabled={mutationStatus !== null || confirmingCancellation} onClick={() => void updateStatus(nextAction.status)} type="button">{mutationStatus === nextAction.status ? 'Kaydediliyor…' : nextAction.label}</button> : null}{canCancel && !confirmingCancellation ? <button className="order-detail-page__cancel-action" disabled={mutationStatus !== null} onClick={() => setConfirmingCancellation(true)} type="button">Siparişi İptal Et</button> : null}{canCancel && confirmingCancellation ? <><button className="order-detail-page__cancel-action" disabled={mutationStatus !== null} onClick={() => void updateStatus('cancelled')} type="button">{mutationStatus === 'cancelled' ? 'İptal ediliyor…' : 'İptali Onayla'}</button><button className="order-detail-page__secondary-action" disabled={mutationStatus !== null} onClick={() => setConfirmingCancellation(false)} type="button">Vazgeç</button></> : null}</div> : <p className="order-detail-page__terminal-status">Bu sipariş için kullanılabilir durum aksiyonu bulunmuyor.</p>}{canCancel && confirmingCancellation ? <p className="order-detail-page__feedback">Bu işlem siparişi iptal edecek ve ayrılan stoğu geri ekleyecek.</p> : null}{feedback ? <p className="order-detail-page__feedback" role="alert">{feedback}</p> : null}</section>
  </article>
}

function OrderDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${id ?? ''}:${reloadKey}`
  const [loadState, setLoadState] = useState<{ key: string; data: OrderDetailResponse | null; error: 'not-found' | 'request' | null }>({ key: '', data: null, error: null })
  const isLoading = loadState.key !== requestKey
  const data = isLoading ? null : loadState.data
  const error = isLoading ? null : loadState.error
  const query = searchParams.toString()
  const listPath = `/siparisler${query ? `?${query}` : ''}`

  useEffect(() => {
    const controller = new AbortController()
    apiJson<OrderDetailResponse>(`/api/orders/${id ?? ''}`, { signal: controller.signal })
      .then((response) => setLoadState({ key: requestKey, data: response, error: null }))
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setLoadState({ key: requestKey, data: null, error: caught instanceof ApiError && caught.status === 404 ? 'not-found' : 'request' })
      })
    return () => controller.abort()
  }, [id, requestKey])

  const refreshData = async () => {
    try {
      const response = await apiJson<OrderDetailResponse>(`/api/orders/${id ?? ''}`)
      setLoadState({ key: requestKey, data: response, error: null })
    } catch (caught) {
      setLoadState({
        key: requestKey,
        data: null,
        error: caught instanceof ApiError && caught.status === 404 ? 'not-found' : 'request',
      })
    }
  }

  if (isLoading) return <section className="order-detail-not-found" aria-labelledby="page-title"><h1 id="page-title">Sipariş yükleniyor</h1><p>Lütfen bekleyin.</p></section>
  if (error) return <section className="order-detail-not-found" aria-labelledby="page-title"><h1 id="page-title">{error === 'not-found' ? 'Sipariş bulunamadı' : 'Sipariş yüklenemedi'}</h1><p>{error === 'not-found' ? 'Aradığınız sipariş kaydı bulunamadı.' : 'Bağlantıyı kontrol edip yeniden deneyin.'}</p>{error === 'request' ? <button onClick={() => setReloadKey((key) => key + 1)} type="button">Yeniden Dene</button> : null}<Link to={listPath}>Siparişlere geri dön</Link></section>
  return data ? <OrderDetailContent data={data} listPath={listPath} onRefresh={refreshData} /> : null
}

export default OrderDetailPage
