import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { User, Award, Loader2, Plus, Trash2, Mail, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [newSkill, setNewSkill] = useState('');
    const [proficiency, setProficiency] = useState(50); // 0-100

    const { data: skills, isLoading } = useQuery({
        queryKey: ['user-skills'],
        queryFn: async () => {
            const res = await api.get('/user-skills');
            return res.data;
        }
    });

    const addSkillMutation = useMutation({
        mutationFn: async (newSkillData) => {
            return api.post('/user-skills', newSkillData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['user-skills']);
            setNewSkill('');
            setProficiency(50);
            toast.success('Skill added successfully!');
        },
        onError: () => toast.error('Failed to add skill')
    });

    const removeSkillMutation = useMutation({
        mutationFn: async (skillId) => {
            return api.delete(`/user-skills/${skillId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['user-skills']);
            toast.success('Skill removed');
        },
        onError: () => toast.error('Failed to remove skill')
    });

    const handleAddSkill = (e) => {
        e.preventDefault();
        if (!newSkill.trim()) return;
        addSkillMutation.mutate({ skillTag: newSkill.trim(), proficiency: parseInt(proficiency, 10) });
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: User Details */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm text-center">
                        <div className="w-24 h-24 mx-auto bg-[#FFF0E8] dark:bg-[#8A3324]/30 rounded-full flex items-center justify-center mb-4">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-[#E97451]" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user?.name || 'Student'}</h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            <Shield className="w-3.5 h-3.5" />
                            {user?.role || 'STUDENT'}
                        </span>

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-left space-y-4">
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Skills */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Award className="w-6 h-6 text-[#E97451]" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Skills</h2>
                        </div>

                        {/* Add Skill Form */}
                        <form onSubmit={handleAddSkill} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-8 border border-gray-100 dark:border-gray-800">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Skill Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. React, Python, Machine Learning" 
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E97451] outline-none transition-shadow"
                                        value={newSkill}
                                        onChange={e => setNewSkill(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="sm:w-48">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex justify-between">
                                        <span>Proficiency</span>
                                        <span>{proficiency}%</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        step="10"
                                        className="w-full h-2 mt-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#E97451]"
                                        value={proficiency}
                                        onChange={e => setProficiency(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        type="submit" 
                                        disabled={addSkillMutation.isLoading || !newSkill.trim()}
                                        className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-black dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 h-[38px]"
                                    >
                                        {addSkillMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add</>}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Skills List */}
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#E97451]" /></div>
                        ) : !skills || skills.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                No skills added yet. Add your first skill above!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {skills.map(skill => (
                                    <div key={skill.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl hover:shadow-sm transition-shadow group">
                                        <div className="flex-1 mr-6">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="font-bold text-gray-900 dark:text-white">{skill.skillTag}</span>
                                                <span className="text-xs font-medium text-gray-500">{skill.proficiency}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-[#E97451] h-full rounded-full" style={{ width: `${skill.proficiency}%` }}></div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeSkillMutation.mutate(skill.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove skill"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
