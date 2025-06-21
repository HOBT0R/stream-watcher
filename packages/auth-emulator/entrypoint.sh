#!/bin/sh
set -e

# This script is the entrypoint for the Docker container.
# It ensures that environment variables are properly loaded before starting the service.

echo "--- Starting Firebase Auth Emulator ---"
echo "Using Project ID: ${FIREBASE_PROJECT_ID}"

# Start the Firebase emulator
# The --import flag will seed the emulator with data from the specified directory
firebase emulators:start --project ${FIREBASE_PROJECT_ID} --only auth --import=./seed_data

# The --config flag is used to specify the location of the firebase.json file.
# The host and port configurations are now read from firebase.json. 