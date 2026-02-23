/**
 * AudioSystem - расширяемая система аудио для игры
 * Включает управление музыкой, звуковыми эффектами и озвучкой
 * 
 * Особенности:
 * - Плавные переходы между треками (crossfade)
 * - Плейлисты с логикой "без повторений"
 * - Раздельное управление громкостью (мастер, музыка, SFX)
 * - Сохранение настроек в localStorage
 * - Расширяемая архитектура для будущих категорий звуков
 */

// ============================================
// КОНФИГУРАЦИЯ АУДИО СИСТЕМЫ
// ============================================

const AUDIO_CONFIG = {
    // Громкость по умолчанию (0.0 - 1.0)
    VOLUME: {
        MASTER: 0.7,
        MUSIC: 0.8,
        SFX: 0.7,
        DIALOGUE: 1.0
    },
    
    // Настройки кроссфейда
    CROSSFADE: {
        DURATION: 2000,        // Длительность перехода в мс
        INTERVAL: 50           // Интервал обновления в мс
    },
    
    // Настройки затухания
    FADE: {
        OUT_DURATION: 1500,    // Длительность затухания
        IN_DURATION: 1000      // Длительность нарастания
    },
    
    // Количество недавно проигранных треков для исключения
    RECENT_TRACKS_COUNT: 1,
    
    // Пути к файлам
    PATHS: {
        MUSIC: 'static/sound/music',
        SFX: 'static/sound/sfx'
    }
};

// ============================================
// ПЛЕЙЛИСТЫ
// ============================================

const MUSIC_PLAYLISTS = {
    mainMenu: {
        tracks: [
            'mainmenu/mainmenu1__music.mp3'
        ],
        loop: true,           // Зацикливать единственный трек
        shuffle: false        // Не перемешивать (для меню)
    },
    
    openworld: {
        tracks: [
            'openworld/openworld1_music.mp3',
            'openworld/openworld2_music.mp3',
            'openworld/openworld3_music.mp3'
        ],
        loop: true,           // Зацикливать плейлист
        shuffle: true         // Перемешивать порядок
    },
    
    // Заготовки для будущих состояний
    combat: {
        tracks: [],
        loop: true,
        shuffle: true
    },
    
    dungeon: {
        tracks: [],
        loop: true,
        shuffle: true
    },
    
    boss: {
        tracks: [],
        loop: true,
        shuffle: false
    }
};

// Категории звуковых эффектов (для будущего расширения)
const SFX_CATEGORIES = {
    combat: {
        sounds: [],
        volume: 0.8
    },
    skills: {
        sounds: [],
        volume: 0.9
    },
    ambient: {
        sounds: [],
        volume: 0.5
    },
    dialogue: {
        sounds: [],
        volume: 1.0
    },
    ui: {
        sounds: [],
        volume: 0.7
    }
};

// ============================================
// КЛАСС MUSIC PLAYER
// ============================================

/**
 * MusicPlayer - управление воспроизведением музыки
 */
class MusicPlayer {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        
        // Два аудио элемента для кроссфейда
        this.audioElements = [
            new Audio(),
            new Audio()
        ];
        
        // Настройка аудио элементов
        this.audioElements.forEach(audio => {
            audio.preload = 'auto';
            audio.volume = 0;
        });
        
        // Индекс текущего активного аудио
        this.currentAudioIndex = 0;
        
        // Текущее состояние
        this.currentPlaylist = null;
        this.currentPlaylistName = null;
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.isTransitioning = false;
        
        // Недавно проигранные треки (для исключения повторов)
        this.recentlyPlayed = [];
        
        // Таймеры
        this.crossfadeTimer = null;
        this.fadeTimer = null;
        
