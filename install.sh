#!/usr/bin/env bash
# ==============================================================================
# BT Panel — Automated Management Script
# ==============================================================================
set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

show_header() {
    clear 2>/dev/null || true
    echo -e "${CYAN}${BOLD}=====================================================${NC}"
    echo -e "${CYAN}${BOLD}             BT Panel Management Script              ${NC}"
    echo -e "${CYAN}${BOLD}=====================================================${NC}"
    echo
}

install_node() {
    echo -e "${YELLOW}--> Checking Node.js installation...${NC}"
    if command -v node >/dev/null 2>&1; then
        NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VER" -ge 20 ]; then
            echo -e "${GREEN}✓ Node.js $(node -v) is installed.${NC}"
            return
        fi
    fi

    echo -e "${YELLOW}--> Installing Node.js 22...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo -e "${RED}Package manager apt-get not found. Please install Node.js 20+ manually.${NC}"
    fi
}

install_docker() {
    echo -e "${YELLOW}--> Checking Docker installation...${NC}"
    if command -v docker >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker is installed.${NC}"
    else
        echo -e "${YELLOW}--> Installing Docker...${NC}"
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update -y
            sudo apt-get install -y docker.io || curl -fsSL https://get.docker.com | sh
            sudo systemctl enable --now docker 2>/dev/null || true
            echo -e "${GREEN}✓ Docker installed successfully.${NC}"
        else
            echo -e "${RED}Package manager apt-get not found. Please install Docker manually.${NC}"
        fi
    fi
}

install_pm2() {
    echo -e "${YELLOW}--> Checking PM2 installation...${NC}"
    if command -v pm2 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PM2 is installed.${NC}"
    else
        echo -e "${YELLOW}--> Installing PM2 globally...${NC}"
        if [ "$EUID" -eq 0 ]; then
            npm install -g pm2
        elif command -v sudo >/dev/null 2>&1; then
            sudo npm install -g pm2
        else
            npm install -g pm2
        fi
        echo -e "${GREEN}✓ PM2 installed successfully.${NC}"
    fi
}

setup_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}--> Creating default .env file...${NC}"
        cat <<EOF > .env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/btpanel
PORT=3000
SEED_DEMO=false
COOKIE_SECURE=false
EOF
        echo -e "${GREEN}✓ .env file created.${NC}"
    else
        echo -e "${GREEN}✓ .env file already exists.${NC}"
    fi
}

install_panel() {
    show_header
    echo -e "${BOLD}Starting Panel Installation...${NC}\n"

    install_node
    install_docker
    install_pm2
    setup_env

    echo -e "\n${YELLOW}--> Installing dependencies...${NC}"
    npm ci || npm install

    echo -e "\n${YELLOW}--> Building BT Panel...${NC}"
    npm run build

    echo -e "\n${YELLOW}--> Starting BT Panel on port 3000 with PM2...${NC}"
    if command -v pm2 >/dev/null 2>&1 && pm2 describe bt-panel >/dev/null 2>&1; then
        pm2 restart bt-panel
    else
        pm2 start npm --name "bt-panel" -- start -- -p 3000 || pm2 start "npm start" --name "bt-panel"
    fi
    pm2 save 2>/dev/null || true

    echo -e "\n${GREEN}${BOLD}=====================================================${NC}"
    echo -e "${GREEN}${BOLD} ✓ BT Panel installed and running on port 3000!      ${NC}"
    echo -e "${GREEN}${BOLD}=====================================================${NC}\n"
    read -p "Press Enter to return to menu..."
}

update_panel() {
    show_header
    echo -e "${BOLD}Updating BT Panel...${NC}\n"

    if [ -d .git ]; then
        echo -e "${YELLOW}--> Pulling latest code from git...${NC}"
        git pull || echo -e "${YELLOW}Git pull skipped or failed.${NC}"
    fi

    echo -e "\n${YELLOW}--> Installing dependencies...${NC}"
    npm ci || npm install

    echo -e "\n${YELLOW}--> Building BT Panel...${NC}"
    npm run build

    echo -e "\n${YELLOW}--> Restarting BT Panel...${NC}"
    if command -v pm2 >/dev/null 2>&1 && pm2 describe bt-panel >/dev/null 2>&1; then
        pm2 restart bt-panel
    else
        pm2 start npm --name "bt-panel" -- start -- -p 3000 || pm2 start "npm start" --name "bt-panel"
    fi

    echo -e "\n${GREEN}${BOLD}✓ BT Panel update complete!${NC}\n"
    read -p "Press Enter to return to menu..."
}

create_admin() {
    show_header
    echo -e "${BOLD}Create Admin User${NC}\n"

    read -p "Enter Username [admin]: " USERNAME
    USERNAME="${USERNAME:-admin}"

    read -p "Enter Email [admin@example.com]: " EMAIL
    EMAIL="${EMAIL:-admin@example.com}"

    while true; do
        read -s -p "Enter Password (min 8 chars): " PASSWORD
        echo
        if [ ${#PASSWORD} -ge 8 ]; then
            break
        fi
        echo -e "${RED}Password must be at least 8 characters long.${NC}"
    done

    echo -e "\n${YELLOW}--> Creating admin account '${USERNAME}'...${NC}"
    if npx tsx scripts/create-admin.ts "$USERNAME" "$EMAIL" "$PASSWORD" owner; then
        echo -e "${GREEN}${BOLD}✓ Admin user created successfully!${NC}"
    else
        echo -e "${RED}Failed to create admin user. Make sure the database is running.${NC}"
    fi

    echo
    read -p "Press Enter to return to menu..."
}

restart_panel() {
    show_header
    echo -e "${BOLD}Restarting BT Panel...${NC}\n"

    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart bt-panel || pm2 start npm --name "bt-panel" -- start -- -p 3000
        echo -e "\n${GREEN}${BOLD}✓ BT Panel restarted successfully!${NC}"
    else
        echo -e "${RED}PM2 is not installed. Please run option 1 (Install Panel) first.${NC}"
    fi

    echo
    read -p "Press Enter to return to menu..."
}

main_menu() {
    while true; do
        show_header
        echo -e "${BOLD}Menu Options:${NC}"
        echo -e "  ${CYAN}1.${NC} Install Panel"
        echo -e "  ${CYAN}2.${NC} Update Panel"
        echo -e "  ${CYAN}3.${NC} Create Admin User"
        echo -e "  ${CYAN}4.${NC} Restart Panel"
        echo -e "  ${CYAN}5.${NC} Exit"
        echo
        read -p "Select an option [1-5]: " CHOICE

        case "$CHOICE" in
            1) install_panel ;;
            2) update_panel ;;
            3) create_admin ;;
            4) restart_panel ;;
            5)
                echo -e "\n${GREEN}Exiting. Goodbye!${NC}\n"
                exit 0
                ;;
            *)
                echo -e "\n${RED}Invalid option. Please choose 1-5.${NC}"
                sleep 1.5
                ;;
        esac
    done
}

# Handle command line arguments if passed directly
case "$1" in
    --install|1) install_panel ;;
    --update|2) update_panel ;;
    --admin|3) create_admin ;;
    --restart|4) restart_panel ;;
    *) main_menu ;;
esac
