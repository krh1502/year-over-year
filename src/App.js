import './App.css';

const clientId = "5ce1937c472e49ff980b2daf69f969cc"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
var profile;
var songs;

if (!code) {
  redirectToAuthCodeFlow(clientId);
} else {
  const accessToken = await getAccessToken(clientId, code);
  console.log(accessToken);
  profile = await fetchProfile(accessToken);
  console.log(profile);
  const playlists = await fetchPlaylists(accessToken);
  console.log(playlists);
  songs = await getDiff(playlists, accessToken);
  console.log(songs);

}

function App() {
  const renderSongs = () => {
    console.log('getting here');
    return songs.map(element => (
      <div key={element}>
        {element}
      </div>
    ))
    // songs.forEach(element => {
    //   <div>
    //     Hello!
    //     {element}
    //   </div>
    // });
    // return songs.map(artist => (
    //     <div key={artist.id}>
    //         {artist.images.length ? <img width={"100%"} src={artist.images[0].url} alt=""/> : <div>No Image</div>}
    //         {artist.name}
    //     </div>
    // ))
  }
  return (
    <div className="App">
    <header className="App-header">
        <h1>Spotify React</h1>
        <p>{profile.display_name}</p>
        {renderSongs()}
        
    </header>
</div>
  );
}

async function redirectToAuthCodeFlow(clientId) {
  // TODO: Redirect to Spotify authorization page
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "https://year-over-year.web.app/");
  params.append("scope", "user-read-private user-read-email playlist-read-private");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

async function getAccessToken(clientId, code) {
  // TODO: Get access token for code
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "https://year-over-year.web.app/");
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token) {
  // TODO: Call Web API
  const result = await fetch("https://api.spotify.com/v1/me", {
      method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

async function fetchPlaylists(token) {
  var result = await fetch("https://api.spotify.com/v1/me/playlists?limit=50&offset=0", {
    method: "GET", headers: {Authorization: `Bearer ${token}`}
  });

  var playlist_2023_id = "";
  var playlist_2022_id = "";


  var res = await result.json();
  while(playlist_2023_id == "" || playlist_2022_id == ""){
    console.log("while loop once");
    res.items.forEach(element => {
      console.log(element.name)
      if(element.name == "Your Top Songs 2023" && element.owner.id == "spotify"){
        playlist_2023_id = element.id;
      }
      if(element.name == "Your Top Songs 2022" && element.owner.id == "spotify"){
        playlist_2022_id = element.id;
      }
    });
    console.log(res.next);
    if((playlist_2023_id == "" || playlist_2022_id == "") && res.next != null){
      result = await fetch(res.next, {
      method: "GET", headers: {Authorization: `Bearer ${token}`}
      });
      res = await result.json();
      console.log(res);
    } else if((playlist_2023_id == "" || playlist_2022_id == "") && res.next == null){
      break;
    }
  }

  if(playlist_2023_id == "" || playlist_2022_id == ""){
    console.log("Missing 2023 and/or 2022 top songs playlist(s). Make sure to save these to your Spotify library.")
  } 

  return {'2023': playlist_2023_id, '2022': playlist_2022_id}
}

async function getDiff(playlists, token){
  var url = `https://api.spotify.com/v1/playlists/${playlists['2023']}/tracks?fields=items(track(name,artists(name)))`
  var songs = []
  var result = await fetch(url, {
    method: "GET", headers: {Authorization: `Bearer ${token}`}
  });

  var response = await result.json();
  response.items.forEach(element => {
    songs.push(`${element.track.name} - ${element.track.artists[0].name}`)
  });

  url = `https://api.spotify.com/v1/playlists/${playlists['2022']}/tracks?fields=items(track(name,artists(name)))`
  var songs_overlap = []
  result = await fetch(url, {
    method: "GET", headers: {Authorization: `Bearer ${token}`}
  });
  response = await result.json();
  response.items.forEach(element => {
    if(songs.includes(`${element.track.name} - ${element.track.artists[0].name}`)){
      songs_overlap.push(`${element.track.name} - ${element.track.artists[0].name}`);
    }
  });

  return songs_overlap;

}

export default App;
