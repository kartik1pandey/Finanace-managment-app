'use client'

export default function Footer() {
  return (
    <footer className="h-20 bg-[#0a0a0a] border-t border-gray-800 flex items-center justify-center text-sm text-gray-400">
      <div className="flex items-center gap-4">
        <span>© 2025 FinBodhi. Built with privacy in mind.</span>
        <a href="https://finbodhi.com/terms" className="hover:underline hover:text-white transition-colors" target="_blank">Terms</a>
        <a href="https://finbodhi.com/privacy" className="hover:underline hover:text-white transition-colors" target="_blank">Privacy</a>
        <a href="https://finbodhi.com/docs/manifesto" className="hover:underline hover:text-white transition-colors" target="_blank">Manifesto</a>
      </div>
    </footer>
  )
}