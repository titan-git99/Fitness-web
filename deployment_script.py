#!/usr/bin/env python3
"""
Simple deployment script for the fitness plan
This script can be used to deploy the fitness plan to various hosting services
"""

import os
import subprocess
import sys
from pathlib import Path

def deploy_to_netlify():
    """Deploy to Netlify using netlify CLI"""
    try:
        # Check if netlify CLI is available
        result = subprocess.run(['netlify', '--version'], capture_output=True, text=True)
        print(f"Netlify CLI version: {result.stdout.strip()}")
        
        # Deploy
        result = subprocess.run(['netlify', 'deploy', '--dir=dist', '--open'], capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
            
    except FileNotFoundError:
        print("Netlify CLI not found. Please install it first:")
        print("npm install -g netlify-cli")
        return False
    except Exception as e:
        print(f"Error deploying to Netlify: {e}")
        return False
    return True

def deploy_to_surge():
    """Deploy to Surge using surge CLI"""
    try:
        # Check if surge CLI is available
        result = subprocess.run(['surge', '--version'], capture_output=True, text=True)
        print(f"Surge CLI version: {result.stdout.strip()}")
        
        # Deploy
        os.chdir('dist')
        result = subprocess.run(['surge', '.'], capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
            
    except FileNotFoundError:
        print("Surge CLI not found. Please install it first:")
        print("npm install -g surge")
        return False
    except Exception as e:
        print(f"Error deploying to Surge: {e}")
        return False
    return True

def create_github_pages():
    """Create GitHub Pages deployment structure"""
    try:
        # Initialize git repository if not already done
        if not os.path.exists('.git'):
            subprocess.run(['git', 'init'], check=True)
        
        # Add and commit files
        subprocess.run(['git', 'add', 'dist/'], check=True)
        subprocess.run(['git', 'commit', '-m', 'Add fitness plan for GitHub Pages'], check=True)
        
        print("GitHub Pages structure created successfully!")
        print("Next steps:")
        print("1. Create a new repository on GitHub")
        print("2. Add the remote origin: git remote add origin <your-repo-url>")
        print("3. Push to GitHub: git push -u origin main")
        print("4. Enable GitHub Pages in repository settings")
        
    except subprocess.CalledProcessError as e:
        print(f"Error creating GitHub Pages structure: {e}")
        return False
    return True

def main():
    """Main deployment function"""
    print("🚀 Fitness Plan Deployment Options")
    print("="*50)
    
    print("\nChoose your deployment method:")
    print("1. Netlify (requires authentication)")
    print("2. Surge (requires authentication)")
    print("3. GitHub Pages (manual upload required)")
    print("4. Local preview (serves on localhost)")
    print("5. Exit")
    
    choice = input("\nEnter your choice (1-5): ").strip()
    
    if choice == '1':
        deploy_to_netlify()
    elif choice == '2':
        deploy_to_surge()
    elif choice == '3':
        create_github_pages()
    elif choice == '4':
        # Start local server
        print("Starting local server on http://localhost:8000")
        subprocess.run(['python3', '-m', 'http.server', '8000'])
    elif choice == '5':
        print("Deployment cancelled.")
    else:
        print("Invalid choice. Please select 1-5.")

if __name__ == "__main__":
    main()