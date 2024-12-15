// src/index.ts

import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { InfrastructureProvisioner } from "./infrastructure";
import { InfrastructureError } from "./types";

admin.initializeApp();

/**
 * Handles infrastructure provisioning when config is created
 */
export const onConfigSetup = onDocumentCreated("users/{userId}/config/settings", async (event) => {
  if (!event.data) {
    console.error("No document snapshot provided for config setup.");
    return;
  }
  if (!event.params?.userId) {
    console.error("No userId parameter provided for config setup.");
    return;
  }

  const snap = event.data;
  const userId = event.params.userId;
  const data = snap.data();
  const cnpj = data?.cnpj;

  console.log(`Processing new setup for user ${userId} with data:`, data);

  if (!cnpj) {
    console.error("No CNPJ found in config document");
    await snap.ref.update({
      status: "error",
      error: "No CNPJ provided",
      errorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const provisioner = new InfrastructureProvisioner();

  try {
    await snap.ref.update({
      status: "provisioning",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await provisioner.provision(cnpj);

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
export const onUserDelete = onDocumentDeleted("users/{userId}", async (event) => {
  if (!event.params?.userId) {
    console.error("No userId parameter provided for user deletion.");
    return;
  }

  const userId = event.params.userId;
  // TODO: Add cleanup logic for all created resources
  // This could include:
  // - Deleting GCS buckets
  // - Deleting BigQuery datasets
  // - Removing Cloud Run jobs
  // - Removing Cloud Scheduler jobs
  console.log(`User ${userId} deleted`);
});
