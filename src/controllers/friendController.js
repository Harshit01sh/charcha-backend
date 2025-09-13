  const db = require("../models");
  const FriendRequest = db.FriendRequest;
  const User = db.Users;
  const { Op } = db.Sequelize;
  const Block = db.BlockUser;


  async function getMutualFriendsCount(userId, otherUserId) {
    // Get accepted friends of logged-in user
    const userFriends = await FriendRequest.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const userFriendIds = userFriends.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );

    if (userFriendIds.length === 0) return 0;

    // Get accepted friends of the other user
    const otherFriends = await FriendRequest.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ senderId: otherUserId }, { receiverId: otherUserId }],
      },
    });

    const otherFriendIds = otherFriends.map((f) =>
      f.senderId === otherUserId ? f.receiverId : f.senderId
    );

    // Count intersection
    const mutual = userFriendIds.filter((id) => otherFriendIds.includes(id));
    return mutual.length;
  }

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

      console.log(userId);

      const incoming = await FriendRequest.findAll({
        where: { receiverId: userId, status: "pending" },
        include: [{ model: User, as: "Sender", attributes: ["id", "name", "email", "image"] }],
      });

      const outgoing = await FriendRequest.findAll({
        where: { senderId: userId, status: "pending" },
        include: [{ model: User, as: "Receiver", attributes: ["id", "name", "email", "image"] }],
      });

      const incomingWithMutual = await Promise.all(
        incoming.map(async (reqObj) => {
          const mutual = await getMutualFriendsCount(userId, reqObj.Sender.id);
          return { ...reqObj.toJSON(), mutual };
        })
      );

      const outgoingWithMutual = await Promise.all(
        outgoing.map(async (reqObj) => {
          const mutual = await getMutualFriendsCount(userId, reqObj.Receiver.id);
          return { ...reqObj.toJSON(), mutual };
        })
      );

      res.json({ incoming: incomingWithMutual, outgoing: outgoingWithMutual });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // 🔹 Get Friends List (all accepted)
  // module.exports.getFriends = async (req, res) => {
  //   try {
  //     //const { userId } = req.params;
  //     const userId = req.user.id;
  //     const friends = await FriendRequest.findAll({
  //       where: {
  //         status: "accepted",
  //         [db.Sequelize.Op.or]: [{ senderId: userId }, { receiverId: userId }],
  //       },
  //       include: [
  //         { model: User, as: "Sender", attributes: ["id", "name", "email", "image"] },
  //         { model: User, as: "Receiver", attributes: ["id", "name", "email", "image"] },
  //       ],
  //     });

  //     res.json(friends);
  //   } catch (err) {
  //     res.status(500).json({ error: err.message });
  //   }
  // };

  module.exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Get blocked users (both ways)
    const blocks = await db.BlockUser.findAll({
      where: {
        [db.Sequelize.Op.or]: [{ blockerId: userId }, { blockedId: userId }],
      },
    });

    const blockedIds = blocks.map((b) =>
      b.blockerId === userId ? b.blockedId : b.blockerId
    );

    // ✅ Get all accepted friendships (excluding blocked users)
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

    // ✅ Filter out blocked users
    const filteredFriends = friends.filter((f) => {
      const otherUserId = f.senderId === userId ? f.receiverId : f.senderId;
      return !blockedIds.includes(otherUserId);
    });

    res.json(filteredFriends);
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

  // 🔹 Search Users (with friendship/request status)
  // module.exports.searchUsers = async (req, res) => {
  //   try {
  //     const userId = req.user.id; // logged-in user
  //     const { query } = req.query; // search term (name/email/username)

  //     if (!query || query.trim() === "") {
  //       return res.status(400).json({ error: "❌ Search query is required" });
  //     }

  //     // Find users by name (excluding self)
  //     const users = await User.findAll({
  //       where: {
  //         id: { [db.Sequelize.Op.ne]: userId },
  //         name: { [db.Sequelize.Op.like]: `%${query}%` },
  //       },
  //       attributes: ["id", "name", "email", "image"],
  //     });

  //     // Fetch all friend requests involving the logged-in user
  //     const requests = await FriendRequest.findAll({
  //       where: {
  //         [db.Sequelize.Op.or]: [
  //           { senderId: userId },
  //           { receiverId: userId },
  //         ],
  //       },
  //     });

  //     // Map requests into quick lookup
  //     const statusMap = {};
  //     requests.forEach(req => {
  //       const otherUserId = req.senderId === userId ? req.receiverId : req.senderId;
  //       statusMap[otherUserId] = req.status === "accepted"
  //         ? "friend"
  //         : req.senderId === userId
  //           ? "request_sent"
  //           : "request_received";
  //     });

  //     // Attach status info to each searched user
  //     // const result = users.map(user => ({
  //     //   ...user.toJSON(),
  //     //   status: statusMap[user.id] || "none", 
  //     // }));

  //     // Fetch all accepted friends of logged-in user (once)
  //     const myFriends = await FriendRequest.findAll({
  //       where: {
  //         status: "accepted",
  //         [db.Sequelize.Op.or]: [{ senderId: userId }, { receiverId: userId }],
  //       },
  //     });

  //     const myFriendIds = myFriends.map((f) =>
  //       f.senderId === userId ? f.receiverId : f.senderId
  //     );

  //     // Attach status + mutual friends count to each searched user
  //     const result = await Promise.all(
  //       users.map(async (user) => {
  //         // Get this user’s friends
  //         const theirFriends = await FriendRequest.findAll({
  //           where: {
  //             status: "accepted",
  //             [db.Sequelize.Op.or]: [
  //               { senderId: user.id },
  //               { receiverId: user.id },
  //             ],
  //           },
  //         });

  //         const theirFriendIds = theirFriends.map((f) =>
  //           f.senderId === user.id ? f.receiverId : f.senderId
  //         );

  //         // Count mutuals
  //         const mutual = myFriendIds.filter((id) =>
  //           theirFriendIds.includes(id)
  //         ).length;

  //         return {
  //           ...user.toJSON(),
  //           status: statusMap[user.id] || "none",
  //           mutual,
  //         };
  //       })
  //     );


  //     res.json(result);
  //   } catch (err) {
  //     res.status(500).json({ error: err.message });
  //   }
  // };

  // 🔹 Search Users (with friendship/request status)
