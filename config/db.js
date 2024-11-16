const express = require('express')
const app = express()

const admin = require("firebase-admin")
const credentials = require('../services/literify-test1-firebase-key.json')

admin.initializeApp({
    credential: admin.credential.cert(credentials)
})

const db = admin.firestore();

module.exports = db;

