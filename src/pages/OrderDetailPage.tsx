import { useParams } from 'react-router-dom'

function OrderDetailPage() {
  const { id } = useParams()

  return (
    <section className="app-placeholder" aria-labelledby="page-title">
      <h1 id="page-title">Sipariş Detayı</h1>
      <p>Sipariş No: #{id}</p>
    </section>
  )
}

export default OrderDetailPage
