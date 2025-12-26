import React, { useState } from 'react'
import { register } from '../../api/auth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const Register = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })

    const hdlChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const hdlSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirmPassword) {
            return toast.error('Passwords do not match')
        }
        try {
            await register(form)
            toast.success('Register Success')
            navigate('/login')
        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.message || 'Register Failed')
        }
    }

    return (
        <div className='flex items-center justify-center min-h-[80vh]'>
            <div className='w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md'>
                <h2 className='text-2xl font-bold text-center'>Register</h2>
                <form onSubmit={hdlSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            className='w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            type="email"
                            name="email"
                            onChange={hdlChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            className='w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            type="password"
                            name="password"
                            onChange={hdlChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                        <input
                            className='w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            type="password"
                            name="confirmPassword"
                            onChange={hdlChange}
                        />
                    </div>
                    <button className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition'>
                        Register
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Register
