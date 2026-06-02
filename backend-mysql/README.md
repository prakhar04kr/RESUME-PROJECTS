# backend-mysql

## Env vars
- `PORT` (default: 3000)
- `DATABASE_URL` (MySQL URL, required)
  - format: `mysql://user:password@host:3306/dbname`
- `JWT_SECRET` (optional)

## Start
```bash
cd backend-mysql
npm install
npm start
```

## Create tables
Use MySQL and run:
```sql
SOURCE sql/001_init.sql;
```

