import { useEffect, useState } from 'react'

export const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    let frame = 0

    const handleResize = () => {
      cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return size
}