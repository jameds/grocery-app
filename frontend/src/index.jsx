import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router'

import api from './api'
import { App } from './App'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    loader: async () => {
      return {
        items: (await api.get('items')).data,
        categories: (await api.get('categories')).data,
      }
    },
    hydrateFallbackElement: <></>,
  },
  {
    path: '/list',
    action: async ({ request }) => {
      const data = await request.json()
      const { id } = await api.post('list', data)

      localStorage.removeItem('memory')

      window.location.href =
        import.meta.env.BASE_URL + `lists/${id}`
    },
  },
  {
    path: '/items',
    action: async ({ request }) => {
      const data = await request.formData()
      api.post('/items',
        Object.fromEntries(data.entries()))
    },
  },
  {
    path: '/items/:id',
    action: ({ request, params }) => {
      api.delete(`/items/${params.id}`)
    },
  },
  {
    path: '/categories/:id',
    action: async ({ request, params }) => {
      const data = await request.formData()
      api.put(`/categories/${params.id}`,
        Object.fromEntries(data.entries()))
    },
  },
], {
  basename: import.meta.env.BASE_URL,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
