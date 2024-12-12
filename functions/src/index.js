// terraform/functions/src/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const InfrastructureProvisioner = require('./infrastructure');

admin.initializeApp();

// Handle new user creation
exports.onNewUserSetup = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const userId = context.params.userId;
        
        try {
            // Store initial user metadata
            await snap.ref.set({
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'pending_setup',
                email: data.email || null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`New user created: ${userId}`);
        } catch (error) {
            console.error(`Failed to setup new user ${userId}:`, error);
            await snap.ref.update({
                status: 'error',
                error: error.message,
                errorTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            throw error;
        }
    });

// Handle token setup
exports.onTokensSetup = functions.firestore
    .document('users/{userId}/{userId}/{cnpj}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const cnpj = context.params.cnpj;
        const userId = context.params.userId;

        console.log(`Processing new setup for user ${userId} with CNPJ ${cnpj}`);

        const provisioner = new InfrastructureProvisioner();

        try {
            // Get user data
            const userDoc = await admin.firestore()
                .collection('users')
                .doc(userId)
                .get();
            
            const userData = userDoc.data();

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
        } catch (error) {
            console.error(`Failed to provision infrastructure for CNPJ ${cnpj}:`, error);

            // Update status to indicate failure
            await snap.ref.update({
                status: 'error',
                error: error.message,
                errorTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            throw error;
        }
    });