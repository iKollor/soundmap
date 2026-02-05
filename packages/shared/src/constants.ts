// Category options for forms (Pure data, no external dependencies)

export const LICENSE_TYPES = ['CC0', 'CC-BY', 'CC-BY-SA'] as const;
export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export const SOUND_STATUSES = ['pending', 'processing', 'ready', 'failed'] as const;
export const ASSET_TYPES = ['original', 'hls', 'opus', 'waveform', 'mp3'] as const;

export const MAX_MIXER_TRACKS = 4;
export const MAX_UPLOAD_SIZE_MB = 100;
export const SUPPORTED_AUDIO_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp3'] as const;

// Guayaquil center coordinates
export const DEFAULT_MAP_CENTER = {
    lat: -2.1894,
    lng: -79.8891,
    zoom: 12,
} as const;

export const SOUND_CATEGORIES = [
    { value: 'naturaleza', label: 'Naturaleza', group: 'Naturaleza' },
    { value: 'animales', label: 'Animales', group: 'Naturaleza' },
    { value: 'aves', label: 'Aves', group: 'Naturaleza' },
    { value: 'insectos', label: 'Insectos', group: 'Naturaleza' },
    { value: 'agua', label: 'Agua', group: 'Naturaleza' },
    { value: 'viento', label: 'Viento', group: 'Naturaleza' },
    { value: 'lluvia', label: 'Lluvia', group: 'Naturaleza' },
    { value: 'truenos', label: 'Truenos', group: 'Naturaleza' },
    { value: 'urbano', label: 'Urbano', group: 'Urbano' },
    { value: 'trafico', label: 'Tráfico', group: 'Urbano' },
    { value: 'vehiculos', label: 'Vehículos', group: 'Urbano' },
    { value: 'motos', label: 'Motos', group: 'Urbano' },
    { value: 'buses', label: 'Buses', group: 'Urbano' },
    { value: 'trenes', label: 'Trenes', group: 'Urbano' },
    { value: 'aviones', label: 'Aviones', group: 'Urbano' },
    { value: 'barcos', label: 'Barcos', group: 'Urbano' },
    { value: 'personas', label: 'Personas', group: 'Personas' },
    { value: 'voces', label: 'Voces', group: 'Personas' },
    { value: 'conversaciones', label: 'Conversaciones', group: 'Personas' },
    { value: 'multitud', label: 'Multitud', group: 'Personas' },
    { value: 'pasos', label: 'Pasos', group: 'Personas' },
    { value: 'risas', label: 'Risas', group: 'Personas' },
    { value: 'aplausos', label: 'Aplausos', group: 'Personas' },
    { value: 'musica', label: 'Música', group: 'Música' },
    { value: 'conciertos', label: 'Conciertos', group: 'Música' },
    { value: 'estadios', label: 'Estadios', group: 'Música' },
    { value: 'instrumentos', label: 'Instrumentos', group: 'Música' },
    { value: 'canto', label: 'Canto', group: 'Música' },
    { value: 'ambiente', label: 'Ambiente', group: 'Ambiente' },
    { value: 'cafeteria', label: 'Cafetería', group: 'Ambiente' },
    { value: 'mercado', label: 'Mercado', group: 'Ambiente' },
    { value: 'parque', label: 'Parque', group: 'Ambiente' },
    { value: 'playa', label: 'Playa', group: 'Ambiente' },
    { value: 'bosque', label: 'Bosque', group: 'Ambiente' },
    { value: 'campo', label: 'Campo', group: 'Ambiente' },
    { value: 'industrial', label: 'Industrial', group: 'Industrial' },
    { value: 'construccion', label: 'Construcción', group: 'Industrial' },
    { value: 'maquinaria', label: 'Maquinaria', group: 'Industrial' },
    { value: 'fabricas', label: 'Fábricas', group: 'Industrial' },
    { value: 'hogar', label: 'Hogar', group: 'Hogar' },
    { value: 'electrodomesticos', label: 'Electrodomésticos', group: 'Hogar' },
    { value: 'puertas', label: 'Puertas', group: 'Hogar' },
    { value: 'campanas', label: 'Campanas', group: 'Hogar' },
    { value: 'tecnologia', label: 'Tecnología', group: 'Tecnología' },
    { value: 'computadoras', label: 'Computadoras', group: 'Tecnología' },
    { value: 'electronica', label: 'Electrónica', group: 'Tecnología' },
    { value: 'notificaciones', label: 'Notificaciones', group: 'Tecnología' },
    { value: 'otro', label: 'Otro', group: 'Otro' },
] as const;

export const ENVIRONMENT_OPTIONS = [
    { value: 'interior', label: 'Interior' },
    { value: 'exterior', label: 'Exterior' },
    { value: 'mixto', label: 'Mixto' },
] as const;
