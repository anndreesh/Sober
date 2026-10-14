# Architecture overview

This project follows a split responsibility model:

- Frontend React app for interfaces and user flows
- Dexie + IndexedDB for client-side persistence and offline access
- FastAPI backend for web APIs and business logic
- PostgreSQL-ready configuration with SQLAlchemy for server-side persistence and future scaling

The frontend is intentionally structured around focused feature modules and a shared components layer, while the backend exposes v1 routes for authentication, dashboard metrics, habits, commitments, journaling, urges, statistics, and community.
