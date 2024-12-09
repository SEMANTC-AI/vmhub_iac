// terraform/functions/src/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const InfrastructureProvisioner = require('./infrastructure');

admin.initializeApp();

exports.onNewUserSetup = functions.firestore
    .document('users/{userId}/tokens/{cnpj}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const cnpj = context.params.cnpj;
        const userId = context.params.userId;

        console.log(`processing new setup for user ${userId} with CNPJ ${cnpj}`);

        const provisioner = new InfrastructureProvisioner();

        try {
            // update status to indicate provisioning has started
            await snap.ref.update({
                status: 'provisioning',
                startedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // provision infrastructure
            await provisioner.provision(cnpj);

            // update status to indicate success
            await snap.ref.update({
                status: 'provisioned',
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`successfully provisioned infrastructure for CNPJ ${cnpj}`);
        } catch (error) {
            console.error(`failed to provision infrastructure for CNPJ ${cnpj}:`, error);

            // update status to indicate failure
            await snap.ref.update({
                status: 'error',
                error: error.message,
                errorTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            throw error;
        }
    });