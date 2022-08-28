const http = require('http');
const fs = require('fs');
const { url } = require('inspector');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    // parse the URL for any checks that need it - will result in array with "" in index 0 and each url piece after
    const urlParts = req.url.split('/');
    // if there is a trailing / on the url the urlParts array last index will be a ""
    // take this off to not break future checks
    if(urlParts[urlParts.length - 1] === ""){
      urlParts.splice(urlParts.length - 1, 1);
    }

    // all GET requests
    if(req.method === 'GET'){
      // all GET requests where the url begins with /artists
      if(req.url.startsWith('/artists')){

        // if urlParts length is 2 then we just want the info on all artists in the database
        // stringify the values of the artists object from the seed file, set the header/status and return the body
        if(urlParts.length === 2){
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(Object.values(artists)));
        }

        // anything more than 2 is going to be an artist by artistId
        // get the artistId and find the artist for use in the future checks
        const artistId = urlParts[2];
        const foundArtist = artists[artistId];

        // if the artist doesn't exist return an error and stop looking
        if(!foundArtist){
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');

          const messageObject = {message: "Artist not found"};
          return res.end(JSON.stringify(messageObject));
        }

        // if urlParts length is 3 then we want an artist by artistId
        if(urlParts.length === 3){
          // want to put all albums from the artist into the artist info
          // get an array of all albums by getting the values of the albums object from the seed file
          const albumsArray = Object.values(albums);
          // filter the array for the artistId
          albumsArray.filter(album => album.artistId === Number(artistId));

          //if the albumsArray has entries put the albums array into the artist info
          let thisArtistObject = foundArtist;
          thisArtistObject.albums = albumsArray;

          // stringify the artist info, set the header/status and return the body
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(thisArtistObject));
        }

        // if urlParts length is 4 we are looking for a nested resource of a specific artist
        if(urlParts.length === 4){
          // if the last piece of the url is albums then we want all albums belonging to the artist
          if(urlParts[3] === 'albums'){
            // get an array of all albums by getting the values of the albums object from the seed file
            const albumsArray = Object.values(albums);
            // filter the array for the artistId
            albumsArray.filter(album => album.artistId === Number(artistId));

            // if the array has a length of at least 1 then the artist has albums
            // stringify the filtered array, set the headers/status and return the body
            if(albumsArray.length >= 1){
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(albumsArray));
            }
            // otherwise return an error
            else{
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              const messageObject = {message: "No albums found"};
              return res.end(JSON.stringify(messageObject));
            }
          }

          // if last piece of the url is songs then we want all songs belonging to the artist
          if(urlParts[3] === 'songs'){
            // get an array of all albums by getting the values of the albums object from the seed file
            const albumsArray = Object.values(albums);
            // filter the array for the artistId to get only
            albumsArray.filter(album => album.artistId === Number(artistId));
            // get all of the albumIds from the filtered albumsArray
            let albumIds = [];
            albumsArray.map(album => albumIds.push(album.albumId));

            // get an array of all songs by getting the values of the songs object from the seed file
            const songsArray = Object.values(songs);
            // filter the songs array to only include those with an album id that's in the filtered albumsArray
            songsArray.filter(song => albumIds.includes(song.albumId));

            // if the songs array has a length of at least 1 then the artist has songs
            // stringify the songsArray, set the headers/status and return the body
            if(songsArray.length >= 1){
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(songsArray));
            }

            // otherwise return an error
            else{
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              const messageObject = {message: "No songs found"};
              return res.end(JSON.stringify(messageObject));
            }
          }
        }
      }

      // all GET requests where the url begins with /albums
      if(req.url.startsWith('/albums')){
        // if urlParts length is 2 then we just want the info on all albums in the database
        // stringify the values of the albums object from the seed file, set the header/status and return the body
        if(urlParts.length === 2){
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(Object.values(albums)));
        }

        // anything more than 2 is going to be an album by albumId
        // get the albumId and find the album for use in the future checks
        const albumId = urlParts[2];
        const foundAlbum = albums[albumId];

        // if the album doesn't exist return an error and stop looking
        if(!foundAlbum){
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');

          const messageObject = {message: "Album not found"};
          return res.end(JSON.stringify(messageObject));
        }

        // if urlParts length is 3 then we want an album by albumId
        if(urlParts.length === 3){
          // we already found the album by albumId above but we want the album info diplayed to include
          // additional info on the artist and the songs - so copy object to not change original
          let thisAlbumObject = foundAlbum;

          // get the artistId from the album - then get the artist itself
          const artistId = foundAlbum.artistId;
          const artist = artists[artistId];

          // get all the songs from the songs file
          // then filter them by the album id to get the array that belong to this album
          const songsArray = Object.values(songs);
          songsArray.filter(song => song.albumId === Number(albumId));

          // add the artist and songs info to the albumObject
          thisAlbumObject.artist = artist;
          thisAlbumObject.songs = songsArray;

          // stringify the album info, set the header/status and return the body
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(thisAlbumObject));
        }

        // if urlParts length is 4 then we want a nested resource of album by albumId
        if(urlParts.length === 4){
          // if last part of url is songs we want all songs belonging to the specified album
          if(urlParts[3] === 'songs'){
            // get an array of all songs by reading the values of the object in the seed file
            const songsArray = Object.values(songs);
            // filter the songsArray for only those with the given album id
            songsArray.filter(song => song.albumId === Number(albumId));

            // if songsArray has at least 1 thing
            // stringify the songsArray, set header/status and return the body
            if(songsArray.length >= 1){
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify(songsArray));
            }
            //otherwise return an error
            else{
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');

              const messageObject = {message: "Songs not found"};
              return res.end(JSON.stringify(messageObject));
            }
          }
        }
      }

      // all GET requests where the url begins with /trackNumbers
      if(req.url.startsWith('/trackNumbers')){
        // if url length is 4 and last piece is songs we are trying to get songs by trackNumberId
        if(urlParts.length === 4 && urlParts[3] === 'songs'){
          const trackNumberId = urlParts[2];

          // get all the songs in our database by getting values of object in songs seed file
          const songsArray = Object.values(songs);
          // filter songsArray by songs that have given trackNumber
          songsArray.filter(song => song.trackNumber === Number(trackNumberId));

          // if songsArray has at least 1 thing
          // stringify the songsArray, set header/status and return the body
          if(songsArray.length >= 1){
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(songsArray));
          }
          //otherwise return an error
          else{
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');

            const messageObject = {message: "Songs not found"};
            return res.end(JSON.stringify(messageObject));
          }
        }
      }

      // all GET requests where the url begins with /songs
      if(req.url.startsWith('/songs')){
        // if urlParts length is 2 then we just want the info on all songs in the database
        // stringify the values of the songs object from the seed file, set the header/status and return the body
        if(urlParts.length === 2){
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(Object.values(songs)));
        }

        // anything more than 2 is going to be a song by songId
        // get the songId and find the song for use in the future checks
        const songId = urlParts[2];
        const foundSong = songs[songId];

        // if the song doesn't exist return an error and stop looking
        if(!foundSong){
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');

          const messageObject = {message: "Song not found"};
          return res.end(JSON.stringify(messageObject));
        }

        // if urlParts length is 3 then we want a song by songId
        if(urlParts.length === 3){
          // we already found the song by songId above but we want the song info diplayed to include
          // additional info on the artist and the album - so copy object to not change original
          let thisSongObject = foundSong;

          // get the albumId from the song and find the album object
          const albumId = foundSong.albumId;
          const album = albums[albumId];

          // get the artistId from the album and then find the artist object
          const artistId = album.artistId;
          const artist = artists[artistId];

          // add the album and artist info to the song object
          thisSongObject.album = album;
          thisSongObject.artist = artist;

          // stringify the song info, set the header/status and return the body
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(thisSongObject));
        }
      }
    }



    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
