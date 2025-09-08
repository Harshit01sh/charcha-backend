const db = require("./../models/index.js");
const FriendRequest = db.FriendRequest;

module.exports = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id; // from auth middleware

    const request = await FriendRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ error: "❌ Friend request not found" });

    // Only sender or receiver can act
    if (request.senderId !== userId && request.receiverId !== userId) {
      return res.status(403).json({ error: "❌ Not authorized to update this request" });
    }

    req.friendRequest = request;
    next();
  } catch (err) {
    res.status(500).json({ error: "Middleware error: " + err.message });
  }
};
