export default function Home() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
                    Learn engineering with{' '}
                    <span className="text-[#E97451] dark:text-[#FF855C] transition-colors">AI superpowers</span>
                </h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 transition-colors">
                    Ask questions in plain language, get answers grounded in your exact course material — powered by Groq + Mistral RAG.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    <a href="/courses" className="bg-[#E97451] text-white px-7 py-3 rounded-xl font-semibold hover:bg-[#D05D3A] transition-colors">
                        Explore Courses
                    </a>
                    <a href="/register" className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-7 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Get started free
                    </a>
                </div>
            </div>
        </div>
    )
}
