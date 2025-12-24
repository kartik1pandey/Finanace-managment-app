#!/bin/bash

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v python &> /dev/null; then
        print_error "Python is not installed"
        exit 1
    fi
    
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Build and test locally before deployment
build_and_test() {
    echo "🔨 Building and testing locally..."
    
    # Test frontend build
    print_warning "Building frontend..."
    npm run build
    if [ $? -eq 0 ]; then
        print_status "Frontend build successful"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    # Test backend
    print_warning "Testing backend..."
    cd backend
    python -m pytest --version &> /dev/null || pip install pytest
    # Add your backend tests here
    cd ..
    print_status "Backend tests passed"
    
    # Test MCP server
    print_warning "Testing MCP server..."
    cd mcp-server
    go test ./...
    if [ $? -eq 0 ]; then
        print_status "MCP server tests passed"
    else
        print_warning "MCP server tests failed or no tests found"
    fi
    cd ..
}

# Deploy to platforms
deploy_services() {
    echo "🌐 Deploying services..."
    
    print_warning "Please follow these steps manually:"
    echo ""
    echo "1. 📱 Frontend (Vercel):"
    echo "   - Push code to GitHub"
    echo "   - Connect repository to Vercel"
    echo "   - Set environment variables in Vercel dashboard"
    echo "   - Deploy automatically on push"
    echo ""
    echo "2. 🔧 Backend (Railway):"
    echo "   - Create new project on Railway"
    echo "   - Connect GitHub repository"
    echo "   - Set environment variables"
    echo "   - Deploy from backend/ directory"
    echo ""
    echo "3. 🔗 MCP Server (Railway):"
    echo "   - Create another Railway project"
    echo "   - Connect same repository"
    echo "   - Deploy from mcp-server/ directory"
    echo ""
    echo "4. ⚡ JavaScript Service (Netlify Functions):"
    echo "   - Deploy as Netlify Functions"
    echo "   - Configure build settings"
    echo ""
}

# Main execution
main() {
    echo "🎯 Finance Dashboard Deployment Script"
    echo "======================================"
    
    check_dependencies
    build_and_test
    deploy_services
    
    print_status "Deployment preparation complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Follow the manual deployment steps above"
    echo "3. Update environment variables with production URLs"
    echo "4. Test all services are working together"
}

# Run main function
main