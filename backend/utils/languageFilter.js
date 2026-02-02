// Lightweight in-project profanity filter to avoid optional ESM/CJS issues
// Provides minimal API used by the app: addWords, isProfane(text), clean(text)
const defaultWords = [
    // Spanish examples (expand as needed)
    'mierda', 'joder', 'puta', 'puto', 'cabron', 'pendejo', 'gilipollas',
    'subnormal', 'imbecil', 'maricon', 'concha', 'coño', 'chinga', 'verga',
    'culero', 'pito', 'capullo',
    // adicionales para BEDIC
    'negro', 'negra', 'negros', 'negras',
    'gay', 'gays', 'hp', 'hps'
];

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class SimpleFilter {
    constructor(words = []) {
        this.words = new Set();
        this.addWords(...words);
    }

    addWords(...words) {
        for (const w of words) {
            if (typeof w === 'string' && w.trim()) {
                this.words.add(w.toLowerCase());
            }
        }
    }

    isProfane(text) {
        if (!text || typeof text !== 'string') return false;
        const lower = text.toLowerCase();
        for (const w of this.words) {
            const re = new RegExp('\\b' + escapeRegExp(w) + '\\b', 'i');
            if (re.test(lower)) return true;
        }
        return false;
    }

    clean(text) {
        if (!text || typeof text !== 'string') return text;
        let out = text;
        for (const w of this.words) {
            const re = new RegExp('\\b' + escapeRegExp(w) + '\\b', 'ig');
            out = out.replace(re, (match) => '*'.repeat(match.length));
        }
        return out;
    }
}

// instantiate with defaults
const filter = new SimpleFilter(defaultWords);

/**
 * Middleware para filtrar lenguaje ofensivo en campos de texto (ej. reportes, comentarios).
 * Reemplaza palabras ofensivas con asteriscos (***).
 * @param {string[]} fields - Array de nombres de campos en req.body a filtrar (ej. ['description', 'comment']).
 */
const filterLanguage = (fields) => (req, res, next) => {
    if (!req.body) {
        return next();
    }

    for (const field of fields) {
        const text = req.body[field];

        // Verificar que el texto existe y es un string
        if (text && typeof text === 'string' && filter.isProfane(text)) {
            // Limpia el texto reemplazando las palabras ofensivas
            req.body[field] = filter.clean(text);
        }
    }
    
    // Continúa con el siguiente middleware (o el controlador 'createReport')
    next();
};

// 3. Exportar la función
module.exports = filterLanguage;