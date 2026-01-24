import React, { useState } from 'react'
import { register } from '../../api/auth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { UserPlus, ArrowLeft } from 'lucide-react'

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
            console.error(err)
            toast.error(err.response?.data?.message || 'Register Failed')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200 p-4">
            <div className="w-full max-w-md animate-fade-in">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/login')}
                    className="mb-6 flex items-center text-white/80 hover:text-white transition-colors"
                >
                    <ArrowLeft className="mr-2" size={20} /> Back to Login
                </button>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 text-white shadow-inner">
                            <UserPlus size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-white">Create Account</h2>
                        <p className="text-white/60 text-sm mt-1">Join PSUIC Help Desk System</p>
                    </div>

                    <form onSubmit={hdlSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-white/80 ml-1">Email</label>
                            <input
                                className="w-full border border-white/20 bg-white/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white placeholder-white/40"
                                type="email"
                                name="email"
                                placeholder="name@psu.ac.th"
                                onChange={hdlChange}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-white/80 ml-1">Password</label>
                            <input
                                className="w-full border border-white/20 bg-white/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white placeholder-white/40"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                onChange={hdlChange}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-white/80 ml-1">Confirm Password</label>
                            <input
                                className="w-full border border-white/20 bg-white/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white placeholder-white/40"
                                type="password"
                                name="confirmPassword"
                                placeholder="••••••••"
                                onChange={hdlChange}
                                required
                            />
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 mt-4">
                            Register
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register
