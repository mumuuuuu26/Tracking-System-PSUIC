import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getITPerformance } from '../../../api/report';
import { Star, CheckCircle, Clock } from 'lucide-react';

const ITPerformance = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getITPerformance(token);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold">IT Support Performance</h2>

            {loading ? <p>Loading...</p> : (
                <div className="grid gap-4">
                    {data.map((it, index) => (
                        <div key={it.id} className="bg-white border p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{it.name || it.email}</h3>
                                    <div className="flex gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                className={i < Math.round(it.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                            />
                                        ))}
                                        <span className="text-xs text-gray-400 ml-1">({it.totalRated} reviews)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-8 text-right">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1 flex items-center justify-end gap-1"><CheckCircle size={12} /> Resolved</p>
                                    <p className="font-bold text-lg text-green-600">{it.totalResolved}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1 flex items-center justify-end gap-1"><Clock size={12} /> Pending</p>
                                    <p className="font-bold text-lg text-orange-500">{it.pendingJobs || 0}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ITPerformance;
