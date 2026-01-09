#!/bin/bash
# =============================================================================
# Build and Run Super Docker Image
# =============================================================================
# This script builds and runs the combined frontend + backend Docker image
#
# Usage:
#   ./docker-build-run.sh          # Build and run
#   ./docker-build-run.sh build    # Build only
#   ./docker-build-run.sh run      # Run only (assumes image exists)
#   ./docker-build-run.sh stop     # Stop running container
#   ./docker-build-run.sh logs     # View logs
# =============================================================================

set -e

IMAGE_NAME="cfp-mvp"
CONTAINER_NAME="cfp-mvp-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

build_image() {
    print_status "Building Docker image: ${IMAGE_NAME}..."
    docker build -f Dockerfile.super -t ${IMAGE_NAME}:latest .
    print_status "Build complete!"
}

run_container() {
    # Stop existing container if running
    if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
        print_warning "Stopping existing container..."
        docker stop ${CONTAINER_NAME}
    fi
    
    # Remove existing container if exists
    if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
        docker rm ${CONTAINER_NAME}
    fi

    print_status "Starting container: ${CONTAINER_NAME}..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p 8080:80 \
        -p 8000:8000 \
        --restart unless-stopped \
        ${IMAGE_NAME}:latest

    print_status "Container started successfully!"
    echo ""
    echo "  Frontend: http://localhost:8080"
    echo "  Backend:  http://localhost:8000"
    echo "  API:      http://localhost:8080/api/"
    echo "  Health:   http://localhost:8000/api/health/"
    echo ""
    print_status "Run './docker-build-run.sh logs' to view logs"
}

stop_container() {
    if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
        print_status "Stopping container: ${CONTAINER_NAME}..."
        docker stop ${CONTAINER_NAME}
        docker rm ${CONTAINER_NAME}
        print_status "Container stopped and removed."
    else
        print_warning "Container ${CONTAINER_NAME} is not running."
    fi
}

show_logs() {
    if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
        docker logs -f ${CONTAINER_NAME}
    else
        print_error "Container ${CONTAINER_NAME} is not running."
        exit 1
    fi
}

# Main script
case "${1:-all}" in
    build)
        build_image
        ;;
    run)
        run_container
        ;;
    stop)
        stop_container
        ;;
    logs)
        show_logs
        ;;
    all|"")
        build_image
        run_container
        ;;
    *)
        echo "Usage: $0 {build|run|stop|logs|all}"
        exit 1
        ;;
esac
