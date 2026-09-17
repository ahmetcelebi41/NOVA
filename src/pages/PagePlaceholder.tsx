type PagePlaceholderProps = {
  title: string
}

function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <section className="app-placeholder" aria-labelledby="page-title">
      <h1 id="page-title">{title}</h1>
      <p>Bu sayfa sonraki geliştirme adımında oluşturulacaktır.</p>
    </section>
  )
}

export default PagePlaceholder
