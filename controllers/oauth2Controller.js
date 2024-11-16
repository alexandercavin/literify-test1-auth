const db = require("../config/db");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const userCollection = db.collection("users");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:4000/auth/google/callback"
);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const authorizationURL = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  include_granted_scopes: true,
});

//google  login
exports.googleLogin = async (req, res) => {
  res.redirect(authorizationURL);
};

//google callback login

exports.googleCallbackLogin = async (req, res) => {
  const { code } = req.query;

  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();

  if (!data.email || !data.name) {
    return res.json({
      data: data,
    });
  }

  const userSnapshot = await userCollection.where("email", "==", data.email).limit(1).get();

  if (userSnapshot.empty) {
    const newUser = {
      email: data.email,
      username: data.given_name,
      firstName: data.given_name,
      lastName: data.family_name,
      level: "beginner", //default level
      createdAt: new Date().toISOString(),
    };

    const id = newUser.username;
    const payload = {
      id: id,
      username: newUser.username,
      firstName: newUser.address,
    };

    const secret = "-a-3-02o-23o-sas";

    const expiresIn = 60 * 60 * 1;

    const token = jwt.sign(payload, secret, { expiresIn: expiresIn });

    // return res.redirect(`http://localhost:3000/auth-success?token=${token}`)

    try {
      const docRef = await userCollection.doc(id).set(newUser);
      res.status(201).send({ id: docRef.id, ...newUser, token: token });
    } catch (error) {
      res.status(500).send({ message: "Error creating user", error });
    }
  } else {
    //if the account is already signed up.
    // return res.status(404).send({ message: "This account already exists!" });
    return res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  }
};


exports.googleLogout = async (req, res) => {
    try {
      // Invalidate or "blacklist" the JWT token if using a server-side store.
      // Example: Add the JWT token to a "blacklist" or mark it as revoked in your database.
      
      const token = req.headers["authorization"]?.split(" ")[1]; // Assuming token is in Authorization header.
  
      if (!token) {
        return res.status(400).send({ message: "No token provided" });
      }
  
      // Optionally, revoke the Google OAuth token if you have access to it
      // Example: Assuming you're storing the Google access token
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
  
      // Assuming you have access to the Google OAuth token from the JWT or session data
      const googleAccessToken = req.user?.googleAccessToken; // Make sure to set this when the user logs in
  
      if (googleAccessToken) {
        oauth2Client.setCredentials({ access_token: googleAccessToken });
  
        // Revoke the OAuth token to invalidate the Google session
        await oauth2Client.revokeToken(googleAccessToken);
      }
  
      // Respond to inform client to discard the token
      res.status(200).send({ message: "Logged out successfully, token invalidated" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).send({ message: "Internal server error", error });
    }
  };