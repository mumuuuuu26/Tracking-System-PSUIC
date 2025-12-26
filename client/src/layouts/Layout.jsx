import React from 'react'
import { Outlet } from 'react-router-dom'
import MainNav from '../components/MainNav'

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-100">
            <MainNav />
            <main className="flex-1 p-4">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
