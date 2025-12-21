import React, { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import API from '../api/api'
import { DEMO_PRODUCTS } from '../data/demoProducts'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    API.get('/products')
      .then((res) => {
        if (!mounted) return
        const data = res?.data || []
        if (Array.isArray(data) && data.length > 0) setProducts(data)
        else setProducts(DEMO_PRODUCTS)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err)
        setProducts(DEMO_PRODUCTS)
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [])



  return (
    <main id="content" className="products-page">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">All Products</h2>
          {loading && <p>Loading products…</p>}
        </div>

        <div id="products" className="grid">
          {products.map((p) => {
            const images = p.images || []
            const prod = { ...p, images }
            return <ProductCard key={p._id || p.id || p.slug} p={prod} />
          })}
        </div>
      </div>
    </main>
  )
}
