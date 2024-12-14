"use strict";
// functions/src/index.ts
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
exports.onUserDelete = exports.onTokensSetup = exports.onNewUserSetup = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const infrastructure_1 = require("./infrastructure");
admin.initializeApp();
exports.onNewUserSetup = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    const userId = context.params.userId;
    try {
        await snap.ref.set({
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending_setup',
            email: data.email || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`New user created: ${userId}`);
    }
    catch (error) {
        console.error(`Failed to setup new user ${userId}:`, error);
        await snap.ref.update({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            errorTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        throw error;
    }
});
exports.onTokensSetup = functions.firestore
    .document('users/{userId}/{userId}/{cnpj}')
    .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const cnpj = context.params.cnpj;
    console.log(`Processing new setup for user ${userId} with CNPJ ${cnpj}`);
    const provisioner = new infrastructure_1.InfrastructureProvisioner();
    try {
        // Get user data
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.email)) {
            throw new Error('User email not found');
        }
        // Update status to indicate provisioning has started
        await snap.ref.update({
            status: 'provisioning',
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            userEmail: userData.email
        });
        // Provision infrastructure
        await provisioner.provision(cnpj, userData.email);
        // Update status to indicate success
        await snap.ref.update({
            status: 'provisioned',
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Successfully provisioned infrastructure for CNPJ ${cnpj}`);
    }
    catch (error) {
        console.error(`Failed to provision infrastructure for CNPJ ${cnpj}:`, error);
        // Update status to indicate failure
        await snap.ref.update({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            errorTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        if (error instanceof Error) {
            const infraError = error;
            console.error('Infrastructure Error:', {
                code: infraError.code,
                details: infraError.details,
                message: infraError.message
            });
        }
        throw error;
    }
});
// Optional: Add a function to handle cleanup if needed
exports.onUserDelete = functions.firestore
    .document('users/{userId}')
    .onDelete(async (snap, context) => {
    // Add cleanup logic here if needed
    console.log(`User ${context.params.userId} deleted`);
});
//# sourceMappingURL=index.js.map