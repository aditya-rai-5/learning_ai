import { useQuery } from '@tanstack/react-query'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../lib/api'
import { Target, Loader2 } from 'lucide-react'

export default function SkillsMatrix() {
    const { data: skills, isLoading } = useQuery({
        queryKey: ['user-skills'],
        queryFn: async () => {
            const res = await api.get('/user-skills')
            return res.data
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#E97451]" />
            </div>
        )
    }

    if (!skills || skills.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
                <Target className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <h3 className="text-gray-900 dark:text-white font-medium mb-1">No Skills Yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Complete courses to start building your skills matrix and track your proficiency.
                </p>
            </div>
        )
    }

    // Format data for Recharts Radar
    const chartData = skills.map(skill => ({
        subject: skill.skillTag.toUpperCase(),
        A: skill.proficiency,
        fullMark: Math.max(...skills.map(s => s.proficiency), 10) // Dynamic max based on highest skill, min 10
    }))

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#FFF0E8] dark:bg-orange-900/20 text-[#E97451] rounded-lg">
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Skills Matrix</h2>
                    <p className="text-sm text-gray-500">Your proficiency across completed topics</p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} 
                            className="dark:text-gray-400"
                        />
                        <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 'dataMax']} 
                            tick={false}
                            axisLine={false}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#E97451', fontWeight: 'bold' }}
                        />
                        <Radar 
                            name="Proficiency" 
                            dataKey="A" 
                            stroke="#E97451" 
                            fill="#E97451" 
                            fillOpacity={0.5} 
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
                {skills.map(skill => (
                    <span key={skill.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        {skill.skillTag}: <span className="ml-1 text-[#E97451] font-bold">{skill.proficiency}</span>
                    </span>
                ))}
            </div>
        </div>
    )
}
