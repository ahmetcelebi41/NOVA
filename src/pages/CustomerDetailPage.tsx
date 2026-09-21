import { Link, useParams, useSearchParams } from 'react-router-dom'
import './CustomerDetailPage.css'
import {
  customerDemoData,
  type CustomerDemoRecord,
  type CustomerOrderSummary,
} from './customers/customerDemoData'

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  currency: 'TRY',
  style: 'currency',
})

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

function formatCurrency(valueInKurus: number) {
  return currencyFormatter.format(valueInKurus / 100)
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

function CustomerOrdersTable({ orders }: { orders: CustomerOrderSummary[] }) {
  return (
    <table className="customer-orders-table">
      <thead>
        <tr>
          <th scope="col">Sipariş No</th>
          <th scope="col">Tarih</th>
          <th scope="col">Ürün</th>
          <th className="customer-orders-table__number" scope="col">
            Tutar
          </th>
          <th scope="col">Durum</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>
              <Link to={`/siparisler/${order.id}`}>{order.number}</Link>
            </td>
            <td>
              <time dateTime={order.date}>{formatDate(order.date)}</time>
            </td>
            <td>{order.product}</td>
            <td className="customer-orders-table__number">
              {formatCurrency(order.amountInKurus)}
            </td>
            <td>
              <span className="customer-order-status">{order.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CustomerOrderCards({ orders }: { orders: CustomerOrderSummary[] }) {
  return (
    <ul className="customer-order-cards">
      {orders.map((order) => (
        <li key={order.id}>
          <article className="customer-order-card">
            <header>
              <Link to={`/siparisler/${order.id}`}>{order.number}</Link>
              <span className="customer-order-status">{order.status}</span>
            </header>
            <dl>
              <div>
                <dt>Tarih</dt>
                <dd>
                  <time dateTime={order.date}>{formatDate(order.date)}</time>
                </dd>
              </div>
              <div>
                <dt>Ürün</dt>
                <dd>{order.product}</dd>
              </div>
              <div>
                <dt>Tutar</dt>
                <dd>{formatCurrency(order.amountInKurus)}</dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  )
}

function CustomerDetailContent({
  customer,
  listPath,
}: {
  customer: CustomerDemoRecord
  listPath: string
}) {
  const averageOrderAmount = customer.completedOrderCount
    ? customer.totalSpentInKurus / customer.completedOrderCount
    : null
  const recentOrders = customer.recentOrders.slice(0, 10)

  return (
    <article className="customer-detail-page">
      <Link className="customer-detail-page__back" to={listPath}>
        Müşterilere geri dön
      </Link>

      <header className="customer-detail-page__header">
        <div>
          <h1 id="page-title">{customer.name}</h1>
          <p>Müşteri Detayı</p>
        </div>
        <span aria-label={`Müşteri durumu: ${customer.status}`}>{customer.status}</span>
      </header>

      <section aria-labelledby="customer-summary-title" className="customer-detail-section">
        <h2 id="customer-summary-title">Müşteri Özeti</h2>
        <dl className="customer-metrics">
          <div>
            <dt>Geçerli Sipariş</dt>
            <dd>{customer.orderCount}</dd>
          </div>
          <div>
            <dt>Tamamlanmış Sipariş</dt>
            <dd>{customer.completedOrderCount}</dd>
          </div>
          <div>
            <dt>Toplam Harcama</dt>
            <dd>{formatCurrency(customer.totalSpentInKurus)}</dd>
          </div>
          <div>
            <dt>Ortalama Sipariş Tutarı</dt>
            <dd>{averageOrderAmount === null ? '—' : formatCurrency(averageOrderAmount)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="customer-contact-title" className="customer-detail-section">
        <h2 id="customer-contact-title">İletişim</h2>
        <address className="customer-contact">
          <div>
            <span>Telefon</span>
            <strong>{customer.phone}</strong>
          </div>
          <div>
            <span>E-posta</span>
            <strong>{customer.email}</strong>
          </div>
        </address>
      </section>

      <section aria-labelledby="customer-orders-title" className="customer-detail-section">
        <div className="customer-orders-header">
          <div>
            <h2 id="customer-orders-title">Son Siparişler</h2>
            <p>En yeni {recentOrders.length} sipariş</p>
          </div>
          <Link to={`/siparisler?q=${encodeURIComponent(customer.name)}`}>
            Tüm siparişleri görüntüle
          </Link>
        </div>

        <div className="customer-orders-list">
          <CustomerOrdersTable orders={recentOrders} />
          <CustomerOrderCards orders={recentOrders} />
        </div>
      </section>
    </article>
  )
}

function CustomerDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preservedQuery = searchParams.toString()
  const listPath = `/musteriler${preservedQuery ? `?${preservedQuery}` : ''}`
  const customer = customerDemoData.find((item) => item.id === id)

  if (!customer) {
    return (
      <section aria-labelledby="page-title" className="customer-detail-not-found">
        <h1 id="page-title">Müşteri bulunamadı</h1>
        <p>Aradığınız müşteri kaydı bulunamadı.</p>
        <Link to={listPath}>Müşterilere geri dön</Link>
      </section>
    )
  }

  return <CustomerDetailContent customer={customer} listPath={listPath} />
}

export default CustomerDetailPage