        // Привязываем обработчики
        this._bindHandlers();
    }
    
    /**
     * Привязка обработчиков событий
     */
    _bindHandlers() {
        // Обработчик окончания трека
        this.audioElements.forEach((audio, index) => {
            audio.addEventListener('ended', () => {
                this._onTrackEnded(index);
            });
            
            audio.addEventListener('error', (e) => {
                console.error(`[MusicPlayer] Ошибка загрузки трека:`, e);
            });
        });
    }
    
    /**
     * Получить текущий аудио элемент
     */
    get currentAudio() {
        return this.audioElements[this.currentAudioIndex];
    }
    
    /**
     * Получить следующий аудио элемент
     */
    get nextAudio() {
        return this.audioElements[1 - this.currentAudioIndex];
    }
    
    /**
     * Воспроизвести плейлист
     * @param {string} playlistName - название плейлиста
     * @param {boolean} fadeIn - плавное нарастание
     */
    playPlaylist(playlistName, fadeIn = true) {
        const playlist = MUSIC_PLAYLISTS[playlistName];
        
        if (!playlist) {
            console.error(`[MusicPlayer] Плейлист "${playlistName}" не найден`);
            return;
        }
        
        if (playlist.tracks.length === 0) {
            console.warn(`[MusicPlayer] Плейлист "${playlistName}" пуст`);
            return;
        }
        
        // Если уже играем этот плейлист, ничего не делаем
        if (this.currentPlaylistName === playlistName && this.isPlaying) {
            return;
        }
        
        console.log(`[MusicPlayer] Запуск плейлиста: ${playlistName}`);
        
        this.currentPlaylist = playlist;
        this.currentPlaylistName = playlistName;
        this.recentlyPlayed = [];
        
        // Выбираем первый трек
        const trackIndex = this._selectNextTrack();
        this._playTrack(trackIndex, fadeIn);
    }
    
    /**
     * Выбрать следующий трек
     * @returns {number} индекс трека
     */
    _selectNextTrack() {
        if (!this.currentPlaylist) return 0;
        
        const tracks = this.currentPlaylist.tracks;
        
        if (tracks.length === 1) {
            return 0;
        }
        
        // Если перемешивание включено
        if (this.currentPlaylist.shuffle) {
            // Доступные треки (исключая недавно проигранные)
            const availableIndices = [];
            for (let i = 0; i < tracks.length; i++) {
                if (!this.recentlyPlayed.includes(i)) {
                    availableIndices.push(i);
                }
            }
            
            // Если все треки были проиграны, очищаем историю
            if (availableIndices.length === 0) {
                this.recentlyPlayed = [];
                for (let i = 0; i < tracks.length; i++) {
                    if (i !== this.currentTrackIndex) {
                        availableIndices.push(i);
                    }
                }
            }
            
            // Случайный выбор из доступных
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            return availableIndices[randomIndex];
        }
        
        // Последовательное воспроизведение
        return (this.currentTrackIndex + 1) % tracks.length;
    }
    
    /**
     * Воспроизвести конкретный трек
     * @param {number} trackIndex - индекс трека
     * @param {boolean} fadeIn - плавное нарастание
     */
    _playTrack(trackIndex, fadeIn = true) {
        if (!this.currentPlaylist) return;
        
        const track = this.currentPlaylist.tracks[trackIndex];
        if (!track) {
            console.error(`[MusicPlayer] Трек с индексом ${trackIndex} не найден`);
            return;
        }
        
        console.log(`[MusicPlayer] Воспроизведение: ${track}`);
        
        // Добавляем текущий трек в историю
        if (this.currentTrackIndex >= 0) {
            this.recentlyPlayed.push(this.currentTrackIndex);
            // Ограничиваем размер истории
            while (this.recentlyPlayed.length > AUDIO_CONFIG.RECENT_TRACKS_COUNT) {
                this.recentlyPlayed.shift();
            }
        }
        
        this.currentTrackIndex = trackIndex;
        
        // Останавливаем текущий трек с затуханием
        if (this.isPlaying && fadeIn) {
            this._crossfadeToTrack(track);
        } else {
            this._loadAndPlay(track, fadeIn);
        }
    }
    
    /**
     * Загрузить и воспроизвести трек
     * @param {string} track - путь к треку
     * @param {boolean} fadeIn - плавное нарастание
     */
    _loadAndPlay(track, fadeIn = true) {
        const audio = this.currentAudio;
        
        // Формируем полный путь
        const fullPath = `${AUDIO_CONFIG.PATHS.MUSIC}/${track}`;
        
        // Устанавливаем источник
        audio.src = fullPath;
        
        // Начальная громкость
        const targetVolume = this.audioSystem.getMusicVolume();
        
        if (fadeIn) {
            audio.volume = 0;
            this._fadeIn(audio, targetVolume, AUDIO_CONFIG.FADE.IN_DURATION);
        } else {
            audio.volume = targetVolume;
        }
        
        // Воспроизводим
        audio.play().catch(e => {
            console.warn(`[MusicPlayer] Автовоспроизведение заблокировано:`, e);
        });
        
        this.isPlaying = true;
    }
    
    /**
     * Кроссфейд к новому треку
     * @param {string} track - путь к новому треку
     */
    _crossfadeToTrack(track) {
        if (this.isTransitioning) {
            this._stopCrossfade();
        }
        
        this.isTransitioning = true;
        
        const currentAudio = this.currentAudio;
        const nextAudio = this.nextAudio;
        
        // Формируем полный путь
        const fullPath = `${AUDIO_CONFIG.PATHS.MUSIC}/${track}`;
        
        // Загружаем новый трек
        nextAudio.src = fullPath;
        nextAudio.volume = 0;
        
        // Запускаем новый трек
        nextAudio.play().catch(e => {
            console.warn(`[MusicPlayer] Ошибка воспроизведения:`, e);
        });
        
        const targetVolume = this.audioSystem.getMusicVolume();
        const duration = AUDIO_CONFIG.CROSSFADE.DURATION;
        const interval = AUDIO_CONFIG.CROSSFADE.INTERVAL;
        const steps = duration / interval;
        const volumeStep = targetVolume / steps;
        
        let currentStep = 0;
        
        this.crossfadeTimer = setInterval(() => {
            currentStep++;
            
            // Затухание текущего
            currentAudio.volume = Math.max(0, targetVolume - volumeStep * currentStep);
            
            // Нарастание нового
            nextAudio.volume = Math.min(targetVolume, volumeStep * currentStep);
            
            if (currentStep >= steps) {
                this._stopCrossfade();
                
                // Переключаем индексы
                currentAudio.pause();
                currentAudio.currentTime = 0;
                this.currentAudioIndex = 1 - this.currentAudioIndex;
                
                this.isPlaying = true;
                this.isTransitioning = false;
            }
        }, interval);
    }
    
    /**
     * Остановить кроссфейд
     */
    _stopCrossfade() {
        if (this.crossfadeTimer) {
            clearInterval(this.crossfadeTimer);
            this.crossfadeTimer = null;
        }
    }
    
    /**
     * Плавное нарастание громкости
     * @param {HTMLAudioElement} audio - аудио элемент
     * @param {number} targetVolume - целевая громкость
     * @param {number} duration - длительность в мс
     */
    _fadeIn(audio, targetVolume, duration) {
        this._stopFade();
        
        const interval = AUDIO_CONFIG.CROSSFADE.INTERVAL;
        const steps = duration / interval;
        const volumeStep = targetVolume / steps;
        
        let currentStep = 0;
        
        this.fadeTimer = setInterval(() => {
            currentStep++;
            audio.volume = Math.min(targetVolume, volumeStep * currentStep);
            
            if (currentStep >= steps) {
                this._stopFade();
            }
        }, interval);
    }
    
    /**
     * Плавное затухание
     * @param {number} duration - длительность в мс
     * @param {Function} callback - callback после затухания
     */
    fadeOut(duration = AUDIO_CONFIG.FADE.OUT_DURATION, callback = null) {
        if (!this.isPlaying) {
            if (callback) callback();
            return;
        }
        
        this._stopFade();
        
        const audio = this.currentAudio;
        const startVolume = audio.volume;
        const interval = AUDIO_CONFIG.CROSSFADE.INTERVAL;
        const steps = duration / interval;
        const volumeStep = startVolume / steps;
        
        let currentStep = 0;
        
        this.fadeTimer = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, startVolume - volumeStep * currentStep);
            
            if (currentStep >= steps) {
                this._stopFade();
                this.pause();
                if (callback) callback();
            }
        }, interval);
    }
    
    /**
     * Остановить таймер затухания
     */
    _stopFade() {
        if (this.fadeTimer) {
            clearInterval(this.fadeTimer);
            this.fadeTimer = null;
        }
    }
    
    /**
     * Обработчик окончания трека
     * @param {number} audioIndex - индекс аудио элемента
     */
    _onTrackEnded(audioIndex) {
        // Игнорируем, если это не текущий активный аудио
        if (audioIndex !== this.currentAudioIndex) return;
        
        console.log(`[MusicPlayer] Трек закончился`);
        
        // Если плейлист зациклен
        if (this.currentPlaylist && this.currentPlaylist.loop) {
            const nextTrackIndex = this._selectNextTrack();
            this._playTrack(nextTrackIndex, true);
        } else {
            this.isPlaying = false;
        }
    }
    
    /**
     * Пауза воспроизведения
     */
    pause() {
        this.currentAudio.pause();
        this.isPlaying = false;
    }
    
    /**
     * Возобновление воспроизведения
     */
    resume() {
        if (this.currentAudio.src) {
            this.currentAudio.play();
            this.isPlaying = true;
        }
    }
    
    /**
     * Полная остановка
     */
    stop() {
        this._stopCrossfade();
        this._stopFade();
        
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0;
        });
        
        this.isPlaying = false;
        this.isTransitioning = false;
        this.currentPlaylist = null;
        this.currentPlaylistName = null;
        this.currentTrackIndex = -1;
    }
    
    /**
     * Установить громкость
     * @param {number} volume - громкость (0.0 - 1.0)
     */
    setVolume(volume) {
        if (this.isPlaying && !this.isTransitioning) {
            this.currentAudio.volume = volume;
        }
    }
    
    /**
     * Получить название текущего трека
     * @returns {string|null}
     */
    getCurrentTrackName() {
        if (!this.currentPlaylist || this.currentTrackIndex < 0) return null;
        return this.currentPlaylist.tracks[this.currentTrackIndex];
    }
}

