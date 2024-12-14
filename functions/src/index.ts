// src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { InfrastructureProvisioner } from "./infrastructure";
import { UserData, InfrastructureError } from "./types";

admin.initializeApp();

/**
 * Handles new user creation in Firestore
 */
export const onNewUserSetup = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const data = snap.data() as UserData;
    const userId = context.params.userId;

    try {
      await snap.ref.set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending_setup",
        email: data.email || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`New user created: ${userId}`);
    } catch (error) {
      console.error(`Failed to setup new user ${userId}:`, error);
      await snap.ref.update({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        errorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      throw error;
    }
  });

/**
 * Handles infrastructure provisioning when tokens are set up
 */
export const onTokensSetup = functions.firestore
  .document("users/{userId}/config/{cnpj}")
  .onCreate(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const userId = context.params.userId;
    const cnpj = context.params.cnpj;

    console.log(`Processing new setup for user ${userId} with CNPJ ${cnpj}`);

    const provisioner = new InfrastructureProvisioner();

    try {
      const userDoc = await admin.firestore()
        .collection("users")
        .doc(userId)
        .get();

      const userData = userDoc.data() as UserData;

      if (!userData?.email) {
        throw new Error("User email not found");
      }

      await snap.ref.update({
        status: "provisioning",
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        userEmail: userData.email,
      });

      await provisioner.provision(cnpj, userData.email);

      await snap.ref.update({
        status: "provisioned",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Successfully provisioned infrastructure for CNPJ ${cnpj}`);
    } catch (error) {
      console.error(`Failed to provision infrastructure for CNPJ ${cnpj}:`, error);

      await snap.ref.update({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        errorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (error instanceof Error) {
        const infraError = error as InfrastructureError;
        console.error("Infrastructure Error:", {
          code: infraError.code,
          details: infraError.details,
          message: infraError.message,
        });
      }

      throw error;
    }
  });

/**
 * Handles user deletion cleanup
 */
export const onUserDelete = functions.firestore
  .document("users/{userId}")
  .onDelete(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    console.log(`User ${context.params.userId} deleted`);
  });
