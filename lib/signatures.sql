DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL primary key,
    first VARCHAR(255),
    last VARCHAR(255),
    email VARCHAR (255) UNIQUE,
    password text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM users;

DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature text,
    user_ID INT UNIQUE
);

SELECT * FROM signatures;

DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles (
    id SERIAL primary key,
    user_ID INT UNIQUE,
    age INT,
    city VARCHAR (255),
    url VARCHAR (100)
);

SELECT * FROM user_profiles;
