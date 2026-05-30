#!/bin/bash
#
# Bootstrap Docker and Redis for algo-trader
# Usage: ./scripts/bootstrap-docker.sh
#

set -e

echo "=== Algo-Trader Bootstrap ==="

# Step 1: Check Docker installation
echo "[1/4] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi

DOCKER_VERSION=$(docker --version)
echo "✅ Docker: $DOCKER_VERSION"

# Step 2: Check Docker daemon is running
echo "[2/4] Checking Docker daemon..."
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi
echo "✅ Docker daemon is running"

# Step 3: Start Redis via Homebrew
echo "[3/4] Starting Redis..."
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install Homebrew first."
    echo "   Install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

if ! brew list redis &> /dev/null; then
    echo "⏳ Installing Redis..."
    brew install redis
fi

echo "🔄 Starting Redis service..."
brew services start redis

# Wait for Redis to be ready
sleep 2

# Step 4: Verify Redis is running
echo "[4/4] Verifying Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running and responding to PING"
    else
        echo "❌ Redis is not responding. Trying to restart..."
        brew services restart redis
        sleep 2
        if redis-cli ping &> /dev/null; then
            echo "✅ Redis restarted successfully"
        else
            echo "❌ Redis failed to start. Please check logs:"
            echo "   brew services info redis"
            exit 1
        fi
    fi
else
    echo "⚠️  redis-cli not found. Skipping connection test."
fi

echo ""
echo "=== Bootstrap Complete ==="
echo ""
echo "Next steps:"
echo "  1. docker-compose up -d    # Start Docker containers"
echo "  2. npm run dev             # Start development server"
echo ""
echo "Redis connection: redis://localhost:6379"
echo ""
