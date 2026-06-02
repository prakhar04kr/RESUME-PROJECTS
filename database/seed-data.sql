USE typeracer_db;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM results WHERE id > 0;
DELETE FROM games WHERE id > 0;
DELETE FROM users WHERE id > 0;

ALTER TABLE results AUTO_INCREMENT = 1;
ALTER TABLE games AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users
(email, password_hash, username, role)
VALUES
(
'admin@typeracer.com',
'$2b$12$33vRf.xvDZG3wHdIOVO1ouprJsxx7FXKZCKs1ixu0hQKED/urQQ8C',
'admin',
'admin'
),
(
'demo@typeracer.com',
'$2b$12$oNgmsxiOflklwcWJd6X4huM61oBszjyleL7.pSmZffQLcfyal6TVK',
'speedracer',
'user'
);

INSERT INTO games
(paragraph, difficulty, created_by)
VALUES
(
'The quick brown fox jumps over the lazy dog. This classic pangram contains every letter of the alphabet at least once, making it perfect for testing typing speed and accuracy.',
'easy',
1
),
(
'To be or not to be, that is the question. Whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune.',
'easy',
1
),
(
'Programming is the art of telling another human being what one wants the computer to do. It requires precision and creativity.',
'medium',
1
),
(
'Artificial intelligence is the simulation of human intelligence processes by machines, especially computer systems.',
'medium',
1
),
(
'The greatest glory in living lies not in never falling, but in rising every time we fall and continue moving forward.',
'medium',
1
),
(
'Quantum mechanics is a fundamental theory in physics that provides a description of nature at the smallest scales.',
'hard',
1
),
(
'Distributed systems require careful handling of failures, consistency, and communication between independent nodes.',
'hard',
1
),
(
'Cryptographic hash functions transform data into fixed length values that are difficult to reverse engineer.',
'hard',
1
),
(
'The mitochondria is the powerhouse of the cell and generates most of the energy required for cellular functions.',
'medium',
1
),
(
'Learning to type efficiently improves productivity, reduces fatigue, and enhances overall computer usage skills.',
'easy',
1
);

INSERT INTO results
(user_id, game_id, wpm, accuracy, time_taken_ms)
VALUES
(2, 1, 31, 100, 74616),
(2, 3, 36, 99, 63008),
(2, 6, 38, 100, 63609);

SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS games_count FROM games;
SELECT COUNT(*) AS results_count FROM results;