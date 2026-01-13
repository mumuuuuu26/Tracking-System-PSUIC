import React, { useState, useEffect } from 'react';
import { Mail, Edit2, Check, X, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/auth-store';
import { getEmailTemplates, updateEmailTemplate } from '../../api/it';
import { toast } from 'react-toastify';

const EmailSettings = () => {
    const { token } = useAuthStore();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);

    // Form states
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const res = await getEmailTemplates(token);
            setTemplates(res.data);
        } catch (err) {
            console.error("Failed to load templates", err);
            toast.error("Failed to load email settings");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setSubject(template.subject);
        setBody(template.body);
        setIsEnabled(template.isEnabled);
    };

    const handleSave = async () => {
        if (!editingTemplate) return;

        try {
            await updateEmailTemplate(token, editingTemplate.id, {
                subject,
                body,
                isEnabled
            });
            toast.success("Email template updated");
            setEditingTemplate(null);
            loadTemplates();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update template");
        }
    };

    const handleToggle = async (template) => {
        try {
            await updateEmailTemplate(token, template.id, {
                ...template,
                isEnabled: !template.isEnabled
            });
            toast.success(`${template.isEnabled ? 'Disabled' : 'Enabled'} notification`);
            loadTemplates();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const getVariables = (jsonStr) => {
        try {
            return JSON.parse(jsonStr) || [];
        } catch (e) {
            return [];
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-blue-600 pt-6 pb-24 px-6 rounded-b-[2.5rem] shadow-lg relative z-0">
                <h1 className="text-2xl font-bold text-white text-center">Email Notification Settings</h1>
                <p className="text-blue-100 text-center text-sm mt-1">Manage automated email templates</p>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10 space-y-4">
                {loading ? (
                    <div className="p-8 text-center bg-white rounded-2xl shadow-sm text-gray-500">Loading...</div>
                ) : (
                    templates.map(t => (
                        <div key={t.id} className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 ${!t.isEnabled ? 'opacity-75 grayscale' : ''}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{t.name === 'new_ticket_it' ? 'IT: New Ticket Alert' : t.name === 'ticket_resolved_user' ? 'User: Ticket Resolved' : t.name}</h3>
                                        <p className="text-sm text-gray-500">{t.description}</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100 font-mono">
                                    <strong>Subject:</strong> {t.subject}
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-3 justify-center">
                                <button
                                    onClick={() => handleToggle(t)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${t.isEnabled ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                                >
                                    {t.isEnabled ? 'Enabled' : 'Disabled'}
                                </button>
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={16} /> Edit
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">Edit Template</h3>
                            <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Content (HTML)</label>
                                <p className="text-xs text-gray-500 mb-2">You can use HTML tags for styling.</p>
                                <textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none h-[300px] font-mono text-sm"
                                />
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
                                    <AlertCircle size={16} /> Available Variables
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {getVariables(editingTemplate.variables).map(v => (
                                        <span key={v} className="bg-white px-2 py-1 rounded-md text-xs font-mono border border-blue-100 text-blue-600 select-all cursor-pointer hover:bg-blue-100 transition-colors" title="Click to copy">
                                            {`{{${v}}}`}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setEditingTemplate(null)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailSettings;
