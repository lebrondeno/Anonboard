import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Submit from './pages/Submit'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/s/:id" element={<Submit />} />
        <Route path="/admin/:id" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