// ============================================
// КЛАСС SFX MANAGER
// ============================================

/**
 * SFXManager - управление звуковыми эффектами
 * Заготовка для будущего расширения
 */
class SFXManager {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;

        // Пул аудио элементов для одновременного воспроизведения
        this.audioPool = [];
        this.poolSize = 10;

        // Кэш загруженных звуков
        this.soundCache = new Map();

        // Web Audio API для синтезированных звуков
        this.audioContext = null;

        // Инициализация пула
        this._initPool();
    }

    /**
     * Инициализация Web Audio API
     */
    _initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * Синтезировать звук смерти (мрачный низкочастотный звук)
     */
    playDeathSound() {
        const ctx = this._initAudioContext();
        if (!ctx) return;

        const masterVolume = this.audioSystem.getSFXVolume();
        const now = ctx.currentTime;

        // Создаём несколько осцилляторов для мрачного звука
        const frequencies = [150, 100, 80]; // Низкие частоты
        
        frequencies.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // Используем пилообразную волну для более агрессивного звука
            oscillator.type = index === 0 ? 'sawtooth' : 'square';
            oscillator.frequency.setValueAtTime(freq, now);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 1.5);
            
            // Настройка громкости
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3 / (index + 1), now + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2);
            
            // Добавляем фильтр для мрачности
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 1.5);
            
            // Подключаем
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Запускаем
            oscillator.start(now);
            oscillator.stop(now + 2);
        });

        // Добавляем шум для атмосферы
        this._addDeathNoise(now, masterVolume);
    }

    /**
     * Добавить шум для звука смерти
     */
    _addDeathNoise(startTime, masterVolume) {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Генерируем коричневый шум (более мрачный)
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15 * masterVolume, startTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 2);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, startTime);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start(startTime);
        noise.stop(startTime + 2);
    }

    /**
     * Инициализация пула аудио элементов
     */
    _initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            this.audioPool.push({
                audio: audio,
                inUse: false
            });
        }
    }
    
    /**
     * Получить свободный аудио элемент из пула
     * @returns {Object|null}
     */
    _getFreeAudio() {
        for (const item of this.audioPool) {
            if (!item.inUse) {
                return item;
            }
        }
        return null;
    }
    
    /**
     * Воспроизвести звук
     * @param {string} soundPath - путь к звуку (относительно SFX папки)
     * @param {string} category - категория звука (combat, skills, ambient, dialogue, ui)
     * @param {Object} options - дополнительные опции
     */
    play(soundPath, category = 'sfx', options = {}) {
        const fullPath = `${AUDIO_CONFIG.PATHS.SFX}/${soundPath}`;
        
        const poolItem = this._getFreeAudio();
        if (!poolItem) {
            console.warn(`[SFXManager] Пул аудио переполнен`);
            return null;
        }
        
        const audio = poolItem.audio;
        audio.src = fullPath;
        
        // Громкость с учетом категории и мастера
        const categoryVolume = SFX_CATEGORIES[category]?.volume || 1.0;
        const masterVolume = this.audioSystem.getSFXVolume();
        audio.volume = (options.volume || 1.0) * categoryVolume * masterVolume;
        
        // Зацикливание
        audio.loop = options.loop || false;
        
        // Воспроизведение
        poolItem.inUse = true;
        audio.play().catch(e => {
            console.warn(`[SFXManager] Ошибка воспроизведения:`, e);
            poolItem.inUse = false;
        });
        
        // Освобождение после окончания
        audio.onended = () => {
            poolItem.inUse = false;
            if (options.onEnd) options.onEnd();
        };
        
        return audio;
    }
    
    /**
     * Остановить все звуки категории
     * @param {string} category - категория
     */
    stopCategory(category) {
        // Будущая реализация для остановки звуков по категории
    }
    
    /**
     * Остановить все звуки
     */
    stopAll() {
        this.audioPool.forEach(item => {
            item.audio.pause();
            item.audio.currentTime = 0;
            item.inUse = false;
        });
    }
    
    /**
     * Установить громкость
     * @param {number} volume - громкость (0.0 - 1.0)
     */
    setVolume(volume) {
        // Обновляем громкость всех активных звуков
        this.audioPool.forEach(item => {
            if (item.inUse) {
                item.audio.volume = volume;
            }
        });
    }
}

