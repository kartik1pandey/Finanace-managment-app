'use client'

export default function Footer() {
  return (
    <footer className="h-20 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex items-center justify-center text-sm text-gray-600 dark:text-slate-300">
      <div className="flex items-center gap-4">
        <span>© 2025 FinBodhi. Built with privacy in mind.</span>
        <a href="https://finbodhi.com/terms" className="hover:underline" target="_blank">Terms</a>
        <a href="https://finbodhi.com/privacy" className="hover:underline" target="_blank">Privacy</a>
        <a href="https://finbodhi.com/docs/manifesto" className="hover:underline" target="_blank">Manifesto</a>
      </div>
    </footer>
  )
}