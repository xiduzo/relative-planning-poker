'use client'

import { useDarkMode } from 'usehooks-ts'
import { Button } from './ui/button'
import { useEffect } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'

export function ThemeToggle() {
  const { isDarkMode, toggle } = useDarkMode()

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      {isDarkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </Button>
  )
}
