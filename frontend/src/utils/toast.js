export const showCursedToast = (title, message, type = 'energy', duration = 5000) => {
  const event = new CustomEvent('cursed-toast', {
    detail: { id: Math.random().toString(36).substring(2, 9), title, message, type, duration }
  });
  window.dispatchEvent(event);
};

// Intercept window.alert for compatibility
if (typeof window !== 'undefined') {
  window.alert = (message) => {
    let title = "Domínio Céu e Terra";
    let type = "energy";
    const msgLower = String(message).toLowerCase();
    if (msgLower.includes("sucesso") || msgLower.includes("salvo") || msgLower.includes("adicionado") || msgLower.includes("ok")) {
      title = "Energia Concluída";
      type = "success";
    } else if (msgLower.includes("erro") || msgLower.includes("falha") || msgLower.includes("insuficiente") || msgLower.includes("inválido") || msgLower.includes("não autorizado") || msgLower.includes("unauthorized")) {
      title = "Alerta Maldito";
      type = "error";
    } else if (msgLower.includes("aviso") || msgLower.includes("atenção") || msgLower.includes("por favor")) {
      title = "Ressonância";
      type = "warning";
    }
    showCursedToast(title, message, type);
  };
}
