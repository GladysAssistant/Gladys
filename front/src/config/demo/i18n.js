import { demoLanguage } from './helpers';

/**
 * French of everything the demo house says.
 *
 * The fixtures are written in English — they read like the house of an English
 * speaking user — and this table is what a French visitor sees instead: room
 * and device names on the devices, activity and settings pages, widget labels
 * on the dashboards, scene and calendar names, the texts the scenes send. The
 * interface itself is already translated by the front (`get /api/v1/me`
 * answers the language of the browser); without this table the French demo was
 * a French interface full of English data.
 *
 * A string absent from this table is left untouched, which is the rule for
 * everything that is not a sentence a human wrote: hardware and product names
 * (ConBee II, ZBDongle-E, Sonos Play), identifiers, selectors, units.
 */
const FRENCH = {
  // --- House, rooms ------------------------------------------------------
  Home: 'Maison',
  'Living room': 'Salon',
  'Living Room': 'Salon',
  Kitchen: 'Cuisine',
  Bedroom: 'Chambre',
  'Kids room': 'Chambre des enfants',
  Bathroom: 'Salle de bain',
  Office: 'Bureau',
  Garage: 'Garage',
  Garden: 'Jardin',
  'Technical room': 'Local technique',
  Outside: 'Extérieur',

  // --- Devices -----------------------------------------------------------
  'Ceiling light': 'Plafonnier',
  'TV backlight': 'Rétroéclairage TV',
  Television: 'Télévision',
  'Air conditioning': 'Climatisation',
  Shutter: 'Volet',
  'Living room sensor': 'Capteur du salon',
  'Kitchen spots': 'Spots de la cuisine',
  'Coffee machine': 'Machine à café',
  Dishwasher: 'Lave-vaisselle',
  'Kitchen sensor': 'Capteur de la cuisine',
  'Kitchen window': 'Fenêtre de la cuisine',
  'Under the sink': "Sous l'évier",
  'Bedside lamps': 'Lampes de chevet',
  Thermostat: 'Thermostat',
  'Bedroom shutter': 'Volet de la chambre',
  'Bedroom sensor': 'Capteur de la chambre',
  'Kids room light': 'Lumière de la chambre des enfants',
  'Kids room sensor': 'Capteur de la chambre des enfants',
  'Water heater': 'Chauffe-eau',
  'Hot water available': 'Eau chaude disponible',
  'Towel rail': 'Sèche-serviettes',
  'Bathroom sensor': 'Capteur de la salle de bain',
  'Desk lamp': 'Lampe de bureau',
  'Desk plug': 'Prise du bureau',
  'Presence sensor': 'Capteur de présence',
  'Office sensor': 'Capteur du bureau',
  'Garage door': 'Porte du garage',
  Wallbox: 'Borne de recharge',
  'Garden camera': 'Caméra du jardin',
  'Weather station': 'Station météo',
  'Garden lights': 'Éclairage du jardin',
  Watering: 'Arrosage',
  'Electric meter': 'Compteur électrique',
  'Solar inverter': 'Onduleur solaire',
  'Solar Inverter': 'Onduleur solaire',
  'Home battery': 'Batterie de la maison',

  // --- Features ----------------------------------------------------------
  Brightness: 'Luminosité',
  Color: 'Couleur',
  'Color temperature': 'Température de couleur',
  Temperature: 'Température',
  Humidity: 'Humidité',
  Pressure: 'Pression',
  Motion: 'Mouvement',
  Presence: 'Présence',
  Luminosity: 'Luminosité',
  Battery: 'Batterie',
  'Battery level': 'Niveau de batterie',
  Power: 'Puissance',
  'Current power': 'Puissance instantanée',
  'Charging power': 'Puissance de charge',
  Charging: 'Recharge',
  'Meter index': 'Index du compteur',
  'Consumption today': 'Consommation du jour',
  'Production today': 'Production du jour',
  'Solar production': 'Production solaire',
  'Water leak': "Fuite d'eau",
  'Air quality': "Qualité de l'air",
  'Air quality index': "Indice de qualité de l'air",
  'Outdoor temperature': 'Température extérieure',
  'Outdoor humidity': 'Humidité extérieure',
  Setpoint: 'Consigne',
  Position: 'Position',
  Mode: 'Mode',
  Volume: 'Volume',
  Play: 'Lecture',
  Pause: 'Pause',
  Previous: 'Précédent',
  Next: 'Suivant',
  'Playback state': 'État de lecture',
  Window: 'Fenêtre',
  'Hot water': 'Eau chaude',

  // --- Dashboards --------------------------------------------------------
  Energy: 'Énergie',
  Comfort: 'Confort',
  'My house': 'Ma maison',
  'Quick actions': 'Actions rapides',
  Scenes: 'Scènes',
  Open: 'Ouvrir',
  Close: 'Fermer',
  Solar: 'Solaire',
  Producing: 'Production',
  Consuming: 'Consommation',
  'Produced today': "Produit aujourd'hui",
  'Consumed today': "Consommé aujourd'hui",
  'Electricity consumption': 'Consommation électrique',
  'Production and consumption': 'Production et consommation',
  'Home consumption': 'Consommation de la maison',
  'Grid power': 'Puissance réseau',
  'Solar power': 'Puissance solaire',
  Car: 'Voiture',
  'Car charging': 'Recharge de la voiture',
  Temperatures: 'Températures',
  'Gladys documentation': 'Documentation Gladys',

  // --- Scenes ------------------------------------------------------------
  'Good morning': 'Bonjour',
  'Opens the shutters, turns the kitchen on and starts the coffee machine.':
    'Ouvre les volets, allume la cuisine et lance la machine à café.',
  'Good morning! Coffee is ready ☕': 'Bonjour ! Le café est prêt ☕',
  'Movie night': 'Soirée cinéma',
  'Dims the living room and closes the shutters when the TV turns on.':
    "Tamise le salon et ferme les volets quand la télévision s'allume.",
  'Leaving home': 'Départ de la maison',
  'Turns everything off and arms the alarm once the house is empty.':
    "Éteint tout et arme l'alarme une fois la maison vide.",
  'Good night': 'Bonne nuit',
  'Closes the shutters, turns the lights off and lowers the heating.':
    'Ferme les volets, éteint les lumières et baisse le chauffage.',
  'Water leak alert': "Alerte fuite d'eau",
  'Warns everyone as soon as the sensor under the sink detects water.':
    "Prévient tout le monde dès que le capteur sous l'évier détecte de l'eau.",
  '🚨 Water leak detected in the kitchen!': "🚨 Fuite d'eau détectée dans la cuisine !",
  'Charge the car with the sun': 'Recharger la voiture au soleil',
  'Starts charging the car when solar production covers it.':
    'Lance la recharge de la voiture quand la production solaire la couvre.',
  'The car is now charging on solar production ☀️': 'La voiture se recharge sur la production solaire ☀️',
  Security: 'Sécurité',

  // --- Chat --------------------------------------------------------------
  'What is the temperature in the living room?': 'Quelle température fait-il dans le salon ?',
  'It is 21.4°C in the living room.': 'Il fait 21,4°C dans le salon.',
  'Turn on the kitchen light': 'Allume la lumière de la cuisine',
  'The kitchen light is on.': 'La lumière de la cuisine est allumée.',
  'How much electricity did we use today?': "Combien d'électricité avons-nous consommée aujourd'hui ?",
  'You used 9.4 kWh today, and your solar panels produced 14.6 kWh.':
    "Vous avez consommé 9,4 kWh aujourd'hui, et vos panneaux solaires ont produit 14,6 kWh.",
  'What is the weather like tomorrow?': 'Quel temps fera-t-il demain ?',
  'Tomorrow will be mostly sunny, between 14°C and 24°C.': 'Demain sera plutôt ensoleillé, entre 14°C et 24°C.',

  // --- Calendar ----------------------------------------------------------
  Family: 'Famille',
  Work: 'Travail',
  'Yoga class': 'Cours de yoga',
  'Team meeting': "Réunion d'équipe",
  Dentist: 'Dentiste',
  'Dinner with Pepper': 'Dîner avec Pepper',
  'Sprint review': 'Revue de sprint',
  'Swimming pool': 'Piscine',

  // --- Community integration ---------------------------------------------
  'Reads the production of your solar inverter.': 'Lit la production de votre onduleur solaire.',

  // --- Integration pages (discovered devices, remotes) --------------------
  'Temperature sensor': 'Capteur de température',
  'Pressure Sensor': 'Capteur de pression',
  'Aqara Sensor': 'Capteur Aqara',
  'Fibaro Motion Sensor': 'Capteur de mouvement Fibaro',
  'Unsupported device': 'Appareil non pris en charge',
  'New device': 'Nouvel appareil',
  'Random MAC device': 'Appareil à MAC aléatoire',
  'BLE Device 1': 'Appareil BLE 1',
  'Media server': 'Serveur multimédia',
  Custom: 'Personnalisé',
  Switch: 'Interrupteur',
  'Switch 1': 'Interrupteur 1',
  'Switch 2': 'Interrupteur 2',
  'Switch 1 On/Off': 'Interrupteur 1 marche/arrêt',
  'Switch 2 On/Off': 'Interrupteur 2 marche/arrêt',
  'On/Off': 'Marche/Arrêt',
  'Power ON': 'Allumer',
  'TV Remote': 'Télécommande TV',
  'LED remote': 'Télécommande LED',
  Source: 'Source',
  Channel: 'Chaîne',
  Voltage: 'Tension',
  'New Lamp': 'Nouvelle lampe',
  'Living room lamp': 'Lampe du salon',
  'Plug Coffee Machine': 'Prise machine à café',
  'Light Swimming Pool': 'Lumière de la piscine',
  'Plug TV Dock': 'Prise du dock TV',
  'Light Bedroom': 'Lumière de la chambre',
  'Sonos Speaker': 'Enceinte Sonos',
  'Xiaomi Temperature': 'Température Xiaomi',
  'Peanut temperature': 'Température Peanut',
  'Sonoff Basic Kitchen': 'Sonoff Basic cuisine',
  'Sonoff Pow Kitchen': 'Sonoff Pow cuisine',
  'Sonoff Mini Outside': 'Sonoff Mini extérieur'
};

