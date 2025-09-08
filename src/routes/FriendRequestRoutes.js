const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friendController");
const auth = require("./../middlewares/authMiddleware");

// Friend request APIs
router.post("/send", auth, friendController.sendRequest);
router.post("/accept", auth, friendController.acceptRequest);
router.post("/reject", auth, friendController.rejectRequest);
router.post("/cancel", auth, friendController.cancelRequest);
router.get("/requests", auth, friendController.getRequests);
router.get("/friends", auth, friendController.getFriends);

module.exports = router;
