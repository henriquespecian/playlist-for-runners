require("dotenv").config();
const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const app = express();

app.listen(8080, () => {
  console.log("App is listening on port 8080!");
});

app.get("/", (req, res) => {
  const params = {
    response_type: "code",
    client_id: process.env.CLIENT_ID,
    scope: "user-read-private user-read-email",
    //TODO
    //code_challenge_method: "S256",
    //code_challenge: codeChallenge,
    redirect_uri: "http://localhost:8080/callback",
  };

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = new URLSearchParams(params).toString();

  res.send("<a href='" + authUrl + "'>Sign in</a>");
});

app.get("/callback", async (req, res) => {
  //console.log("spotify response code is " + req.query.code);

  const auth = new Buffer.from(
    process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
  ).toString("base64");
  const spotifyResponse = await axios.post(
    "https://accounts.spotify.com/api/token",
    querystring.stringify({
      grant_type: "authorization_code",
      code: req.query.code,
      redirect_uri: "http://localhost:8080/callback",
    }),
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + auth,
      },
    }
  );

  res.send(spotifyResponse.data);
});

app.get("/home", (req, res) => {
  res.send("<h1> Logadasso </h1>");
});
