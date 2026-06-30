ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL AFTER avatar;
ALTER TABLE usuarios ADD COLUMN reset_token_expires DATETIME DEFAULT NULL AFTER reset_token;
