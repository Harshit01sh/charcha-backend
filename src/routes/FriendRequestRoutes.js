const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friendController");
const auth = require("./../middlewares/authMiddleware");

// Friend request APIs
router.post("/send", auth, friendController.sendRequest);
router.post("/accept", auth, friendController.acceptRequest);
router.post("/reject", auth, friendController.rejectRequest);
router.post("/cancel", auth, friendController.cancelRequest);
router.get("/requests/:userId", auth, friendController.getRequests);
router.get("/friends", auth, friendController.getFriends);
router.post("/unfriend", auth, friendController.unfriend);
router.get('/getsearchuser', auth , friendController.searchUsers)
router.get("/suggestions", auth, friendController.getSuggestions);
router.get("/profile/:userId", auth, friendController.getProfile);

module.exports = router;


// POST /friends/send → send request

// POST /friends/accept → accept

// POST /friends/reject → reject

// POST /friends/cancel → cancel

// GET /friends/requests → incoming/outgoing

// GET /friends/friends → friends list
