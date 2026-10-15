// Último tablero del CRM cargado en esta pestaña: al volver se muestra al instante mientras
// se refresca. Vive en el módulo (no en el componente) para sobrevivir a la navegación.
let lastCards = [];

export const getCachedCards = () => lastCards;

export const setCachedCards = cards => {
  lastCards = cards;
};
