import { useParams } from 'react-router-dom'

type ProductEditorPageProps = {
  mode: 'create' | 'edit'
}

function ProductEditorPage({ mode }: ProductEditorPageProps) {
  const { id } = useParams()
  const isCreateMode = mode === 'create'

  return (
    <section className="app-placeholder" aria-labelledby="page-title">
      <h1 id="page-title">{isCreateMode ? 'Yeni Ürün' : 'Ürün Düzenle'}</h1>
      <p>
        {isCreateMode
          ? 'Ürün ekleme formu sonraki geliştirme adımında oluşturulacaktır.'
          : `Ürün ${id} düzenleme formu sonraki geliştirme adımında oluşturulacaktır.`}
      </p>
    </section>
  )
}

export default ProductEditorPage
