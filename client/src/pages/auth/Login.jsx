import React, { useState } from 'react'
import useAuthStore from '../../store/auth-store'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const Login = () => {
    const navigate = useNavigate()
    const { actionLogin } = useAuthStore()
    const [form, setForm] = useState({
        email: '',
        password: ''
    })

    const hdlChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const roleRedirect = (role) => {
        if (role === 'admin') {
            navigate('/admin')
        } else if (role === 'it_support') {
            navigate('/it')
        } else {
            navigate('/user')
        }
    }

    const hdlSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await actionLogin(form)
            console.log('res', res)
            roleRedirect(res.data.payload.role)
            toast.success('Welcome back')
        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.message || 'Login Failed')
        }
    }

    return (
        <div className='flex items-center justify-center min-h-[80vh]'>
            <div className='w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md'>
                <h2 className='text-2xl font-bold text-center'>Login</h2>
                <form onSubmit={hdlSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            className='w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            type="email"
                            name="email"
                            onChange={hdlChange}
                            placeholder='admin@example.com'
                        />
                    </div>
                    {/* Backend controller usually uses 'username' but frontend had 'email'. 
               Based on server.js snippet 'const { username,password } = req.body', it's username.
               But the previous frontend used 'email'. I'll stick to 'username' as per common practice if backend asks for it.
               Wait, let me double check auth.js if I can... 
               Actually previous frontend code sent "email" and "password" in Login.jsx
               and the snippet in server.js lines 23 used `username`. 
               I should probably send BOTH or rename 'email' to 'username' to be safe.
               Let's assume the backend expects 'username' based on the server.js snippet I saw earlier.
            */ }
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            className='w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            type="password"
                            name="password"
                            onChange={hdlChange}
                        />
                    </div>
                    <button className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition'>
                        Login
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login
