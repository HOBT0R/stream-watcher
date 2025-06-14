#!/bin/bash

# Configuration
REMOTE_USER="hob"
REMOTE_HOST="HobP4-A"
REMOTE_DIR="/home/hob/stream-watcher"
SERVICE_NAME="stream-watcher"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building application...${NC}"
npm install
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Creating remote directory...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR"

echo -e "${GREEN}Installing Node.js and npm...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"

echo -e "${GREEN}Copying files to remote server...${NC}"
scp -r dist package.json package-lock.json vite.config.ts vite.config.js 2>/dev/null $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

echo -e "${GREEN}Installing dependencies on remote server...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && npm install"

echo -e "${GREEN}Creating systemd service file...${NC}"
cat > /tmp/$SERVICE_NAME.service << EOL
[Unit]
Description=Stream Watcher Service
After=network.target

[Service]
User=$REMOTE_USER
WorkingDirectory=$REMOTE_DIR
ExecStart=/usr/bin/env bash -c 'cd $REMOTE_DIR && npx vite preview --host 0.0.0.0 --port 4173'
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

echo -e "${GREEN}Copying service file to remote server...${NC}"
scp /tmp/$SERVICE_NAME.service $REMOTE_USER@$REMOTE_HOST:/tmp/

echo -e "${GREEN}Setting up service...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "sudo mv /tmp/$SERVICE_NAME.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable $SERVICE_NAME && sudo systemctl restart $SERVICE_NAME"

echo -e "${GREEN}Checking service status...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "sudo systemctl status $SERVICE_NAME"

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "To check logs, run: ssh $REMOTE_USER@$REMOTE_HOST 'sudo journalctl -u $SERVICE_NAME -f'" 