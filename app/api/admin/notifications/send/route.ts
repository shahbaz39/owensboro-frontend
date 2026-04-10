import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

const firestore = admin.firestore();

const GLOBAL_TOPIC = "all_users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Incoming request body:", body);

    const { notificationId, mode = "topic", targetUserId } = body;

    // ── Validate notificationId ──────────────────────────────────────────────
    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        { message: "notificationId is required." },
        { status: 400 }
      );
    }

    // ── Validate mode ────────────────────────────────────────────────────────
    if (!["topic", "token"].includes(mode)) {
      return NextResponse.json(
        { message: "mode must be 'topic' or 'token'." },
        { status: 400 }
      );
    }

    if (mode === "token" && !targetUserId) {
      return NextResponse.json(
        { message: "targetUserId is required when mode is 'token'." },
        { status: 400 }
      );
    }

    // ── Fetch notification doc ───────────────────────────────────────────────
    const notificationRef = firestore
      .collection("notifications")
      .doc(notificationId);

    const notificationSnap = await notificationRef.get();

    if (!notificationSnap.exists) {
      return NextResponse.json(
        { message: "Notification not found." },
        { status: 404 }
      );
    }

    const notification = notificationSnap.data() || {};
    console.log("📄 Notification data:", notification);

    await notificationRef.update({ status: "sending", errorMessage: "" });

    // ════════════════════════════════════════════════════════════════════════
    //  MODE: TOPIC  →  broadcast to all_users topic
    // ════════════════════════════════════════════════════════════════════════
    if (mode === "topic") {
      console.log(`📡 Sending via topic: ${GLOBAL_TOPIC}`);

      const message: admin.messaging.Message = {
        topic: GLOBAL_TOPIC,

        notification: {
          title: String(notification.title || ""),
          body: String(notification.body || ""),
        },

        data: {
          notificationId,
          title: String(notification.title || ""),
          body: String(notification.body || ""),
          image: String(notification.image || ""),
          mode: "topic",
        },

        android: {
          priority: "high",
          notification: {
            ...(notification.image
              ? { imageUrl: String(notification.image) }
              : {}),
          },
        },

        apns: {
          payload: {
            aps: {
              alert: {
                title: String(notification.title || ""),
                body: String(notification.body || ""),
              },
              sound: "default",
              badge: 1,
              "content-available": 1,
            },
          },
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          fcmOptions: notification.image
            ? { imageUrl: String(notification.image) }
            : undefined,
        },

        webpush: {
          notification: {
            title: String(notification.title || ""),
            body: String(notification.body || ""),
            ...(notification.image
              ? { image: String(notification.image) }
              : {}),
          },
        },
      };

      const messageId = await admin.messaging().send(message);
      console.log("✅ Topic message sent. ID:", messageId);

      // Count subscribers for informational purposes
      const usersSnap = await firestore.collection("Users").get();
      const subscriberCount = usersSnap.size;

      await notificationRef.update({
        sent: true,
        sentCount: subscriberCount,
        failedCount: 0,
        status: "sent",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        errorMessage: "",
        deliveryMode: "topic",
        targetTopic: GLOBAL_TOPIC,
      });

      return NextResponse.json({
        message: "Notification sent to all_users topic.",
        sent: true,
        sentCount: subscriberCount,
        failedCount: 0,
        status: "sent",
        deliveryMode: "topic",
        targetTopic: GLOBAL_TOPIC,
        sentAt: new Date().toISOString(),
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  MODE: TOKEN  →  send to a specific user's device token
    // ════════════════════════════════════════════════════════════════════════
    if (mode === "token") {
      console.log(`🎯 Sending via token to user: ${targetUserId}`);

      const userRef = firestore.collection("Users").doc(targetUserId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        await notificationRef.update({
          sent: false,
          sentCount: 0,
          failedCount: 1,
          status: "failed",
          errorMessage: `User ${targetUserId} not found.`,
        });

        return NextResponse.json(
          { message: `User ${targetUserId} not found.` },
          { status: 404 }
        );
      }

      const userData = userSnap.data() || {};

      const deviceToken =
        userData.fcm_token ||
        userData.fcmToken ||
        userData.FCMToken ||
        userData.token ||
        userData.deviceToken ||
        userData.notificationToken ||
        "";

      if (!deviceToken || typeof deviceToken !== "string" || !deviceToken.trim()) {
        await notificationRef.update({
          sent: false,
          sentCount: 0,
          failedCount: 1,
          status: "failed",
          errorMessage: `No FCM token found for user ${targetUserId}.`,
          deliveryMode: "token",
          targetUserId,
        });

        return NextResponse.json(
          {
            message: `No FCM token found for user ${targetUserId}.`,
            sent: false,
            sentCount: 0,
            failedCount: 1,
            status: "failed",
          },
          { status: 400 }
        );
      }

      console.log(
        `🔑 Token found for user ${targetUserId}: ${deviceToken.slice(0, 20)}...`
      );

      const message: admin.messaging.Message = {
        token: deviceToken.trim(),

        notification: {
          title: String(notification.title || ""),
          body: String(notification.body || ""),
        },

        data: {
          notificationId,
          title: String(notification.title || ""),
          body: String(notification.body || ""),
          image: String(notification.image || ""),
          mode: "token",
          targetUserId,
        },

        android: {
          priority: "high",
          notification: {
            ...(notification.image
              ? { imageUrl: String(notification.image) }
              : {}),
          },
        },

        apns: {
          payload: {
            aps: {
              alert: {
                title: String(notification.title || ""),
                body: String(notification.body || ""),
              },
              sound: "default",
              badge: 1,
              "content-available": 1,
            },
          },
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          fcmOptions: notification.image
            ? { imageUrl: String(notification.image) }
            : undefined,
        },

        webpush: {
          notification: {
            title: String(notification.title || ""),
            body: String(notification.body || ""),
            ...(notification.image
              ? { image: String(notification.image) }
              : {}),
          },
        },
      };

      try {
        const messageId = await admin.messaging().send(message);
        console.log(`✅ Token message sent to user ${targetUserId}. ID:`, messageId);

        await notificationRef.update({
          sent: true,
          sentCount: 1,
          failedCount: 0,
          status: "sent",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          errorMessage: "",
          deliveryMode: "token",
          targetUserId,
        });

        return NextResponse.json({
          message: `Notification sent to user ${targetUserId}.`,
          sent: true,
          sentCount: 1,
          failedCount: 0,
          status: "sent",
          deliveryMode: "token",
          targetUserId,
          sentAt: new Date().toISOString(),
        });
      } catch (sendError: any) {
        console.error(
          `❌ Failed to send to user ${targetUserId}:`,
          sendError
        );

        const errCode = sendError?.errorInfo?.code || "";

        // Clean up invalid token
        if (
          errCode === "messaging/invalid-registration-token" ||
          errCode === "messaging/registration-token-not-registered"
        ) {
          await userRef.update({ fcm_token: "" });
          console.log(`🧹 Cleared invalid token for user ${targetUserId}`);
        }

        await notificationRef.update({
          sent: false,
          sentCount: 0,
          failedCount: 1,
          status: "failed",
          errorMessage:
            sendError?.message || `Failed to deliver to user ${targetUserId}.`,
          deliveryMode: "token",
          targetUserId,
        });

        return NextResponse.json(
          {
            message:
              sendError?.message ||
              `Failed to send notification to user ${targetUserId}.`,
            sent: false,
            sentCount: 0,
            failedCount: 1,
            status: "failed",
          },
          { status: 500 }
        );
      }
    }

    // Fallback (should never reach here)
    return NextResponse.json(
      { message: "Invalid mode." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("🔥 FCM send error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to send notification." },
      { status: 500 }
    );
  }
}