// ============================================
// КЛАСС AUDIO SYSTEM
// ============================================

/**
 * AudioSystem - главный класс управления аудио
 */
class AudioSystem {
    constructor() {
        // Уровни громкости
        this.masterVolume = AUDIO_CONFIG.VOLUME.MASTER;
        this.musicVolume = AUDIO_CONFIG.VOLUME.MUSIC;
        this.sfxVolume = AUDIO_CONFIG.VOLUME.SFX;
        this.dialogueVolume = AUDIO_CONFIG.VOLUME.DIALOGUE;
        
        // Состояние звука (вкл/выкл)
        this.muted = false;
        
        // Подсистемы
        this.musicPlayer = new MusicPlayer(this);
        this.sfxManager = new SFXManager(this);
        
        // Загружаем настройки
        this._loadSettings();
        
        console.log(`[AudioSystem] Инициализирован`);
    }
    
    /**
     * Загрузка настроек из localStorage
     */
    _loadSettings() {
        try {
            const saved = localStorage.getItem('audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.masterVolume = settings.masterVolume ?? this.masterVolume;
                this.musicVolume = settings.musicVolume ?? this.musicVolume;
                this.sfxVolume = settings.sfxVolume ?? this.sfxVolume;
                this.dialogueVolume = settings.dialogueVolume ?? this.dialogueVolume;
                this.muted = settings.muted ?? this.muted;
            }
        } catch (e) {
            console.warn(`[AudioSystem] Ошибка загрузки настроек:`, e);
        }
    }
    
