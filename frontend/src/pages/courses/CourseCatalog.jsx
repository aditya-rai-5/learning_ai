import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function CourseCatalog() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses');
                setCourses(response.data);
            } catch (err) {
                setError('Failed to load courses.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              course.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = selectedLevel ? course.level === selectedLevel : true;
        return matchesSearch && matchesLevel;
    });

    const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Course Catalog</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <input 
                    type="text" 
                    placeholder="Search courses..." 
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FFF0E8]0 focus:border-[#FFF0E8]0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FFF0E8]0 focus:border-[#FFF0E8]0"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                >
                    <option value="">All Levels</option>
                    {levels.map(l => (
                        <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
                    ))}
                </select>
            </div>

            {loading && <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading courses...</div>}
            {error && <div className="text-center py-12 text-red-500">{error}</div>}

            {!loading && !error && filteredCourses.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No courses found matching your criteria.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                    <Link key={course.id} to={`/courses/${course.id}`} className="group flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all overflow-hidden">
                        <div className="h-40 bg-gradient-to-r from-[#E97451] to-[#B38B6D] flex items-center justify-center p-4">
                            {/* Placeholder for thumbnail */}
                            <span className="text-white text-xl font-bold text-center line-clamp-2">{course.title}</span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFE0D1] text-[#A84525] dark:bg-[#8A3324]/30 dark:text-[#FFA585]">
                                    {course.level}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {course.price > 0 ? `$${course.price}` : 'Free'}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#E97451] dark:group-hover:text-[#FF855C] transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                {course.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <span>Instructor: {course.creator?.name || 'Unknown'}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
