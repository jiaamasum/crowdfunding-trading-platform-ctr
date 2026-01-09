# Auto-generated Makefile by code-audit-23
# This file provides a standard interface for building and testing your project.
# Feel free to customize the commands to match your project's specific requirements.

.PHONY: build coverage

# Python projects often don't need a build step, but we can install dependencies.
build:
	@echo "Installing dependencies..."
	pip install -r requirements.txt || echo "No requirements.txt found or pip failed"

# Generate XML coverage report for SonarQube
# Update this if you use a different runner like nose2 or unittest
coverage:
	@echo "Running tests with coverage..."
	pytest --cov=. --cov-report=xml:coverage.xml --cov-report=term || echo "pytest failed. Please check your test setup."
