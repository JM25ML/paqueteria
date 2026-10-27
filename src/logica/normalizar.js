// Convierte un texto a una forma comparable: sin tildes, en minúsculas y sin espacios sobrantes.
// "  La   Coruña " → "la coruna"
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