    /**
     * Сохранение настроек в localStorage
     */
    _saveSettings() {
        try {
            const settings = {
                masterVolume: this.masterVolume,
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume,
                dialogueVolume: this.dialogueVolume,
                muted: this.muted
            };
            localStorage.setItem('audioSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn(`[AudioSystem] Ошибка сохранения настроек:`, e);
        }
    }
    
    // ============================================
    // УПРАВЛЕНИЕ ГРОМКОСТЬЮ
    // ============================================
    
    /**
     * Получить итоговую громкость музыки
     * @returns {number}
     */
    getMusicVolume() {
        if (this.muted) return 0;
        return this.masterVolume * this.musicVolume;
    }
    
    /**
     * Получить итоговую громкость SFX
     * @returns {number}
     */
    getSFXVolume() {
        if (this.muted) return 0;
        return this.masterVolume * this.sfxVolume;
    }
    
    /**
     * Получить итоговую громкость диалогов
     * @returns {number}
     */
    getDialogueVolume() {
        if (this.muted) return 0;
        return this.masterVolume * this.dialogueVolume;
    }
    
    /**
     * Установить мастер-громкость
     * @param {number} volume - громкость (0.0 - 1.0)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this._updateAllVolumes();
        this._saveSettings();
    }
    
    /**
     * Установить громкость музыки
     * @param {number} volume - громкость (0.0 - 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.musicPlayer.setVolume(this.getMusicVolume());
        this._saveSettings();
    }
    
    /**
     * Установить громкость SFX
     * @param {number} volume - громкость (0.0 - 1.0)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this._saveSettings();
    }
    
    /**
     * Установить громкость диалогов
     * @param {number} volume - громкость (0.0 - 1.0)
     */
    setDialogueVolume(volume) {
        this.dialogueVolume = Math.max(0, Math.min(1, volume));
        this._saveSettings();
    }
    
    /**
     * Обновить все громкости
     */
    _updateAllVolumes() {
        this.musicPlayer.setVolume(this.getMusicVolume());
        this.sfxManager.setVolume(this.getSFXVolume());
    }
    
    /**
     * Включить/выключить звук
     */
    toggleMute() {
        this.muted = !this.muted;
        this._updateAllVolumes();
        this._saveSettings();
        return this.muted;
    }
    
    // ============================================
    // УПРАВЛЕНИЕ МУЗЫКОЙ
    // ============================================
    
    /**
     * Воспроизвести музыку для состояния
     * @param {string} state - состояние (mainMenu, openworld, combat, dungeon, boss)
     * @param {boolean} fadeIn - плавное нарастание
     */
    playMusic(state, fadeIn = true) {
        console.log(`[AudioSystem] Запрос музыки: ${state}`);
        this.musicPlayer.playPlaylist(state, fadeIn);
    }
    
    /**
     * Плавное затухание музыки
     * @param {number} duration - длительность в мс
     * @param {Function} callback - callback после затухания
     */
    fadeOutMusic(duration, callback) {
        console.log(`[AudioSystem] Затухание музыки`);
        this.musicPlayer.fadeOut(duration, callback);
    }
    
    /**
     * Остановить музыку
     */
    stopMusic() {
        this.musicPlayer.stop();
    }
    
    /**
     * Пауза музыки
     */
    pauseMusic() {
        this.musicPlayer.pause();
    }
    
    /**
     * Возобновить музыку
     */
    resumeMusic() {
        this.musicPlayer.resume();
    }
    
    // ============================================
    // УПРАВЛЕНИЕ ЗВУКОВЫМИ ЭФФЕКТАМИ
    // ============================================

    /**
     * Воспроизвести звуковой эффект
     * @param {string} soundPath - путь к звуку
     * @param {string} category - категория (combat, skills, ambient, dialogue, ui)
     * @param {Object} options - опции
     */
    playSFX(soundPath, category = 'sfx', options = {}) {
        return this.sfxManager.play(soundPath, category, options);
    }

    /**
     * Воспроизвести звук смерти (синтезированный)
     */
    playDeathSound() {
        console.log(`[AudioSystem] Воспроизведение звука смерти`);
        this.sfxManager.playDeathSound();
    }

    /**
     * Остановить все звуковые эффекты
     */
    stopAllSFX() {
        this.sfxManager.stopAll();
    }
    
    // ============================================
    // СПЕЦИАЛЬНЫЕ МЕТОДЫ
    // ============================================
    
    /**
     * Переход между игровыми состояниями
     * @param {string} fromState - текущее состояние
     * @param {string} toState - новое состояние
     */
    transitionTo(fromState, toState) {
        console.log(`[AudioSystem] Переход: ${fromState} -> ${toState}`);
        
        // Затухание текущей музыки
        this.fadeOutMusic(AUDIO_CONFIG.FADE.OUT_DURATION, () => {
            // Запуск новой музыки
            this.playMusic(toState, true);
        });
    }
    
    /**
     * Полная остановка всех звуков
     */
    stopAll() {
        this.musicPlayer.stop();
        this.sfxManager.stopAll();
    }
}

// ============================================
// ЭКСПОРТ
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioSystem, MusicPlayer, SFXManager, AUDIO_CONFIG, MUSIC_PLAYLISTS, SFX_CATEGORIES };
} else if (typeof window !== 'undefined') {
    window.AudioSystem = AudioSystem;
    window.MusicPlayer = MusicPlayer;
    window.SFXManager = SFXManager;
    window.AUDIO_CONFIG = AUDIO_CONFIG;
    window.MUSIC_PLAYLISTS = MUSIC_PLAYLISTS;
    window.SFX_CATEGORIES = SFX_CATEGORIES;
}