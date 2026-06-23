.PHONY: test test-backend test-frontend

test: test-backend test-frontend

test-backend:
	cd backend && .venv/bin/pytest -v

test-frontend:
	cd frontend && npm test
