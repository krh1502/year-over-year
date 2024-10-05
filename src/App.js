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
  const [years, setYears] = useState({})
  const [selectedYears, setSelectedYears] = useState([])

  useEffect(() => {
    
    const hash = window.location.hash
    let token = window.localStorage.getItem("token")
    console.log("here: "+token)
    if(!token){
      window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private,user-read-email,playlist-read-private,playlist-read-collaborative`
    }

    if (!token && hash) {
        token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]

        window.location.hash = ""
        window.localStorage.setItem("token", token)
    }

    setToken(token)
    async function fetchData(){
      const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(await result.json());
      setYears(await fetchYears(token))
      
    }

    fetchData();

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

  const updatePlaylists = async () =>{
    console.log(selectedYears)
    setSongs(await getDiffOptions(selectedYears, token))
  }

  return (
    <div className="App">
    <header className="App-header">
        <h1>Year Over Year</h1>
        <p>See what songs made your top 100 songs playlists from Spotify Wrapped, year after year!</p>
        {!token || token === "" ?
        <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private,user-read-email,playlist-read-private,playlist-read-collaborative`}>Login to Spotify</a>
        : <p>Profile: {profile.display_name}</p>}

        {!years || Object.keys(years).length === 0 ?
          <p>No years available.</p> :
          <div>
          {Object.entries(years).map(([key, value]) => (
            <div key={value}>
              <label>
                <input
                  type="checkbox"
                  value={value}
                  checked={selectedYears.includes(value)}
                  onChange={handleCheckboxChange}
                />
                {key} {/* Assuming value is a display name */}
              </label>
            </div>
          ))}
          <button onClick={updatePlaylists}>Submit</button>
          </div>
        }

        
        
        {token && !songs ?
          <ul>
            <p>Looks like you're missing your 2023 and/or 2022 Top Songs Playlist(s). Add them to your library:</p>
            <p><a href="https://open.spotify.com/playlist/37i9dQZF1Fa1IIVtEpGUcU?si=8a8b251ae72546fb">2023 Playlist</a></p>
            <p><a href="https://open.spotify.com/playlist/37i9dQZF1F0sijgNaJdgit?si=d2dce6c5e8c94892">2022 Playlist</a></p>
          </ul> : 
          <ul>{renderSongs()}</ul>
        }
        <button onClick={logout}>Logout</button>
        
    </header>
</div>
  );
}

async function fetchYears(token) {
  if(!token || token===""){
    return {}
  }
  var result = await fetch("https://api.spotify.com/v1/me/playlists?limit=50&offset=0", {
    method: "GET", headers: {Authorization: `Bearer ${token}`}
  });

  var res = await result.json();
  console.log(res.items)
  let years = {}
  for(let i=0;i<res.items.length;i++){
    if(res.items[i].name.startsWith("Your Top Songs") && res.items[i].owner.id === "spotify"){
      years[res.items[i].name] = res.items[i].id
    }
  }
  while(res.next) {
    result = await fetch(res.next, {
      method: "GET", headers: {Authorization: `Bearer ${token}`}
    });
    res = await result.json();
    for(let i=0;i<res.items.length;i++){
      if(res.items[i].name.startsWith("Your Top Songs") && res.items[i].owner.id === "spotify"){
        years[res.items[i].name] = res.items[i].id
      }
    }
  }
  return years
}

// async function fetchPlaylists(token) {
//   var result = await fetch("https://api.spotify.com/v1/me/playlists?limit=50&offset=0", {
//     method: "GET", headers: {Authorization: `Bearer ${token}`}
//   });

//   var res = await result.json();
//   let playlists = {};
//   for(let i=0;i<res.items.length;i++){
//     playlists[res.items[i].name] = res.items[i].id
//   }

//   if(playlists["Your Top Songs 2023"] && playlists["Your Top Songs 2022"]){
//     return {'2023': playlists["Your Top Songs 2023"], '2022': playlists["Your Top Songs 2022"]}
//   }

//   while(res.next) {
//     console.log(res.next)
//     result = await fetch(res.next, {
//       method: "GET", headers: {Authorization: `Bearer ${token}`}
//     });
//     res = await result.json();
//     for(let i=0;i<res.items.length;i++){
//       playlists[res.items[i].name] = res.items[i].id
//     }
//     if(playlists["Your Top Songs 2023"] && playlists["Your Top Songs 2022"]){
//       return {'2023': playlists["Your Top Songs 2023"], '2022': playlists["Your Top Songs 2022"]}
//     }
//   }
//   console.log("Missing 2023 and/or 2022 top songs playlist(s). Make sure to save these to your Spotify library.")
//   return {'2023': null, '2022': null}
// }

// async function getDiff(playlists, token){
//   var url = `https://api.spotify.com/v1/playlists/${playlists['2023']}/tracks?fields=items(track(name,artists(name)))`
//   var songs = []
//   var result = await fetch(url, {
//     method: "GET", headers: {Authorization: `Bearer ${token}`}
//   });

//   var response = await result.json();
//   response.items.forEach(element => {
//     songs.push(`${element.track.name} - ${element.track.artists[0].name}`)
//   });

//   url = `https://api.spotify.com/v1/playlists/${playlists['2022']}/tracks?fields=items(track(name,artists(name)))`
//   var songs_overlap = []
//   result = await fetch(url, {
//     method: "GET", headers: {Authorization: `Bearer ${token}`}
//   });
//   response = await result.json();
//   response.items.forEach(element => {
//     if(songs.includes(`${element.track.name} - ${element.track.artists[0].name}`)){
//       songs_overlap.push(`${element.track.name} - ${element.track.artists[0].name}`);
//     }
//   });

//   return songs_overlap;

// }

async function getDiffOptions(playlists, token){
  var url = `https://api.spotify.com/v1/playlists/${playlists[0]}/tracks?fields=items(track(name,artists(name)))`
  var songs = []
  var result = await fetch(url, {
    method: "GET", headers: {Authorization: `Bearer ${token}`}
  });

  var response = await result.json();
  response.items.forEach(element => {
    songs.push(`${element.track.name} - ${element.track.artists[0].name}`)
  });

  url = `https://api.spotify.com/v1/playlists/${playlists[1]}/tracks?fields=items(track(name,artists(name)))`
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