// module.exports.searchUsers = async (req, res) => {
//   try {
//     const userId = req.user?.id; // logged-in user
//     const { query } = req.query;

//     console.log(userId , query);

//     if (!query || query.trim() === "") {
//       return res.status(400).json({ error: "❌ Search query is required" });
//     }

//     // ✅ Get blocked users (both ways)
//     const blocks = await db.Block.findAll({
//       where: {
//         [db.Sequelize.Op.or]: [
//           { blockerId: userId },
//           { blockedId: userId },
//         ],
//       },
//     });

//     const blockedIds = blocks.map((b) =>
//       b.blockerId === userId ? b.blockedId : b.blockerId
//     );

//     // ✅ Find users by name, excluding self + blocked
//     const users = await User.findAll({
//       where: {
//         id: {
//           [db.Sequelize.Op.ne]: userId,
//           [db.Sequelize.Op.notIn]: blockedIds, // exclude blocked
//         },
//         name: { [db.Sequelize.Op.like]: `%${query}%` },
//       },
//       attributes: ["id", "name", "email", "image"],
//     });

//     // Fetch all friend requests involving me
//     const requests = await FriendRequest.findAll({
//       where: {
//         [db.Sequelize.Op.or]: [{ senderId: userId }, { receiverId: userId }],
//       },
//     });

//     // Quick lookup map
//     const statusMap = {};
//     requests.forEach((reqObj) => {
//       const otherUserId =
//         reqObj.senderId === userId ? reqObj.receiverId : reqObj.senderId;
//       statusMap[otherUserId] =
//         reqObj.status === "accepted"
//           ? "friend"
//           : reqObj.senderId === userId
//           ? "request_sent"
//           : "request_received";
//     });

//     // ✅ Fetch my friends once
//     const myFriends = await FriendRequest.findAll({
//       where: {
//         status: "accepted",
//         [db.Sequelize.Op.or]: [{ senderId: userId }, { receiverId: userId }],
//       },
//     });

//     const myFriendIds = myFriends.map((f) =>
//       f.senderId === userId ? f.receiverId : f.senderId
//     );

//     // ✅ Attach mutual + status
//     const result = await Promise.all(
//       users.map(async (user) => {
//         const theirFriends = await FriendRequest.findAll({
//           where: {
//             status: "accepted",
//             [db.Sequelize.Op.or]: [
//               { senderId: user.id },
//               { receiverId: user.id },
//             ],
//           },
//         });

