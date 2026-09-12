import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import sys

def create_database():
    try:
        # Connect to the default 'postgres' database
        conn = psycopg2.connect(
            user="postgres",
            password="postgres", # update if your default password is different
            host="localhost",
            port="5432",
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'airesumedb'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute('CREATE DATABASE airesumedb')
            print("✅ Database 'airesumedb' created successfully!")
        else:
            print("✅ Database 'airesumedb' already exists.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        print("Make sure your PostgreSQL server is running and the password is 'postgres'.")

if __name__ == "__main__":
    create_database()
