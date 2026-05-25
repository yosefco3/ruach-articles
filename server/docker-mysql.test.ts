import { describe, it, expect } from 'vitest';
import mysql from 'mysql2/promise';

describe('Docker MySQL Setup', () => {
  it('should connect to MySQL container', async () => {
    // Try to connect to MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'dev_password_2024',
    });

    expect(connection).toBeDefined();
    await connection.end();
  });

  it('should have ruach_dev database', async () => {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'dev_password_2024',
    });

    const [databases] = await connection.query('SHOW DATABASES');
    const dbNames = (databases as any[]).map((db) => db.Database);

    expect(dbNames).toContain('ruach_dev');
    await connection.end();
  });

  it('should be able to create and query a test table', async () => {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'dev_password_2024',
      database: 'ruach_dev',
    });

    // Create test table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id INT PRIMARY KEY AUTO_INCREMENT,
        message VARCHAR(255)
      )
    `);

    // Insert test data
    await connection.query(
      'INSERT INTO test_connection (message) VALUES (?)',
      ['Docker MySQL is working!']
    );

    // Query test data
    const [rows] = await connection.query('SELECT * FROM test_connection');
    expect((rows as any[]).length).toBeGreaterThan(0);

    // Cleanup
    await connection.query('DROP TABLE test_connection');
    await connection.end();
  });
});