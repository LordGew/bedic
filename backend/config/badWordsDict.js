/**
 * Diccionario de palabras prohibidas por nivel de severidad
 * Enfoque en lenguaje latinoamericano
 */

const badWordsDict = {
  es: {
    LEVE: [
      'tonto', 'tontos', 'tonta', 'tontas',
      'bobo', 'bobos', 'boba', 'bobas',
      'pendejo', 'pendejos', 'pendeja', 'pendejas',
      'boludo', 'boludos', 'boluda', 'boludas',
      'chamaco', 'chamacos', 'chamaca', 'chamacas',
      'patán', 'patanes',
      'tarado', 'tarados', 'tarada', 'taradas',
      'imbécil', 'imbéciles',
      'estúpido', 'estúpidos', 'estúpida', 'estúpidas',
      'idiota', 'idiotas',
      'basura', 'basuras',
      'porquería', 'porquerías',
      'desastre', 'desastres'
    ],
    MODERADO: [
      'puta', 'putas', 'puto', 'putos',
      'mierda', 'mierdas',
      'coño', 'coños',
      'cabrón', 'cabrones', 'cabrona', 'cabronas',
      'verga', 'vergas',
      'chingar', 'chingada', 'chingadas', 'chingado', 'chingados',
      'joder', 'jodida', 'jodidas', 'jodido', 'jodidos',
      'maldito', 'malditos', 'maldita', 'malditas',
      'condenado', 'condenados', 'condenada', 'condenadas',
      'hijo de puta', 'hijos de puta',
      'hijueputa', 'hijueputas',
      'gonorrea', 'gonorreas',
      'malparido', 'malparidos', 'malparida', 'malparidas',
      'desgraciado', 'desgraciados', 'desgraciada', 'desgraciadas',
      'canalla', 'canallas',
      'sinvergüenza', 'sinvergüenzas',
      'cretino', 'cretinos', 'cretina', 'cretinas',
      'imbécil', 'imbéciles',
      'cojudo', 'cojudos', 'cojuda', 'cojudas',
      'pelotudo', 'pelotudos', 'pelotuda', 'pelotudas'
    ],
    SEVERO: [
      'marica', 'maricas',
      'puto', 'putos', 'puta', 'putas', // repetido pero en contexto ofensivo
      'negro', 'negros', 'negra', 'negras', // cuando se usa como insulto
      'indio', 'indios', 'india', 'indias', // cuando se usa como insulto
      'suicidate', 'suicidarse', 'suicidio',
      'muérete', 'muéranse',
      'vete al infierno', 'vayan al infierno',
      'terrorista', 'terroristas',
      'violador', 'violadores', 'violadora', 'violadoras',
      'pedófilo', 'pedófilos', 'pedófila', 'pedófilas',
      'asesino', 'asesinos', 'asesina', 'asesinas',
      'nazi', 'nazis',
      'racista', 'racistas',
      'xenófobo', 'xenófobos', 'xenófoba', 'xenófobas',
      'homófobo', 'homófobos', 'homófoba', 'homófobas'
    ]
  },
  en: {
    LEVE: [
      'stupid', 'stupids',
      'idiot', 'idiots',
      'dumb', 'dumbs',
      'fool', 'fools',
      'trash', 'trashes',
      'garbage', 'garbages',
      'loser', 'losers',
      'jerk', 'jerks',
      'moron', 'morons',
      'cretin', 'cretins',
      'twit', 'twits',
      'nincompoop', 'nincompoops'
    ],
    MODERADO: [
      'fuck', 'fucks', 'fucking', 'fucked',
      'shit', 'shits', 'shitty',
      'bitch', 'bitches', 'bitchy',
      'asshole', 'assholes',
      'bastard', 'bastards',
      'damn', 'damned', 'dammit',
      'crap', 'crappy',
      'dick', 'dicks',
      'pussy', 'pussies',
      'cock', 'cocks',
      'slut', 'sluts',
      'whore', 'whores',
      'ass', 'asses',
      'hell', 'hells',
      'piss', 'pisses', 'pissed',
      'cunt', 'cunts'
    ],
    SEVERO: [
      'nigger', 'niggers', 'nigga', 'niggas',
      'faggot', 'faggots', 'fag', 'fags',
      'retard', 'retards', 'retarded',
      'kill yourself', 'kys',
      'go to hell',
      'terrorist', 'terrorists',
      'rapist', 'rapists',
      'pedophile', 'pedophiles',
      'murderer', 'murderers',
      'nazi', 'nazis',
      'racist', 'racists',
      'xenophobe', 'xenophobes',
      'homophobe', 'homophobes'
    ]
  }
};

module.exports = badWordsDict;
