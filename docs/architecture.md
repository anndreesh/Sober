# Architecture overview

This project follows a split responsibility model:

- React frontend for interfaces and user flows
- FastAPI backend for authenticated web APIs and business logic
- PostgreSQL persistence through SQLAlchemy, configured to use Supabase in production
- User-owned habits, streak history, journal entries, and urge logs load and save through the API so they stay in sync across devices
- A one-time authenticated import moves legacy IndexedDB records into PostgreSQL; IndexedDB is not used for ongoing app data

The frontend is intentionally structured around focused feature modules and a shared components layer, while the backend exposes v1 routes for authentication, dashboard metrics, habits, commitments, journaling, urges, statistics, and community.
