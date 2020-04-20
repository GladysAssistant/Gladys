const containers = [
  {
    Id: 'b7b26232-2e3b-4425-a986-30f949a5e5e2',
    Names: ['/Gladys'],
    Image: 'gladysassistant/gladys',
  },
  {
    Id: 'b594e692-e6d3-4531-bdcc-f0afcf515113',
    Names: ['/watchtower'],
    Image: 'containrrr/watchtower',
  },
];

const images = [
  {
    Id: '0f72aecf-4a85-4b00-86c4-43dbdf9c8c05',
    RepoTags: ['gladysassistant/gladys'],
  },
  {
    Id: '3eb811ca-e050-4324-a6fa-a7a09141b4fa',
    RepoTags: ['containrrr/watchtower'],
  },
];

module.exports = {
  containers,
  images,
};