//         const theirFriendIds = theirFriends.map((f) =>
//           f.senderId === user.id ? f.receiverId : f.senderId
//         );

//         const mutual = myFriendIds.filter((id) =>
//           theirFriendIds.includes(id)
//         ).length;

//         return {
//           ...user.toJSON(),
//           status: statusMap[user.id] || "none",
//           mutual,
//         };
//       })
//     );

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

module.exports.searchUsers = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { query } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "❌ Unauthorized (no userId)" });
    }
    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "❌ Search query is required" });
    }

    // ✅ Get blocked users
    const blocks = await Block.findAll({
      where: { [Op.or]: [{ blockerId: userId }, { blockedId: userId }] },
    });
    const blockedIds = blocks.map((b) =>
      b.blockerId === userId ? b.blockedId : b.blockerId
    );

    // ✅ Base condition
    let whereCondition = {
      id: { [Op.ne]: userId },
      name: { [Op.like]: `%${query}%` },
    };
    if (blockedIds.length > 0) {
      whereCondition.id = {
        [Op.ne]: userId,
        [Op.notIn]: blockedIds,
      };
    }

    // ✅ Candidate users
    const users = await User.findAll({
      where: whereCondition,
      attributes: ["id", "name", "email", "image"],
    });
    const userIds = users.map((u) => u.id);

    // ✅ All requests involving me
    const requests = await FriendRequest.findAll({
      where: { [Op.or]: [{ senderId: userId }, { receiverId: userId }] },
    });

    const statusMap = {};
    requests.forEach((reqObj) => {
      const otherUserId =
        reqObj.senderId === userId ? reqObj.receiverId : reqObj.senderId;
      statusMap[otherUserId] =
        reqObj.status === "accepted"
          ? "friend"
          : reqObj.senderId === userId
          ? "request_sent"
          : "request_received";
    });

    // ✅ My friends
    const myFriends = await FriendRequest.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });
    const myFriendIds = myFriends.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );

    // ✅ Friendships of all candidate users
    let friendsMap = {};
    if (userIds.length > 0) {
      const allFriendships = await FriendRequest.findAll({
        where: {
          status: "accepted",
          [Op.or]: [
            { senderId: { [Op.in]: userIds } },
            { receiverId: { [Op.in]: userIds } },
          ],
        },
      });

      allFriendships.forEach((f) => {
        if (!friendsMap[f.senderId]) friendsMap[f.senderId] = [];
        if (!friendsMap[f.receiverId]) friendsMap[f.receiverId] = [];
        friendsMap[f.senderId].push(f.receiverId);
        friendsMap[f.receiverId].push(f.senderId);
      });
    }

    // ✅ Final result
    const result = users.map((user) => {
      const theirFriendIds = friendsMap[user.id] || [];
      const mutual = myFriendIds.filter((id) => theirFriendIds.includes(id)).length;

      return {
        ...user.toJSON(),
        status: statusMap[user.id] || "none",
        mutual,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Error in searchUsers:", err); // log full error
    res.status(500).json({ error: "Server error, check logs" });
  }
};




// 🔹 Friend Suggestions (People You May Know)
// module.exports.getSuggestions = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // ✅ Get all accepted friends of logged-in user
//     const myFriends = await FriendRequest.findAll({
//       where: {
//         status: "accepted",
//         [Op.or]: [{ senderId: userId }, { receiverId: userId }],
//       },
//     });

//     const myFriendIds = myFriends.map((f) =>
//       f.senderId === userId ? f.receiverId : f.senderId
//     );

//     // ✅ Get all friend requests (pending) involving logged-in user
//     const myRequests = await FriendRequest.findAll({
//       where: {
//         [Op.or]: [{ senderId: userId }, { receiverId: userId }],
//       },
//     });

//     const blockedIds = myRequests.map((r) =>
//       r.senderId === userId ? r.receiverId : r.senderId
//     );

//     // ✅ Find all other users (exclude self + friends + requests)
//     const candidates = await User.findAll({
//       where: {
//         id: {
//           [Op.ne]: userId,
//           [Op.notIn]: [...myFriendIds, ...blockedIds],
//         },
//       },
//       attributes: ["id", "name", "email", "image"],
//     });

//     // ✅ Compute mutual friends count for each candidate
//     const suggestions = await Promise.all(
//       candidates.map(async (user) => {
//         const theirFriends = await FriendRequest.findAll({
//           where: {
//             status: "accepted",
//             [Op.or]: [{ senderId: user.id }, { receiverId: user.id }],
//           },
//         });

//         const theirFriendIds = theirFriends.map((f) =>
//           f.senderId === user.id ? f.receiverId : f.senderId
//         );

//         const mutual = myFriendIds.filter((id) =>
//           theirFriendIds.includes(id)
//         ).length;

//         return {
//           ...user.toJSON(),
//           mutual,
//         };
//       })
//     );

//     // ✅ Sort by mutual friends (descending)
//     suggestions.sort((a, b) => b.mutual - a.mutual);

//     res.json(suggestions);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// 🔹 Friend Suggestions (People You May Know)
module.exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query; // pagination
    const offset = (page - 1) * limit;

    // ✅ Get all accepted friends of logged-in user
    const myFriends = await FriendRequest.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const myFriendIds = myFriends.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );

    // ✅ Get all friend requests (any status) involving logged-in user
    const myRequests = await FriendRequest.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const requestIds = myRequests.map((r) =>
      r.senderId === userId ? r.receiverId : r.senderId
    );

    const blocks = await db.BlockUser.findAll({
      where: {
        [Op.or]: [{ blockerId: userId }, { blockedId: userId }],
      },
    });

    const blockedIds = blocks.map((b) =>
      b.blockerId === userId ? b.blockedId : b.blockerId
    );

    const excludeIds = [...myFriendIds, ...requestIds, ...blockedIds];

    // ✅ Find all other users (exclude self + friends + requests)
    const candidates = await User.findAll({
      where: {
        id: {
          [Op.ne]: userId,
          [Op.notIn]: excludeIds,
        },
      },
      attributes: ["id", "name", "email", "image"],
    });


    // ✅ Compute mutual friends count for each candidate
    let suggestions = await Promise.all(
      candidates.map(async (user) => {
        const theirFriends = await FriendRequest.findAll({
          where: {
            status: "accepted",
            [Op.or]: [{ senderId: user.id }, { receiverId: user.id }],
          },
        });

        const theirFriendIds = theirFriends.map((f) =>
          f.senderId === user.id ? f.receiverId : f.senderId
        );

        const mutual = myFriendIds.filter((id) =>
          theirFriendIds.includes(id)
        ).length;

        return {
          ...user.toJSON(),
          mutual,
        };
      })
    );

    // ✅ Sort by mutual friends (desc)
    suggestions.sort((a, b) => b.mutual - a.mutual);

    // ✅ If no mutual friends found, shuffle randomly (fallback)
    if (suggestions.every((s) => s.mutual === 0)) {
      suggestions = suggestions.sort(() => Math.random() - 0.5);
    }

    // ✅ Apply pagination
    const paginated = suggestions.slice(offset, offset + parseInt(limit));

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total: suggestions.length,
      suggestions: paginated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🔹 Get User Profile (with friendship + mutual info)
