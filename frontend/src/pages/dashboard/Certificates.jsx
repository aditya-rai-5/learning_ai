import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Award, Download, ExternalLink, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Certificates() {
    const { data: certificates, isLoading, refetch } = useQuery({
        queryKey: ['my-certificates'],
        queryFn: async () => {
            const res = await api.get('/my-certificates');
            return res.data;
        }
    });

    const { data: enrollments } = useQuery({
        queryKey: ['enrollments-for-certs'],
        queryFn: async () => {
            const res = await api.get('/enrollments');
            return res.data;
        }
    });

    const handleIssueCertificate = async (courseId) => {
        try {
            await api.post(`/courses/${courseId}/certificates`);
            toast.success('Certificate issued successfully!');
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to issue certificate');
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#E97451]" /></div>;

    const completedWithoutCert = enrollments?.filter(e => 
        e.completedAt && !certificates?.some(c => c.courseId === e.courseId)
    ) || [];

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#FFF0E8] dark:bg-[#8A3324]/30 rounded-2xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#E97451]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">My Certificates</h1>
                    <p className="text-gray-500 text-sm">Recognizing your hard work and achievements.</p>
                </div>
            </div>

            {/* Section: Pending Certificates */}
            {completedWithoutCert.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        Available to Claim
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedWithoutCert.map(enrollment => (
                            <div key={enrollment.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                                <Award className="w-12 h-12 text-gray-300 mb-4" />
                                <h3 className="font-bold mb-1">{enrollment.course.title}</h3>
                                <p className="text-xs text-gray-500 mb-6">Completed on {new Date(enrollment.completedAt).toLocaleDateString()}</p>
                                <button 
                                    onClick={() => handleIssueCertificate(enrollment.courseId)}
                                    className="w-full bg-[#E97451] text-white py-2.5 rounded-xl font-bold hover:bg-[#D05D3A] transition-colors"
                                >
                                    Claim Certificate
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section: Issued Certificates */}
            <h2 className="text-lg font-bold mb-6">Achievement Gallery</h2>
            {certificates?.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <Award className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="text-gray-500 max-w-xs mx-auto">No certificates issued yet. Complete a course to earn your first one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates?.map(cert => (
                        <div key={cert.id} className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="aspect-[1.4/1] bg-gray-100 dark:bg-gray-800 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#E97451]/10 rounded-full -mr-12 -mt-12"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#4A5D23]/10 rounded-full -ml-8 -mb-8"></div>
                                
                                <Award className="w-16 h-16 text-[#E97451] mb-4 relative z-10" />
                                <div className="h-px w-24 bg-gray-300 dark:bg-gray-700 mb-4"></div>
                                <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white line-clamp-2 relative z-10 px-4">
                                    {cert.course.title}
                                </h3>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-2 font-bold">Certificate of Completion</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Issued</p>
                                    <p className="text-xs font-medium">{new Date(cert.issuedAt || new Date()).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={cert.certUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:text-[#E97451] transition-colors shadow-sm"
                                        title="View PDF"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button 
                                        className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:text-[#E97451] transition-colors shadow-sm"
                                        title="Download"
                                        onClick={() => toast.info('Starting download...')}
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
