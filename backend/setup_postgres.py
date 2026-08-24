"""
Helper utility to initialize the PostgreSQL database and run Django migrations.
Usage:
    python setup_postgres.py --password your_password
"""

import sys
import os
import argparse
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def main():
    parser = argparse.ArgumentParser(description='Initialize PostgreSQL Database for Neeti Saarthi')
    parser.add_argument('--user', default='postgres', help='PostgreSQL user (default: postgres)')
    parser.add_argument('--password', default=None, help='PostgreSQL password')
    parser.add_argument('--host', default='127.0.0.1', help='PostgreSQL host (default: 127.0.0.1)')
    parser.add_argument('--port', default='5432', help='PostgreSQL port (default: 5432)')
    parser.add_argument('--dbname', default='neeti_vivaad', help='Database name (default: neeti_vivaad)')
    args = parser.parse_args()

    password = args.password or os.getenv('DB_PASSWORD', 'postgres')

    print(f"Connecting to PostgreSQL server at {args.host}:{args.port} as user '{args.user}'...")
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user=args.user,
            password=password,
            host=args.host,
            port=args.port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname='{args.dbname}';")
        exists = cur.fetchone()
        if not exists:
            cur.execute(f"CREATE DATABASE {args.dbname};")
            print(f"[OK] Successfully created PostgreSQL database '{args.dbname}'.")
        else:
            print(f"[INFO] PostgreSQL database '{args.dbname}' already exists.")
        cur.close()
        conn.close()

        # Update .env file
        env_content = f"""DB_ENGINE=django.db.backends.postgresql
DB_NAME={args.dbname}
DB_USER={args.user}
DB_PASSWORD={password}
DB_HOST={args.host}
DB_PORT={args.port}
DJANGO_SECRET_KEY=django-insecure-neeti-vivaad-sih2026-mospi-secret-key-key-12345
DEBUG=True
"""
        with open('.env', 'w') as f:
            f.write(env_content)
        print("[OK] Updated .env file with PostgreSQL connection parameters.")

        # Run migrations
        print("Running Django migrations on PostgreSQL...")
        os.system('python manage.py migrate')
        print("Seeding initial data...")
        os.system('python seed_data.py')
        print("[DONE] PostgreSQL setup and data seeding complete!")

    except psycopg2.OperationalError as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        print("\nPlease check your PostgreSQL user and password in .env or run:")
        print("    python setup_postgres.py --password YOUR_POSTGRES_PASSWORD")

if __name__ == '__main__':
    main()
