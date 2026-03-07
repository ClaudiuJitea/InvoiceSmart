#!/bin/bash

# Configuration - can be overridden by environment variables
CONTAINER_NAME=${MYSQL_CONTAINER_NAME:-"invoicesmart-mysql"}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-"root_password"}
MYSQL_DATABASE=${MYSQL_DATABASE:-"invoicesmart"}
MYSQL_USER=${MYSQL_USER:-"user"}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-"user_password"}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_IMAGE=${MYSQL_IMAGE:-"mysql:8.0"}
APP_ADMIN_USERNAME=${ADMIN_USERNAME:-"admin"}
APP_ADMIN_PASSWORD=${ADMIN_PASSWORD:-"admin123"}
APP_DEFAULT_USER_USERNAME=${DEFAULT_USER_USERNAME:-""}
APP_DEFAULT_USER_PASSWORD=${DEFAULT_USER_PASSWORD:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_login_info() {
    echo ""
    log "Deployment summary"
    echo "MySQL:"
    echo "  Host: 127.0.0.1"
    echo "  Port: ${MYSQL_PORT}"
    echo "  Database: ${MYSQL_DATABASE}"
    echo "  Root user: root"
    echo "  Root password: ${MYSQL_ROOT_PASSWORD}"
    echo "  App DB user: ${MYSQL_USER}"
    echo "  App DB password: ${MYSQL_PASSWORD}"
    echo ""
    echo "InvoiceSmart login:"
    echo "  Admin username: ${APP_ADMIN_USERNAME}"
    echo "  Admin password: ${APP_ADMIN_PASSWORD}"

    if [ -n "${APP_DEFAULT_USER_USERNAME}" ] && [ -n "${APP_DEFAULT_USER_PASSWORD}" ]; then
        echo "  User username: ${APP_DEFAULT_USER_USERNAME}"
        echo "  User password: ${APP_DEFAULT_USER_PASSWORD}"
    else
        echo "  User account: create one from Register page (no default user is seeded)"
    fi
    echo ""
}

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install it first."
    exit 1
fi

wait_for_mysql() {
    log "Waiting for MySQL to be ready..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$CONTAINER_NAME" mysqladmin ping -h localhost -u root --password="$MYSQL_ROOT_PASSWORD" &>/dev/null; then
            log "MySQL is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "MySQL failed to start within the expected time."
    return 1
}

deploy() {
    if [ "$(docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
        if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
            warn "Container '$CONTAINER_NAME' is already running."
            print_login_info
        else
            log "Starting existing container '$CONTAINER_NAME'..."
            docker start "$CONTAINER_NAME"
            wait_for_mysql
            print_login_info
        fi
    else
        log "Deploying new MySQL container '$CONTAINER_NAME'..."
        docker run --name "$CONTAINER_NAME" \
            -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
            -e MYSQL_DATABASE="$MYSQL_DATABASE" \
            -e MYSQL_USER="$MYSQL_USER" \
            -e MYSQL_PASSWORD="$MYSQL_PASSWORD" \
            -p "${MYSQL_PORT}:3306" \
            -d "$MYSQL_IMAGE"
            
        if [ $? -eq 0 ]; then
            log "Container created successfully."
            wait_for_mysql
            print_login_info
        else
            error "Failed to create container."
            exit 1
        fi
    fi
}

stop() {
    if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
        log "Stopping container '$CONTAINER_NAME'..."
        docker stop "$CONTAINER_NAME"
    else
        warn "Container '$CONTAINER_NAME' is not running."
    fi
}

start() {
    if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
        warn "Container '$CONTAINER_NAME' is already running."
    else
        if [ "$(docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
            log "Starting container '$CONTAINER_NAME'..."
            docker start "$CONTAINER_NAME"
            wait_for_mysql
        else
            error "Container '$CONTAINER_NAME' does not exist. Use 'deploy' first."
        fi
    fi
}

restart() {
    log "Restarting container '$CONTAINER_NAME'..."
    docker restart "$CONTAINER_NAME"
    wait_for_mysql
}

delete() {
    if [ "$(docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
        log "Removing container '$CONTAINER_NAME'..."
        docker rm -f "$CONTAINER_NAME"
    else
        warn "Container '$CONTAINER_NAME' does not exist."
    fi
}

status() {
    if [ "$(docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
        state=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME")
        log "Container '$CONTAINER_NAME' exists and is in state: $state"
        if [ "$state" == "running" ]; then
            docker ps -f name=^/${CONTAINER_NAME}$
        fi
    else
        warn "Container '$CONTAINER_NAME' does not exist."
    fi
}

# Main menu / Argument handling
case "$1" in
    deploy)
        deploy
        ;;
    stop)
        stop
        ;;
    start)
        start
        ;;
    restart)
        restart
        ;;
    delete)
        delete
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {deploy|start|stop|restart|delete|status}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Create and start the MySQL container if it doesn't exist"
        echo "  start   - Start the container if it's stopped"
        echo "  stop    - Stop the running container"
        echo "  restart - Restart the container"
        echo "  delete  - Force remove the container"
        echo "  status  - Show container status"
        exit 1
esac
