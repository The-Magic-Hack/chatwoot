// The Magic Hack: el equipo solo usa español e inglés. Importar los ~40 idiomas metía
// unos 14 MB de JSON en el bundle (más de 4 MB comprimidos en cada carga en frío). Con
// otro idioma elegido, la interfaz cae al inglés (fallbackLocale en los entrypoints).
import en from './locale/en';
import es from './locale/es';

export default {
  en,
  es,
};
