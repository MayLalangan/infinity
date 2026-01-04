# Setting up PostgreSQL on macOS

Since we switched the database from SQLite to PostgreSQL, you need to have a PostgreSQL server running locally.

## Option 1: Postgres.app (Easiest)
1. Download [Postgres.app](https://postgresapp.com/downloads.html).
2. Move it to your **Applications** folder and open it.
3. Click "Initialize" to create a new server.
4. Double click the `postgres` database icon to open a terminal psql session.
5. Create the database for this app:
   ```sql
   CREATE DATABASE infinitytrain;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE infinitytrain TO postgres;
   ```
   *(Note: The app is configured in `.env` to use user `postgres` with password `postgres`. You can change these credentials in `.env` if you prefer different ones.)*

## Option 2: Homebrew
1. Install PostgreSQL:
   ```bash
   brew install postgresql
   ```
2. Start the service:
   ```bash
   brew services start postgresql
   ```
3. Create the database:
   ```bash
   createdb infinitytrain
   ```
4. Create the user (if needed):
   ```bash
   createuser -s postgres
   ```

## Verifying the Connection
Once installed and running, check your `.env` file in the project root:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/infinitytrain
```
- **postgres**: username
- **postgres**: password
- **localhost**: host
- **5432**: port (default)
- **infinitytrain**: database name

## Running the App
After setting up the database, run:
```bash
npm run dev
```
The application will automatically create the necessary tables on the first run.
