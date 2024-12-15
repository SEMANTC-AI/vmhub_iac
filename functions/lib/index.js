"use strict";
// src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserDelete = exports.onConfigSetup = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const infrastructure_1 = require("./infrastructure");
admin.initializeApp();
/**
 * Handles infrastructure provisioning when config is created
 */
exports.onConfigSetup = (0, firestore_1.onDocumentCreated)("users/{userId}/config/settings", async (event) => {
    var _a;
    if (!event.data) {
        console.error("No document snapshot provided for config setup.");
        return;
    }
    if (!((_a = event.params) === null || _a === void 0 ? void 0 : _a.userId)) {
        console.error("No userId parameter provided for config setup.");
        return;
    }
    const snap = event.data;
    const userId = event.params.userId;
    const data = snap.data();
    const cnpj = data === null || data === void 0 ? void 0 : data.cnpj;
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
    const provisioner = new infrastructure_1.InfrastructureProvisioner();
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
    }
    catch (error) {
        console.error(`Failed to provision infrastructure for CNPJ ${cnpj}:`, error);
        await snap.ref.update({
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            errorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (error instanceof Error) {
            const infraError = error;
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
exports.onUserDelete = (0, firestore_1.onDocumentDeleted)("users/{userId}", async (event) => {
    var _a;
    if (!((_a = event.params) === null || _a === void 0 ? void 0 : _a.userId)) {
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
//# sourceMappingURL=index.js.map