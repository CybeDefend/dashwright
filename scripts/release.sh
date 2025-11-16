#!/bin/bash

# Dashwright Release Helper Script
# This script helps create and push releases for Docker images and NPM packages

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if git is clean
check_git_clean() {
    if [[ -n $(git status -s) ]]; then
        print_error "Git working directory is not clean. Please commit or stash your changes."
        git status -s
        exit 1
    fi
    print_success "Git working directory is clean"
}

# Check if on main branch
check_main_branch() {
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$BRANCH" != "main" ]]; then
        print_warning "You are on branch '$BRANCH', not 'main'"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Get current version from package.json
get_current_version() {
    cd integrations/npm-package
    local version=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
    cd ../..
    echo "$version"
}

# Suggest next version
suggest_next_version() {
    local current=$(get_current_version)
    local IFS='.'
    read -ra parts <<< "$current"
    local major=${parts[0]}
    local minor=${parts[1]}
    local patch=${parts[2]}
    
    local next_patch="$major.$minor.$((patch + 1))"
    local next_minor="$major.$((minor + 1)).0"
    local next_major="$((major + 1)).0.0"
    
    echo ""
    print_info "Current version: $current"
    print_info "Suggestions:"
    echo "  - Patch (bug fixes): $next_patch"
    echo "  - Minor (new features): $next_minor"
    echo "  - Major (breaking changes): $next_major"
    echo ""
}

# Validate version format
validate_version() {
    if [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format. Use semantic versioning (e.g., 1.0.0)"
        exit 1
    fi
}

# Update version in all package.json files
update_all_versions() {
    local version=$1
    
    # Update backend
    print_info "Updating backend version to $version"
    cd backend
    npm version "$version" --no-git-tag-version --allow-same-version
    cd ..
    print_success "Backend version updated"
    
    # Update frontend
    print_info "Updating frontend version to $version"
    cd frontend
    npm version "$version" --no-git-tag-version --allow-same-version
    cd ..
    print_success "Frontend version updated"
    
    # Update NPM package
    print_info "Updating NPM package version to $version"
    cd integrations/npm-package
    npm version "$version" --no-git-tag-version --allow-same-version
    cd ../..
    print_success "NPM package version updated"
    
    # Update Helm Chart
    print_info "Updating Helm Chart to $version"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/^version: .*/version: $version/" helm-chart/Chart.yaml
        sed -i '' "s/^appVersion: .*/appVersion: \"$version\"/" helm-chart/Chart.yaml
        sed -i '' "s/tag: \".*\"/tag: \"$version\"/g" helm-chart/values.yaml
    else
        # Linux
        sed -i "s/^version: .*/version: $version/" helm-chart/Chart.yaml
        sed -i "s/^appVersion: .*/appVersion: \"$version\"/" helm-chart/Chart.yaml
        sed -i "s/tag: \".*\"/tag: \"$version\"/g" helm-chart/values.yaml
    fi
    print_success "Helm Chart version updated"
    
    # Update README badge
    print_info "Updating README Helm badge"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/Helm-v[0-9.]*-/Helm-v$version-/" README.md
    else
        sed -i "s/Helm-v[0-9.]*-/Helm-v$version-/" README.md
    fi
    print_success "README badge updated"
}

# Update version in package.json (legacy function for NPM only)
update_npm_version() {
    local version=$1
    local current_version=$(cd integrations/npm-package && node -p "require('./package.json').version")
    
    if [[ "$current_version" == "$version" ]]; then
        print_warning "Version $version is already set in package.json"
        print_info "Skipping version update..."
    else
        print_info "Updating NPM package version from $current_version to $version"
        cd integrations/npm-package
        npm version "$version" --no-git-tag-version
        cd ../..
        print_success "NPM package version updated"
    fi
}

# Create git tag
create_git_tag() {
    local version=$1
    local tag_name="v$version"
    
    print_info "Creating git tag: $tag_name"
    git add .
    git commit -m "chore: release version $version" || true
    git tag -a "$tag_name" -m "Release $version"
    print_success "Git tag created: $tag_name"
}

# Push to remote
push_to_remote() {
    print_info "Pushing to remote..."
    git push origin main --tags
    print_success "Pushed to remote"
}

# Update CHANGELOG
update_changelog() {
    local version=$1
    local date=$(date +%Y-%m-%d)
    
    print_info "Please update CHANGELOG.md manually"
    print_info "Add a section for version $version with date $date"
    read -p "Press Enter when ready..."
}

# Main menu
show_menu() {
    echo ""
    echo "🎭 Dashwright Release Helper"
    echo "============================"
    echo ""
    echo "1) Release Docker Images (Backend + Frontend)"
    echo "2) Release NPM Package"
    echo "3) Release All (Docker + NPM)"
    echo "4) Exit"
    echo ""
}

# Release Docker images
release_docker() {
    print_info "Releasing Docker Images"
    suggest_next_version
    
    read -p "Enter version (e.g., 1.0.0): " version
    validate_version "$version"
    
    check_git_clean
    check_main_branch
    
    print_info "This will:"
    echo "  - Create git tag v$version"
    echo "  - Push to GitHub"
    echo "  - Trigger CI/CD to build and publish Docker images"
    echo ""
    
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cancelled"
        return
    fi
    
    update_changelog "$version"
    update_all_versions "$version"
    create_git_tag "$version"
    push_to_remote
    
    print_success "Release initiated!"
    print_info "Check GitHub Actions for build status:"
    print_info "https://github.com/CybeDefend/dashwright/actions"
}

# Release NPM package
release_npm() {
    print_info "Releasing NPM Package"
    suggest_next_version
    
    read -p "Enter version (e.g., 1.0.0): " version
    validate_version "$version"
    
    check_git_clean
    check_main_branch
    
    print_info "This will:"
    echo "  - Update package.json version to $version"
    echo "  - Create git tag npm-v$version"
    echo "  - Push to GitHub"
    echo "  - Trigger CI/CD to publish to GitHub Packages"
    echo ""
    
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cancelled"
        return
    fi
    
    update_npm_version "$version"
    
    # Update NPM CHANGELOG
    cd integrations/npm-package
    print_info "Please update CHANGELOG.md for the NPM package"
    read -p "Press Enter when ready..."
    cd ../..
    
    create_git_tag "$version"
    push_to_remote
    
    print_success "Release initiated!"
    print_info "Check GitHub Actions for publish status:"
    print_info "https://github.com/CybeDefend/dashwright/actions"
}

# Release all
release_all() {
    print_info "Releasing All Components"
    suggest_next_version
    
    read -p "Enter version (e.g., 1.0.0): " version
    validate_version "$version"
    
    check_git_clean
    check_main_branch
    
    print_info "This will:"
    echo "  - Update NPM package version to $version"
    echo "  - Create git tag v$version"
    echo "  - Push to GitHub"
    echo "  - Trigger CI/CD for Docker images AND NPM package"
    echo ""
    
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cancelled"
        return
    fi
    
    update_changelog "$version"
    update_all_versions "$version"
    
    # Update NPM CHANGELOG
    cd integrations/npm-package
    print_info "Please update CHANGELOG.md for the NPM package"
    read -p "Press Enter when ready..."
    cd ../..
    
    create_git_tag "$version"
    push_to_remote
    
    print_success "Complete release initiated!"
    print_info "Check GitHub Actions for build status:"
    print_info "https://github.com/CybeDefend/dashwright/actions"
}

# Main loop
while true; do
    show_menu
    read -p "Select option: " choice
    
    case $choice in
        1) release_docker ;;
        2) release_npm ;;
        3) release_all ;;
        4) print_info "Goodbye!"; exit 0 ;;
        *) print_error "Invalid option" ;;
    esac
done