/** The French of one text, or the text itself when it has none. */
const t = text => (typeof text === 'string' && demoLanguage() === 'fr' ? FRENCH[text] || text : text);

// Object keys whose value is a text the interface displays. Everything else is
// left alone, so a selector, an external id or a Docker image never goes
// through the table even if it happens to look like a sentence.
const TRANSLATED_KEYS = ['name', 'title', 'label', 'description', 'text'];
const TRANSLATED_LIST_KEYS = ['device_feature_names'];

/**
 * Walks a fixture and translates, in place, every text the interface displays.
 * In place, because the demo derives its routes from a handful of shared
 * objects (the house is read both by the route map and by the functions that
 * generate the history): translating a copy would leave half the demo in
 * English.
 *
 * @param {*} value - Fixture to translate (object, array, or anything else).
 * @returns {*} The same value, translated.
 * @example
 * translate({ name: 'Living room' }); // { name: 'Salon' }
 */
const translate = value => {
  if (Array.isArray(value)) {
    value.forEach(translate);
    return value;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  Object.keys(value).forEach(key => {
    const child = value[key];
    if (TRANSLATED_KEYS.includes(key) && typeof child === 'string') {
      value[key] = t(child);
    } else if (TRANSLATED_LIST_KEYS.includes(key) && Array.isArray(child)) {
      value[key] = child.map(t);
    } else if (child && typeof child === 'object') {
      translate(child);
    }
  });
  return value;
};

export { t, translate, FRENCH };
