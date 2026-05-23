export const rollDice = (formula, title = "Rolagem de Dados", mod = 0) => {
  const event = new CustomEvent('roll-dice', {
    detail: { formula, title, mod }
  })
  window.dispatchEvent(event)
}

if (typeof window !== 'undefined') {
  window.rollDice = rollDice
}
