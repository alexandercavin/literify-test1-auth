const express = require('express');
const router = express.Router();
const db = require("../config/db");


const userCollection = db.collection("users");

/**
 * Middleware for cheat prevention
 */
const preventCheating = async (userUid, points) => {
    const scoreRef = db.collection("scores").doc(userUid);
    const snap = await scoreRef.get();
    const data = snap.exists ? snap.data() : {};

    const now = Date.now();

    // Check cool-off period
    if ((data.coolOff || now) > now) {
        throw new Error("User is in a cool-off period.");
    }

    // Manage event times
    const times = (data.eventTimes = data.eventTimes || []);
    times.push(now);
    if (times.length > 10) {
        let total = 0;
        for (let i = 1; i < times.length; i++) {
            total += times[i] - times[i - 1];
        }
        const average = total / times.length;

        // Frequent attempts logic
        if (average < 5000) {
            data.errorCount = (data.errorCount || 0) + 1;
            if (data.errorCount > 20) {
                data.coolOff = now + 1000 * 60 * 60; // 1 hour cool-off
            }
        } else {
            data.errorCount = Math.max(0, (data.errorCount || 0) - 1);
        }

        // Extremely fast attempts
        if (average < 500) {
            data.coolOff = Math.max(data.coolOff || 0, now + 1000 * 60 * 5); // 5-minute cool-off
        }

        // Block attempts with average < 1 second
        if (average < 1000) {
            throw new Error("Suspiciously fast scoring attempts detected.");
        }

        // Keep only the last 20 events
        data.eventTimes = times.slice(-20);
    }

    // Save updated data
    await scoreRef.set(data);

    return data;
};

/**
 * Initialize or get the user's scores document
 */
const initializeScoreDoc = async (userUid) => {
    const scoreRef = db.collection('scores').doc(userUid);
    const snap = await scoreRef.get();

    if (!snap.exists) {
        // Create initial score data if the document doesn't exist
        await scoreRef.set({
            score: 0,
            achievements: {},
            eventTimes: [],
            errorCount: 0,
            coolOff: null,
        });
    }
};

/**
 * Award points to the user
 */
exports.awardPoints = async (req, res) => {
    const { userUid, points = 1, achievement } = req.body;

    try {
        // Validate points range
        const safePoints = Math.max(0, Math.min(points, 20));

        // Initialize scores if it doesn't exist
        await initializeScoreDoc(userUid);

        // Cheat prevention
        await preventCheating(userUid, safePoints);

        // Award points
        const scoreRef = db.collection("scores").doc(userUid);
        const snap = await scoreRef.get();
        const data = snap.exists ? snap.data() : {};

        data.score = (data.score || 0) + safePoints;

        // Add achievement if provided
        if (achievement) {
            data.achievements = data.achievements || {};
            data.achievements[achievement] = Date.now();
        }

        await scoreRef.set(data);

        res.status(200).send({ message: "Points awarded successfully.", data });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};

/**
 * Add achievement to the user
 */
exports.addAchievement = async (req, res) => {
    const { userUid, points = 10, achievement } = req.body;

    try {
        // Validate points range
        const safePoints = Math.min(points, 50);

        // Initialize scores if it doesn't exist
        await initializeScoreDoc(userUid);

        // Cheat prevention
        await preventCheating(userUid, safePoints);

        // Add achievement and award points if new
        const scoreRef = db.collection("scores").doc(userUid);
        const snap = await scoreRef.get();
        const data = snap.exists ? snap.data() : {};

        data.achievements = data.achievements || {};
        if (!data.achievements[achievement]) {
            data.achievements[achievement] = Date.now();
            data.score = (data.score || 0) + safePoints;
        }

        await scoreRef.set(data);

        res.status(200).send({ message: "Achievement added successfully.", data });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};


