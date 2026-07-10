const forecastData = {
  position: {
    lat: 46.75,
    lon: 4.35,
    alti: 304,
    name: 'Charmoy',
    country: 'FR - France',
    dept: '71',
    timezone: 'Europe/Paris',
  },
  updated_on: 1783112400,
  forecast: [
    {
      dt: 1783112400,
      T: { value: 21.4, windchill: 21.1 },
      humidity: 35,
      sea_level: 1026.4,
      wind: { speed: 2, gust: 0, direction: 360, icon: 'N' },
      rain: { '1h': 0 },
      snow: { '1h': 0 },
      clouds: 10,
      weather: { icon: 'p1n', desc: 'Ciel clair' },
    },
  ],
  daily_forecast: [
    {
      dt: 1783036800,
      T: { min: 19.1, max: 29.7 },
      humidity: { min: 25, max: 75 },
      precipitation: { '24h': 0 },
      uv: 8,
      weather12H: { icon: 'p1j', desc: 'Ciel clair' },
      sun: { rise: 1783050812, set: 1783107588 },
    },
  ],
  probability_forecast: [],
};

const warningDataGreen = {
  update_time: 1783137609,
  domain_id: '71',
  color_max: 1,
  phenomenons_items: [
    { phenomenon_id: '1', phenomenon_max_color_id: 1 },
    { phenomenon_id: '3', phenomenon_max_color_id: 1 },
  ],
  text: null,
  text_avalanche: null,
};

const warningDataOrange = {
  update_time: 1783137609,
  domain_id: '71',
  color_max: 3,
  phenomenons_items: [
    { phenomenon_id: '3', phenomenon_max_color_id: 3 },
    { phenomenon_id: '6', phenomenon_max_color_id: 2 },
    { phenomenon_id: '1', phenomenon_max_color_id: 1 },
  ],
  text: {
    bloc_items: [
      {
        text_items: [
          {
            term_items: [
              {
                subdivided_text: [{ text: ['Orages violents attendus en soirée.'] }],
              },
            ],
          },
        ],
      },
    ],
  },
  text_avalanche: null,
};

const warningDataOrangeWithComment = {
  ...warningDataOrange,
  comments: {
    title: 'Commentaire carte',
    text: ['Épisode orageux sévère et durable en cours.'],
  },
};

module.exports = {
  forecastData,
  warningDataGreen,
  warningDataOrange,
  warningDataOrangeWithComment,
};
