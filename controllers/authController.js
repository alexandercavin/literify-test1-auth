const db = require("../config/db");
// const jwt = require("jsonwebtoken");
const userCollection = db.collection("users");
const bcrypt = require("bcryptjs");

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const userSnapshot = await userCollection
    .where("email", "==", email)
    .limit(1)
    .get();

  const user = userSnapshot.docs[0].data(); // Get user data from the snapshot
  const isPasswordValid = await bcrypt.compare(password, user.password); 

  if (userSnapshot.empty || !isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.status(200).send({message:"Welcome!", user: userSnapshot.docs[0].data()});
};
