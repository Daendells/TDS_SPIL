#!/bin/bash

# =====================================
# Development Helper Scripts
# =====================================

echo "🐳 TDS Docker Development Helper"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display menu
show_menu() {
    echo ""
    echo "Select an option:"
    echo "1) Start all services"
    echo "2) Stop all services"
    echo "3) Rebuild and restart all"
    echo "4) View logs (all)"
    echo "5) View backend logs"
    echo "6) View frontend logs"
    echo "7) Access backend shell"
    echo "8) Access MySQL shell"
    echo "9) Run migration manually"
    echo "10) Run seeder manually"
    echo "11) Clean everything (remove volumes)"
    echo "0) Exit"
    echo ""
}

# Start services
start_services() {
    echo -e "${GREEN}Starting all services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Services started!${NC}"
    echo "Backend: http://localhost:8081"
    echo "Frontend: http://localhost:3001"
}

# Stop services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}Services stopped!${NC}"
}

# Rebuild and restart
rebuild_services() {
    echo -e "${YELLOW}Rebuilding and restarting services...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}Services rebuilt and started!${NC}"
}

# View all logs
view_logs() {
    echo -e "${GREEN}Viewing all logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# View backend logs
view_backend_logs() {
    echo -e "${GREEN}Viewing backend logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f tds_backend
}

# View frontend logs
view_frontend_logs() {
    echo -e "${GREEN}Viewing frontend logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f tds_frontend
}

# Access backend shell
backend_shell() {
    echo -e "${GREEN}Accessing backend shell...${NC}"
    docker exec -it tds_backend sh
}

# Access MySQL shell
mysql_shell() {
    echo -e "${GREEN}Accessing MySQL shell...${NC}"
    docker exec -it mysql-container mysql -u tds_user -ptds_pass tds
}

# Run migration
run_migration() {
    echo -e "${GREEN}Running database migration...${NC}"
    docker exec tds_backend ./migrate
    echo -e "${GREEN}Migration completed!${NC}"
}

# Run seeder
run_seeder() {
    echo -e "${GREEN}Running database seeder...${NC}"
    docker exec tds_backend ./seed
    echo -e "${GREEN}Seeding completed!${NC}"
}

# Clean everything
clean_all() {
    echo -e "${RED}⚠️  WARNING: This will remove all containers, volumes, and data!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo -e "${YELLOW}Cleaning everything...${NC}"
        docker-compose down -v
        docker system prune -f
        echo -e "${GREEN}Cleanup completed!${NC}"
    else
        echo -e "${GREEN}Cleanup cancelled.${NC}"
    fi
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice [0-11]: " choice
    
    case $choice in
        1) start_services ;;
        2) stop_services ;;
        3) rebuild_services ;;
        4) view_logs ;;
        5) view_backend_logs ;;
        6) view_frontend_logs ;;
        7) backend_shell ;;
        8) mysql_shell ;;
        9) run_migration ;;
        10) run_seeder ;;
        11) clean_all ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) echo -e "${RED}Invalid option!${NC}" ;;
    esac
done
