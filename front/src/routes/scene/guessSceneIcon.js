import normalizeSearchText from '../../utils/normalizeSearchText';

// The icon of a scene created from its name alone (docs/specs/scene-editor-mobile.md, D.4): the
// first rule whose keyword appears in the name wins. Keywords are compared without accents nor
// case, in the four languages of the interface. Every icon is a name of server/config/icons.json.
const RULES = [
  { icon: 'moon', keywords: ['night', 'nuit', 'nacht', 'noche', 'sleep', 'dormir', 'schlaf', 'coucher', 'bedtime'] },
  {
    icon: 'sunrise',
    keywords: [
      'morning',
      'matin',
      'morgen',
      'manana',
      'wake',
      'reveil',
      'aufwach',
      'despert',
      'bonjour',
      'good morning'
    ]
  },
  { icon: 'log-out', keywords: ['leav', 'depart', 'partir', 'away', 'absence', 'abwesen', 'salida', 'verlassen'] },
  { icon: 'droplet', keywords: ['water', 'eau', 'wasser', 'agua', 'leak', 'fuite', 'leck', 'fuga', 'arros'] },
  { icon: 'sun', keywords: ['solar', 'solaire', 'soleil', 'sonne', 'sol '] },
  { icon: 'film', keywords: ['movie', 'film', 'cine', 'kino', 'pelicula', 'tv', 'tele'] },
  { icon: 'shield', keywords: ['alarm', 'securit', 'sicherheit', 'segurid', 'intrus'] },
  { icon: 'home', keywords: ['home', 'maison', 'haus', 'casa', 'back', 'retour', 'arriv', 'llegada', 'zuhause'] },
  { icon: 'thermometer', keywords: ['heat', 'chauff', 'heiz', 'calefac', 'temperat', 'thermo'] },
  { icon: 'music', keywords: ['music', 'musique', 'musik', 'musica', 'radio'] },
  { icon: 'bell', keywords: ['notif', 'remind', 'rappel', 'erinner', 'recordat', 'bell', 'sonnette'] },
  { icon: 'zap', keywords: ['light', 'lumiere', 'lampe', 'licht', 'luz', 'lamp'] }
];

const DEFAULT_ICON = 'zap';

const guessSceneIcon = name => {
  const normalized = ` ${normalizeSearchText(name || '')} `;
  const rule = RULES.find(({ keywords }) => keywords.some(keyword => normalized.includes(keyword)));
  return rule ? rule.icon : DEFAULT_ICON;
};

export default guessSceneIcon;
