const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotification = onDocumentCreated(
  "Notifications/{id}",
  async (event) => {
    const snap = event.data;

    if (!snap) {
      console.log("No data");
      return;
    }

    const data = snap.data();

    const title = data.title;
    const body = data.body;

    try {
      // 🔥 Get all users
      const usersSnap = await admin.firestore().collection("Users").get();

      const tokens = [];

      usersSnap.forEach((doc) => {
        const user = doc.data();
        if (user.fcmToken) {
          tokens.push(user.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log("No tokens found");
        return;
      }

      // 🔥 Send notification
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title,
          body,
        },
      });

      console.log("Notifications sent:", response.successCount);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
);