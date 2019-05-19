const AUTH_FILE = '/authentication.json';

const generateToken = () => (Math.random().toString(36).slice(-8)
    + Math.random().toString(36).slice(-8)
    + Math.random().toString(36).slice(-8)
    + Math.random().toString(36).slice(-8)
);

const getAuthInfos = async (userSession) => {
  const userData = userSession.loadUserData();
  // we check if the auth informations exists on Blockstack side.
  let authInfos = await userSession.getFile(AUTH_FILE);
  // if yes, we try to parse them
  if (authInfos) {
    try {
      const parsedInfos = JSON.parse(authInfos);
      // if they are parsed and have the right informations
      if (parsedInfos.email && parsedInfos.token) {
        // we return them
        return parsedInfos;
      }
    } catch (e) {
      
    }
  }

  authInfos = {
    email: `${userData.username}@blockstack.org`,
    token: generateToken()
  };

  await userSession.putFile(AUTH_FILE, JSON.stringify(authInfos));
  return authInfos;
};

function redirectPost(url, data) {
  var form = document.createElement('form');
  document.body.appendChild(form);
  form.method = 'post';
  form.action = url;
  for (var name in data) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = data[name];
      form.appendChild(input);
  }
  form.submit();
}

document.addEventListener('DOMContentLoaded', async function(event) {

  const userSession = new window.blockstack.UserSession();

  if (userSession.isUserSignedIn()) {
    userSession.loadUserData();
  } else if (userSession.isSignInPending()) {
    await userSession.handlePendingSignIn();
  } else {
    const redirectURI = `${window.location.href}`;
    const manifestURI = `${window.location.origin}/js/dependencies/blockstack/manifest.json`;
    return userSession.redirectToSignIn(redirectURI, manifestURI);
  }
  // get gladys auth informations
  const blockstackAuthInfos = await getAuthInfos(userSession);
  redirectPost('/session/create', {
    email: blockstackAuthInfos.email,
    password: blockstackAuthInfos.token
  });
});
