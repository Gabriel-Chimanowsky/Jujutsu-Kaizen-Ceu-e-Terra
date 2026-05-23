export const updateCursedColor = (hexColor) => {
  if (!hexColor) return
  
  // Set CSS variable
  document.documentElement.style.setProperty('--cursed-color', hexColor)
  
  // Parse HEX to RGB for semi-transparent border and glass-card backdrops
  const cleanHex = hexColor.replace('#', '')
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    document.documentElement.style.setProperty('--cursed-color-rgb', `${r}, ${g}, ${b}`)
  } else if (cleanHex.length === 3) {
    const r = parseInt(cleanHex.substring(0, 1).repeat(2), 16)
    const g = parseInt(cleanHex.substring(1, 2).repeat(2), 16)
    const b = parseInt(cleanHex.substring(2, 3).repeat(2), 16)
    document.documentElement.style.setProperty('--cursed-color-rgb', `${r}, ${g}, ${b}`)
  }
}