module.exports.getProfile = async (req, res) => {
  try {
   
    const { userId } = req.params;  // target user
    const loggedInUserId = req.user.id;
     //console.log('id', userId,loggedInUserId);
    

    if (parseInt(userId) === loggedInUserId) {
      return res.status(400).json({ error: "❌ Cannot fetch your own profile here" });
    }

    // ✅ Check if user exists
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "image","description"],
    });
    if (!user) return res.status(404).json({ error: "❌ User not found" });

    // ✅ Check if blocked (either way)
    const block = await db.BlockUser.findOne({
      where: {
        [Op.or]: [
          { blockerId: loggedInUserId, blockedId: userId },
          { blockerId: userId, blockedId: loggedInUserId },
        ],
      },
    });
    if (block) {
      return res.status(403).json({ error: "❌ This user is blocked" });
    }

    // ✅ Check friendship status
    const request = await FriendRequest.findOne({
      where: {
        [Op.or]: [
          { senderId: loggedInUserId, receiverId: userId },
          { senderId: userId, receiverId: loggedInUserId },
        ],
      },
    });

    let status = "none";
    if (request) {
      if (request.status === "accepted") status = "friend";
      else if (request.status === "pending") {
        status =
          request.senderId === loggedInUserId ? "request_sent" : "request_received";
      } else if (request.status === "rejected") {
        status = "rejected";
      }
    }

    // ✅ Mutual friends count
    const mutual = await getMutualFriendsCount(loggedInUserId, userId);

    res.json({
      ...user.toJSON(),
      isFriend: status === "friend",
      status,
      mutual,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



