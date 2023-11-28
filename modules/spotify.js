require("dotenv").config();
const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser());

app.listen(8080, () => {
  console.log("App is listening on port 8080!");
});

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

app.get("/", async (req, res) => {
  const params = {
    response_type: "code",
    client_id: process.env.CLIENT_ID,
    scope: "user-read-private user-read-email user-top-read",
    //code_challenge_method: "S256",
    //code_challenge: challenge,
    redirect_uri: "http://localhost:8080/callback",
  };

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = new URLSearchParams(params).toString();

  res.send("<a href='" + authUrl + "'>Sign in</a>");
});

app.get("/callback", async (req, res) => {
  if (isEmpty(req.cookies.tokenSpotify)) {
    const auth = new Buffer.from(
      process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
    ).toString("base64");

    await axios
      .post(
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
      )
      .then(function (spotifyResponse) {
        res.cookie("tokenSpotify", spotifyResponse.data.access_token, {
          expires: new Date(Date.now() + 900000), //15min
          secure: true,
          httpOnly: true,
          sameSite: "lax",
        });
        res.redirect("/home");
      });
  } else {
    res.redirect("/home");
  }
});

app.get("/home", async (req, res) => {
  if (isEmpty(req.cookies.tokenSpotify)) {
    res.redirect("/");
  }

  await axios
    .get(
      "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=100",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: "Bearer " + req.cookies.tokenSpotify,
        },
      }
    )
    .then((response) => {
      res.send(response.data);
    });
});

function isEmpty(value) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      if (value[i]) {
        return false;
      }
    }
    return true;
  } else {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      JSON.stringify(value) === "{}"
    ) {
      return true;
    }
    return false;
  }
}
