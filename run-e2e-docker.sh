#!/bin/bash

# E2E Test Runner Script for Docker
# Usage: ./run-e2e-docker.sh [--build] [--local|--prod|--staging] [--debug] [--report]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Defaults
BUILD=false
ENDPOINT="http://localhost:5173"
ENDPOINT_NAME="local"
DEBUG=false
SHOW_REPORT=false
IMAGE_NAME="bfstats-e2e:latest"
REPORT_DIR="./playwright-report"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --build)
      BUILD=true
      shift
      ;;
    --local)
      ENDPOINT="http://localhost:5173"
      ENDPOINT_NAME="local"
      shift
      ;;
    --prod)
      ENDPOINT="https://bfstats.io"
      ENDPOINT_NAME="production"
      shift
      ;;
    --staging)
      ENDPOINT="https://staging.bfstats.io"
      ENDPOINT_NAME="staging"
      shift
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    --report)
      SHOW_REPORT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--build] [--local|--prod|--staging] [--debug] [--report]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}=== BFStats E2E Test Runner ===${NC}"
echo ""

# Build image if requested
if [ "$BUILD" = true ]; then
  echo -e "${BLUE}Building Docker image...${NC}"
  docker build -f Dockerfile.e2e -t $IMAGE_NAME .
  echo -e "${GREEN}✓ Image built successfully${NC}"
  echo ""
fi

# Run tests
if [ "$DEBUG" = true ]; then
  echo -e "${BLUE}Starting Playwright debugger against ${ENDPOINT_NAME}...${NC}"
  docker run --rm --ipc=host -it -e API_BASE_URL=$ENDPOINT $IMAGE_NAME npx playwright test --debug
else
  echo -e "${BLUE}Running E2E tests against ${ENDPOINT_NAME}${NC}"
  echo "Endpoint: $ENDPOINT"
  echo ""

  docker run --rm --ipc=host -e API_BASE_URL=$ENDPOINT -v "$REPORT_DIR:/app/playwright-report" $IMAGE_NAME

  TEST_RESULT=$?

  if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
  else
    echo -e "${RED}✗ Some tests failed${NC}"
  fi

  # Show report info
  if [ -f "$REPORT_DIR/index.html" ]; then
    echo ""
    echo -e "${YELLOW}📊 Test report generated:${NC}"
    echo "   $REPORT_DIR/index.html"
    echo ""
    echo -e "${YELLOW}To view the report:${NC}"
    echo "   npx playwright show-report"

    if [ "$SHOW_REPORT" = true ]; then
      echo ""
      echo -e "${BLUE}Opening report in browser...${NC}"
      npx playwright show-report
    fi
  fi

  exit $TEST_RESULT
fi
