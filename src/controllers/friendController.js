const db = require("../models");
const FriendRequest = db.FriendRequest;
const User = db.Users;

// 🔹 Send Friend Request
module.exports.sendRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({ error: "❌ You cannot send a request to yourself" });
    }

    // Check if request already exists
    const existing = await FriendRequest.findOne({
      where: { senderId, receiverId },
    });
    if (existing) {
      return res.status(400).json({ error: "❌ Friend request already sent" });
    }

    const request = await FriendRequest.create({ senderId, receiverId });
    res.json({ message: "✅ Friend request sent", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Accept Friend Request
module.exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await FriendRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ error: "❌ Request not found" });

    request.status = "accepted";
    await request.save();

    res.json({ message: "✅ Friend request accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Reject Friend Request
module.exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await FriendRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ error: "❌ Request not found" });

    request.status = "rejected";
    await request.save();

    res.json({ message: "✅ Friend request rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Cancel Friend Request (only sender can cancel)
module.exports.cancelRequest = async (req, res) => {
  try {
    const { requestId, senderId } = req.body;

    const request = await FriendRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ error: "❌ Request not found" });

    if (request.senderId !== senderId) {
      return res.status(403).json({ error: "❌ Only sender can cancel the request" });
    }

    await request.destroy();
    res.json({ message: "✅ Friend request cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Get Pending Requests (incoming & outgoing)
module.exports.getRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(userId)

    const incoming = await FriendRequest.findAll({
      where: { receiverId: userId, status: "pending" },
      include: [{ model: User, as: "Sender", attributes: ["id", "name", "email", "image"] }],
    });

    const outgoing = await FriendRequest.findAll({
      where: { senderId: userId, status: "pending" },
      include: [{ model: User, as: "Receiver", attributes: ["id", "name", "email", "image"] }],
    });

    res.json({ incoming, outgoing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Get Friends List (all accepted)
module.exports.getFriends = async (req, res) => {
  try {
    //const { userId } = req.params;
    const userId = req.user.id;
    const friends = await FriendRequest.findAll({
      where: {
        status: "accepted",
        [db.Sequelize.Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      include: [
        { model: User, as: "Sender", attributes: ["id", "name", "email", "image"] },
        { model: User, as: "Receiver", attributes: ["id", "name", "email", "image"] },
      ],
    });

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// UnFriend 
// 🔹 Unfriend a user
module.exports.unfriend = async (req, res) => {
  try {
    const { friendId } = req.body; // userId = logged-in user, friendId = friend to remove

    const userId = req.user.id;

    // Find the accepted friend request between these two users
    const friendship = await FriendRequest.findOne({
      where: {
        status: "accepted",
        [db.Sequelize.Op.or]: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: "❌ Friendship not found" });
    }

    // Delete the friendship
    await friendship.destroy();

    res.json({ message: "✅ Successfully unfriended the user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
