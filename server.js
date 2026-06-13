const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.static('.'));

let spotifyToken = null;

async function getSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(
                process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    spotifyToken = data.access_token;
}

app.get('/search', async (req, res) => {
    try {
        if (!spotifyToken) await getSpotifyToken();
        const query = req.query.q;
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
            { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
        );
        const data = await response.json();
        const track = data.tracks.items[0];
        res.json({
            name: track.name,
            artist: track.artists[0].name,
            album_art: track.album.images[0].url
        });
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/lyrics', async (req, res) => {
    try {
        const query = req.query.q;
        const response = await fetch(
            `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
            { headers: { 'Authorization': `Bearer ${process.env.GENIUS_TOKEN}` } }
        );
        const data = await response.json();
        const hit = data.response.hits[0];
        res.json({
            url: hit.result.url,
            title: hit.result.full_title
        });
    } catch (err) {
        res.status(500).json({ error: 'Lyrics failed' });
    }
});

getSpotifyToken();
app.listen(3000, () => console.log('Echory running on http://localhost:3000'));