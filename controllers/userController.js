const db = require("../config/db");
const bcrypt = require("bcryptjs");

const userCollection = db.collection("users");

exports.createUser = async (req, res) => {
  const id = req.body.username;
  const { email, username, password, firstName, lastName, level } = req.body;

  if (!email || !username || !password || !firstName || !lastName || !level) {
    return res.status(400).send({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      level: level || "beginner",
      createdAt: new Date().toISOString(),
    };

    const docRef = await userCollection.doc(id).set(newUser);
    res.status(201).send({ id: docRef.id, ...newUser });
  } catch (error) {
    res.status(500).send({ message: "Error creating user", error });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const dbResponse = await userCollection.get();

    let responseArray = [];
    dbResponse.forEach((element) => {
      responseArray.push(element.data());
    });

    res.status(200).send(responseArray);
  } catch (error) {
    res.status(500).send({ message: "Error fetching users", error });
  }
};

exports.getUsersbyID = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await userCollection.doc(id).get();
    if (!doc.exists) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).send({ message: "Error fetching user", error });
  }
};

exports.updateUser = async(req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    await userCollection.doc(id).update(updates);
    res.status(200).send({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error updating user", error });
  }
}

exports.deleteUser = async(req, res) => {
  const { id } = req.params;

  try {
    await userCollection.doc(id).delete();
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting user", error });
  }
}
