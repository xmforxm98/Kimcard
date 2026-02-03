import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Suspense fallback={<div className="w-full h-screen bg-black flex items-center justify-center text-orange-500 font-bold tracking-tighter">INITIALIZING KIMCARD V1...</div>}>
        <App />
    </Suspense>
)
