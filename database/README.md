# Database Migrations

This folder contains Django database migration files that track changes to the database schema.

## How to use migrations:

### 1. Create migrations after model changes:
```bash
cd C:\timetable-automation\backend
python manage.py makemigrations api
```

### 2. Apply migrations to database:
```bash
python manage.py migrate
```

### 3. View migration status:
```bash
python manage.py showmigrations
```

### 4. Reset migrations (if needed):
```bash
# Delete migration files
rm -rf api/migrations/0*.py

# Create new initial migration
python manage.py makemigrations api --empty
python manage.py makemigrations api
python manage.py migrate
```

## Migration Files:
- `0001_initial.py` - Initial database schema
- `0002_*.py` - Subsequent schema changes
- etc.

## Database:
- Default: SQLite (`db.sqlite3` in backend folder)
- Can be configured to use PostgreSQL/MySQL in settings.py

## Backup:
Always backup your database before running migrations in production:
```bash
cp db.sqlite3 db.sqlite3.backup
```
