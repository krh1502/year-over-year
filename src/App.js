import './App.css';
import {useEffect, useState} from 'react';

function App() {
  const CLIENT_ID = "5ce1937c472e49ff980b2daf69f969cc"
  const REDIRECT_URI = "https://year-over-year.web.app/"
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"
  const [token, setToken] = useState("")
  const [profile, setProfile] = useState({})
  const [songs, setSongs] = useState([])

  useEffect(async () => {
    const hash = window.location.hash
    let token = window.localStorage.getItem("token")

    if (!token && hash) {
        token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]

        window.location.hash = ""
        window.localStorage.setItem("token", token)
    }

    setToken(token)

    const result = await fetch("https://api.spotify.com/v1/me", {
      method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    setProfile(await result.json());
    const playlists = await fetchPlaylists(token);
    setSongs(await getDiff(playlists, token));

  }, [])

  const renderSongs = () => {
    return songs.map(element => (
      <div key={element}>
        {element}
      </div>
    ))
  }

  const logout = () => {
    setToken("")
    window.localStorage.removeItem("token")
    setSongs([])
    setProfile({})
  }

  return (
    <div className="App">
    <header className="App-header">
        <h1>Year Over Year</h1>
        <p>See what songs made your top 100 songs playlists in both 2022 and 2023!</p>
        {!token ?
        <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private,user-read-email,playlist-read-private,playlist-read-collaborative`}>Login to Spotify</a>
        : <p>Profile: {profile.display_name}</p>}
        <ul>{renderSongs()}</ul>
        {/* {profile ? renderSongs() : <p></p>} */}
        <button onClick={logout}>Logout</button>
        
    </header>
</div>
  );
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
  console.log("here");
  console.log(songs_overlap);

  return songs_overlap;

}

export default App;
