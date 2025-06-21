FROM node:20-alpine

# Install curl for healthchecks and firebase-tools
RUN apk add --no-cache curl && npm install -g firebase-tools

# Set up the working directory
WORKDIR /app

# Copy the Firebase configuration files and the entrypoint script
COPY firebase.json .
COPY .firebaserc .
COPY seed_data ./seed_data
COPY entrypoint.sh .

# Make the entrypoint script executable
RUN chmod +x ./entrypoint.sh

# Expose the ports for the auth emulator and the UI
EXPOSE 9099 4000

# Set the entrypoint for the container
ENTRYPOINT ["./entrypoint.sh"] 