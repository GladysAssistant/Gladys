import normalizeSearchText from '../../utils/normalizeSearchText';

// The icon of a scene created from its name alone (docs/specs/scene-editor-mobile.md, D.4): the
// first rule with a keyword matching one of the words of the name wins. Words are compared without
// accents nor case, in the four languages of the interface. A keyword matches a whole word; a
// keyword ending with "*" is a stem and matches the words starting with it ("leav*": leave,
// leaving). Every icon is a name of server/config/icons.json.
const RULES = [
  { icon: 'moon', keywords: ['night', 'nuit', 'nacht', 'noche', 'sleep*', 'dormir', 'schlaf*', 'coucher', 'bedtime'] },
  {
    icon: 'sunrise',
    keywords: ['morning', 'matin', 'morgen', 'manana', 'wake', 'reveil*', 'aufwach*', 'despert*', 'bonjour']
  },
  { icon: 'log-out', keywords: ['leav*', 'depart*', 'partir', 'away', 'absence', 'abwesen*', 'salida', 'verlassen'] },
  { icon: 'droplet', keywords: ['water', 'eau', 'wasser', 'agua', 'leak*', 'fuite', 'leck', 'fuga', 'arros*'] },
  {
    icon: 'bell',
    keywords: ['notif*', 'remind*', 'rappel*', 'erinner*', 'recordat*', 'bell', 'sonnette', 'klingel*', 'timbre']
  },
  { icon: 'sun', keywords: ['solar', 'solaire', 'soleil', 'sonne', 'sol', 'sun'] },
  { icon: 'film', keywords: ['movie*', 'film*', 'cinema', 'cine', 'kino', 'pelicula*', 'tv', 'tele', 'television'] },
  { icon: 'shield', keywords: ['alarm*', 'securit*', 'sicherheit', 'segurid*', 'intrus*'] },
  { icon: 'home', keywords: ['home', 'maison', 'haus', 'casa', 'back', 'retour', 'arriv*', 'llegada', 'zuhause'] },
  { icon: 'thermometer', keywords: ['heat*', 'chauff*', 'heiz*', 'calefac*', 'temperat*', 'thermo*'] },
  { icon: 'music', keywords: ['music*', 'musique', 'musik', 'musica', 'radio'] },
  { icon: 'zap', keywords: ['light*', 'lumiere*', 'lampe*', 'licht', 'luz', 'lamp*'] }
];

const DEFAULT_ICON = 'zap';

const matches = (word, keyword) => (keyword.endsWith('*') ? word.startsWith(keyword.slice(0, -1)) : word === keyword);

const guessSceneIcon = name => {
  const words = normalizeSearchText(name || '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const rule = RULES.find(({ keywords }) => keywords.some(keyword => words.some(word => matches(word, keyword))));
  return rule ? rule.icon : DEFAULT_ICON;
};

export default guessSceneIcon;
