import './App.css';
import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, Timestamp, setDoc, doc } from 'firebase/firestore';
import db from './firebase'

function App() {
  const CLIENT_ID = "5ce1937c472e49ff980b2daf69f969cc"
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"
  const [token, setToken] = useState("")
  const [profile, setProfile] = useState({})
  const [songs, setSongs] = useState([])
  const [years, setYears] = useState({})
  const [selectedYears, setSelectedYears] = useState([])

  useEffect(() => {

    const hash = window.location.hash
    let token = window.localStorage.getItem("token")
    // if (!token) {
    //   window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private,user-read-email,playlist-read-private,playlist-read-collaborative`
    // }

    if (!token && hash) {
      token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]

      window.location.hash = ""
      window.localStorage.setItem("token", token)
    }

    setToken(token)
    async function fetchData() {
      const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
      });

      var res_json = await result.json()

      setProfile(res_json);
      try {
        setDoc(doc(db, res_json['id'], "logins"), {
          user: res_json,
          lastLogin: Timestamp.now()
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
      setYears(await fetchYears(token, res_json['id']));

    }

    fetchData();

  }, [])

  const renderSongs = () => {
    if (songs[0] === 1) {
      return (
        <div>
          <p class="song">No overlapping songs between these selected years.</p>
        </div>
      )

    }
    return songs.map(element => (
      <div key={element}>
        <a class="song" href={element.external_urls.spotify}>{element.name} - {element.artists[0].name}</a>
      </div>
    ))
  }

  const logout = () => {
    setToken("")
    window.localStorage.removeItem("token")
    setSongs([])
    setProfile({})
    setYears({})
    setSelectedYears([])
  }

  // TY chatgpt :)
  const handleCheckboxChange = (event) => {
    const value = event.target.value;
    setSelectedYears((prevSelected) => {
      // If the checkbox is checked
      if (event.target.checked) {
        // Check if already 2 selected
        if (prevSelected.length < 2) {
          return [...prevSelected, value];
        }
        return prevSelected; // Do nothing if already 2 selected
      } else {
        // If it's unchecked, remove it from the selection
        return prevSelected.filter(option => option !== value);
      }
    })
  };

  const updatePlaylists = async () => {
    setSongs(await getDiffOptions(selectedYears, token))
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Year Over Year</h1>
        <p class="textarea">See what songs made your top 100 songs playlists from Spotify Wrapped, year after year!</p>
        <p class="textarea">How to use this app: <br />Add your Spotify wrapped top songs playlists to your library as a copy by clicking on the ..., then "Add to other playlist", then "New playlist". Keep the playlist name the same as it was (remove any extra numbers)</p>
        {!token || token === "" ?
          <div>
            <a class="button-1" href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private,user-read-email,playlist-read-private,playlist-read-collaborative`}>Login to Spotify</a>
          </div>
          : <div class="loggedin">
            <p class="profile">Logged in as {profile.display_name}</p>
            <button class="button-1" onClick={logout}>Logout</button>
          </div>}

        {!years || Object.keys(years).length === 0 ?
          <p>No years available.</p> :
          <div>
            {Object.entries(years).map(([key, value]) => (
              <div key={value} class="checkbox-wrapper-33">
                <label class="checkbox">
                  <input
                    type="checkbox"
                    value={value}
                    checked={selectedYears.includes(value)}
                    onChange={handleCheckboxChange}
                    class="checkbox__trigger visuallyhidden"
                  />
                  <span class="checkbox__symbol">
                    <svg aria-hidden="true" class="icon-checkbox" width="28px" height="28px" viewBox="0 0 28 28" version="1" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 14l8 7L24 7"></path>
                    </svg>
                  </span>
                  <p class="checkbox__textwrapper">{key}</p> {/* Assuming value is a display name */}
                </label>
              </div>
            ))}
            {selectedYears.length === 2 ?
              <button class="button-1" onClick={updatePlaylists} disabled={false}>Submit</button> :
              <button class="button-1" onClick={updatePlaylists} disabled={true}>Submit</button>
            }
          </div>
        }


        {token && songs.length !== 0 ?
          <div class="songarea">{renderSongs()}</div> :
          <div></div>
        }

      </header>
      <footer class="App-footer">
        <p>Data from</p>
        <img class="spotify-logo" src='Full_Logo_White_RGB.svg' alt="Spotify logo"></img>

      </footer>
    </div>
  );
}

async function fetchYears(token, user) {
  if (!token || token === "") {
    return {}
  }
  var result = await fetch("https://api.spotify.com/v1/me/playlists?limit=50&offset=0", {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  var playlistTitles = []

  var res = await result.json();
  let years = {}
  for (let i = 0; i < res.items.length; i++) {
    if (res.items[i] == null) {
      continue
    }
    playlistTitles.push(res.items[i].name)
    if (res.items[i].name.startsWith("Your Top Songs")) {
      years[res.items[i].name] = res.items[i].id
    }
  }

  while (res.next) {
    result = await fetch(res.next, {
      method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    res = await result.json();
    for (let i = 0; i < res.items.length; i++) {
      if (res.items[i] == null) {
        continue
      }
      playlistTitles.push(res.items[i].name)
      if (res.items[i].name.startsWith("Your Top Songs")) {
        years[res.items[i].name] = res.items[i].id
      }
    }
    try {
      await setDoc(doc(db, user, "playlists"),{
        playlists: playlistTitles
      })
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  return years
}

async function getDiffOptions(playlists, token) {
  var url = `https://api.spotify.com/v1/playlists/${playlists[0]}/tracks?fields=items(track(name,artists(name),href))`
  var songs = []
  var result = await fetch(url, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  var response = await result.json();
  response.items.forEach(element => {
    songs.push(`${element.track.name} - ${element.track.artists[0].name}`)
  });

  url = `https://api.spotify.com/v1/playlists/${playlists[1]}/tracks?fields=items(track(name,artists(name),external_urls(spotify)))`
  var songs_overlap = []
  result = await fetch(url, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });
  response = await result.json();
  response.items.forEach(element => {
    if (songs.includes(`${element.track.name} - ${element.track.artists[0].name}`)) {
      songs_overlap.push(element.track);
    }
  });

  if (songs_overlap.length === 0) {
    songs_overlap.push(1)
  }

  return songs_overlap;

}
export default App;
