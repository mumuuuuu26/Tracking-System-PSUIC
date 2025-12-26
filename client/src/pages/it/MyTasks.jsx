import React, { useEffect, useState } from 'react'
import { getMyTasks, acceptJob, closeJob } from '../../api/it'
import useAuthStore from '../../store/auth-store'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'

const MyTasks = () => {
    const { token } = useAuthStore()
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            const res = await getMyTasks(token)
            setTasks(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const handleAccept = async (id) => {
        try {
            await acceptJob(token, id)
            toast.success('Job Accepted')
            loadTasks()
        } catch (err) {
            toast.error('Accept Failed')
        }
    }

    const handleClose = async (id) => {
        if (!window.confirm('Close this job?')) return
        try {
            await closeJob(token, id, {}) // might need form data for images later
            toast.success('Job Closed')
            loadTasks()
        } catch (err) {
            toast.error('Close Failed')
        }
    }

    return (
        <div className="bg-white p-6 rounded shadow">
            <h1 className="text-2xl font-bold mb-6">My IT Tasks</h1>

            <div className="grid gap-4">
                {tasks.map(item => (
                    <div key={item.id} className="border p-4 rounded hover:bg-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-slate-600">{item.description}</p>
                            <div className="text-xs text-slate-500 mt-2">
                                Status: <span className="font-semibold">{item.status}</span> | Date: {dayjs(item.createdAt).format('DD/MM/YYYY')}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {item.status === 'pending' && (
                                <button
                                    onClick={() => handleAccept(item.id)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                    Accept
                                </button>
                            )}
                            {item.status === 'in_progress' && (
                                <button
                                    onClick={() => handleClose(item.id)}
                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                >
                                    Close Job
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && <p className="text-gray-500">No tasks assigned.</p>}
            </div>
        </div>
    )
}

export default MyTasks
