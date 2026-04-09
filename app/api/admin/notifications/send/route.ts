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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Incoming request body:", body);

    const notificationId = body?.notificationId;

    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        { message: "notificationId is required." },
        { status: 400 }
      );
    }

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

    await notificationRef.update({
      status: "sending",
      errorMessage: "",
    });

    const usersSnap = await firestore.collection("Users").get();

    const tokens: string[] = [];

    usersSnap.forEach((userDoc) => {
      const data = userDoc.data();

      const possibleToken =
        data.fcm_token ||
        data.fcmToken ||
        data.FCMToken ||
        data.token ||
        data.deviceToken ||
        data.notificationToken ||
        "";

      if (typeof possibleToken === "string" && possibleToken.trim()) {
        tokens.push(possibleToken.trim());
      }
    });

    console.log("📱 Total tokens found:", tokens.length);
    console.log("🔑 Sample tokens:", tokens.slice(0, 3));

    if (tokens.length === 0) {
      await notificationRef.update({
        sent: false,
        sentCount: 0,
        failedCount: 0,
        status: "failed",
        errorMessage: "No FCM tokens found in Users collection.",
      });

      return NextResponse.json(
        {
          message: "No FCM tokens found in Users collection.",
          sent: false,
          sentCount: 0,
          failedCount: 0,
          status: "failed",
        },
        { status: 400 }
      );
    }

    // ✅ SEND FCM
    const response = await admin.messaging().sendEachForMulticast({
      tokens,

      notification: {
        title: String(notification.title || ""),
        body: String(notification.body || ""),
      },

      data: {
        notificationId,
        title: String(notification.title || ""),
        body: String(notification.body || ""),
        image: String(notification.image || ""),
      },

      android: {
        priority: "high",
        notification: {
          ...(notification.image
            ? { imageUrl: String(notification.image) }
            : {}),
        },
      },

      // ✅ iOS config with debug-friendly headers
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
          ? {
              imageUrl: String(notification.image),
            }
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
    });

    console.log("📤 FCM Full Response:", JSON.stringify(response, null, 2));

    // ✅ LOG EACH TOKEN RESULT (VERY IMPORTANT)
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        console.log(`✅ Success for token ${idx}`);
      } else {
        console.log(`❌ Failed for token ${idx}`);
        console.log("👉 Token:", tokens[idx]);
        console.log("👉 Error code:", resp.error?.code);
        console.log("👉 Error message:", resp.error?.message);

        const err = resp.error?.code || "";

        if (
          err === "messaging/invalid-registration-token" ||
          err === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // ✅ CLEAN INVALID TOKENS
    if (invalidTokens.length > 0) {
      console.log("🧹 Removing invalid tokens:", invalidTokens);

      const usersSnap = await firestore.collection("Users").get();

      usersSnap.forEach(async (userDoc) => {
        const data = userDoc.data();

        if (invalidTokens.includes(data.fcm_token)) {
          await userDoc.ref.update({
            fcm_token: "",
          });
        }
      });
    }

    const sent = response.successCount > 0 && response.failureCount === 0;

    const status =
      response.successCount > 0 && response.failureCount > 0
        ? "partial"
        : response.successCount > 0
        ? "sent"
        : "failed";

    await notificationRef.update({
      sent,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      status,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      errorMessage:
        response.failureCount > 0
          ? `${response.failureCount} device(s) failed.`
          : "",
    });

    return NextResponse.json({
      message: "Notification processed.",
      sent,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      status,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("🔥 FCM send error:", error);

    return NextResponse.json(
      {
        message: error?.message || "Failed to send notification.",
      },
      { status: 500 }
    );
  }
}