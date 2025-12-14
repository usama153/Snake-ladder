CREATE DATABASE snake_ladder;
USE snake_ladder;


CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(50),
password VARCHAR(50)
);


CREATE TABLE game_history (
game_id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(50),
score INT,
result VARCHAR(20),
played_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);