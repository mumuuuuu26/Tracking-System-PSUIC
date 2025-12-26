import React, { useState } from 'react'
import { createTicket } from '../../api/ticket'
import useAuthStore from '../../store/auth-store'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const CreateTicket = () => {
    const { token } = useAuthStore()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        title: '',
        description: '',
        // equipmentId: '' // Optional if implemented
    })

    const hdlChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const hdlSubmit = async (e) => {
        e.preventDefault()
        try {
            await createTicket(token, form)
            toast.success('Ticket Created')
            navigate('/user/my-tickets')
        } catch (err) {
            console.log(err)
            toast.error('Failed to create ticket')
        }
    }

    return (
        <div className="bg-white p-6 rounded shadow max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
            <form onSubmit={hdlSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Problem Title</label>
                    <input
                        type="text"
                        name="title"
                        onChange={hdlChange}
                        required
                        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Internet is down"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                        name="description"
                        onChange={hdlChange}
                        required
                        rows="4"
                        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe the issue in detail..."
                    />
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                    Submit Ticket
                </button>
            </form>
        </div>
    )
}

export default CreateTicket
