'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadSound } from '@/actions/upload';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { SOUND_CATEGORIES, ENVIRONMENT_OPTIONS } from '@soundmap/shared/constants';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false });
const AddressSearch = dynamic(() => import('./AddressSearch'), { ssr: false });

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 180; // 3 minutes in seconds

// Group categories for dropdown
const groupedCategories = SOUND_CATEGORIES.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
}, {} as Record<string, typeof SOUND_CATEGORIES[number][]>);

export default function UploadForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [addressInfo, setAddressInfo] = useState<{ address: string; city?: string; country?: string } | null>(null);
    const [audioDuration, setAudioDuration] = useState<number | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [environment, setEnvironment] = useState('');
    const [description, setDescription] = useState('');
    const [equipment, setEquipment] = useState('');
    const [tags, setTags] = useState('');

    const isFormValid = file && location && title.trim().length >= 3 && category !== '';

    const validateFile = useCallback((file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return `El archivo es muy grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`;
        }
        return null;
    }, []);

    const checkAudioDuration = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);

        audio.addEventListener('loadedmetadata', () => {
            const duration = audio.duration;
            setAudioDuration(duration);

            if (duration > MAX_DURATION) {
                setError(`El audio es muy largo. Máximo ${MAX_DURATION / 60} minutos`);
                setFile(null);
            }

            URL.revokeObjectURL(url);
        });

        audio.addEventListener('error', () => {
            setError('No se pudo leer el archivo de audio');
            URL.revokeObjectURL(url);
        });
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            const audioFile = acceptedFiles[0];
            const validationError = validateFile(audioFile);

            if (validationError) {
                setError(validationError);
                return;
            }

            setFile(audioFile);
            setError(null);
            checkAudioDuration(audioFile);
        }
    }, [validateFile, checkAudioDuration]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/mpeg': ['.mp3'],
            'audio/wav': ['.wav'],
            'audio/ogg': ['.ogg'],
            'audio/mp4': ['.m4a'],
            'audio/flac': ['.flac'],
            'audio/x-flac': ['.flac'],
        },
        maxFiles: 1,
        multiple: false
    });

    const handleAddressSelect = (result: { lat: number; lng: number; address: string; city?: string; country?: string }) => {
        setLocation({ lat: result.lat, lng: result.lng });
        setAddressInfo({ address: result.address, city: result.city, country: result.country });

        // Dispatch custom event to MiniMap
        window.dispatchEvent(new CustomEvent('minimap:flyto', {
            detail: { lat: result.lat, lng: result.lng }
        }));
    };

    const handleLocationSelect = (loc: { lat: number; lng: number }) => {
        setLocation(loc);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return setError('Por favor selecciona un archivo de audio');
        if (!location) return setError('Por favor selecciona una ubicación en el mapa');

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.set('file', file);
        formData.set('title', title);
        formData.set('category', category);
        formData.set('environment', environment);
        formData.set('description', description);
        formData.set('equipment', equipment);
        formData.set('tags', tags);
        formData.set('latitude', location.lat.toString());
        formData.set('longitude', location.lng.toString());

        // Add address info if available
        if (addressInfo) {
            formData.set('address', addressInfo.address);
            if (addressInfo.city) formData.set('city', addressInfo.city);
            if (addressInfo.country) formData.set('country', addressInfo.country);
        }

        const result = await uploadSound(formData);

        if (result.error) {
            setError(typeof result.error === 'string' ? result.error : 'Error al subir el archivo');
            setLoading(false);
        } else {
            router.push(`/sonido/${result.soundId}`);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            {/* File Dropzone */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group bg-card",
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50',
                    file && 'border-green-500/50 bg-green-500/5'
                )}
            >
                <input {...getInputProps()} />
                {file ? (
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-medium text-foreground truncate max-w-xs">{file.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                {audioDuration && (
                                    <>
                                        <span>•</span>
                                        <span>{formatDuration(audioDuration)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setFile(null); setAudioDuration(null); }}
                            className="hover:bg-destructive/10 hover:text-destructive"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-foreground mb-2">Arrastra tu audio aquí</p>
                        <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="px-2 py-1 rounded bg-secondary">MP3</span>
                            <span className="px-2 py-1 rounded bg-secondary">WAV</span>
                            <span className="px-2 py-1 rounded bg-secondary">OGG</span>
                            <span className="px-2 py-1 rounded bg-secondary">FLAC</span>
                            <span className="px-2 py-1 rounded bg-secondary">M4A</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">Máximo 100MB • 3 minutos</p>
                    </div>
                )}
            </div>

            {/* Main form grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left column - Form fields */}
                <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                            id="title"
                            name="title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Amanecer en el Malecón"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Categoría *</Label>
                        <Select value={category} onValueChange={setCategory} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(groupedCategories).map(([group, cats]) => (
                                    <SelectGroup key={group}>
                                        <SelectLabel>{group}</SelectLabel>
                                        {cats.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Environment */}
                    <div className="space-y-2">
                        <Label>Ambiente</Label>
                        <div className="flex gap-3">
                            {ENVIRONMENT_OPTIONS.map(opt => (
                                <div key={opt.value} className="flex-1">
                                    <input
                                        type="radio"
                                        id={opt.value}
                                        name="environment"
                                        value={opt.value}
                                        className="sr-only peer"
                                        checked={environment === opt.value}
                                        onChange={(e) => setEnvironment(e.target.value)}
                                    />
                                    <Label
                                        htmlFor={opt.value}
                                        className="h-10 rounded-md border border-input flex items-center justify-center cursor-pointer hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all text-sm font-medium"
                                    >
                                        {opt.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="¿Qué se escucha? ¿Cuándo fue grabado?"
                            className="resize-none"
                        />
                    </div>

                    {/* Additional fields row */}
                    <div className="space-y-2">
                        <Label htmlFor="equipment">Equipo usado</Label>
                        <Input
                            id="equipment"
                            name="equipment"
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                            placeholder="Ej: iPhone 15, Zoom H4n"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Etiquetas</Label>
                        <Input
                            id="tags"
                            name="tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Separadas por coma: río, guayaquil, tarde"
                        />
                    </div>
                </div>

                {/* Right column - Map */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Ubicación *</Label>
                        <AddressSearch
                            onSelect={handleAddressSelect}
                            placeholder="Buscar dirección o lugar..."
                        />
                    </div>

                    <div className="h-[350px] rounded-xl overflow-hidden border bg-card relative shadow-sm">
                        <MiniMap
                            onLocationSelect={handleLocationSelect}
                            initialLocation={location || undefined}
                        />
                        {!location && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                                <span className="px-4 py-2 bg-background/90 rounded-full text-sm font-medium shadow-lg border">
                                    Busca o haz clic en el mapa
                                </span>
                            </div>
                        )}
                    </div>

                    {addressInfo && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50 border border-border/50">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="truncate flex-1">{addressInfo.address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Submit button */}
            <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-12 text-base font-semibold"
                size="lg"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Subiendo...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Publicar Sonido
                    </>
                )}
            </Button>
        </form>
    );
}
