-- Fix admin password hash for 'admin123'
UPDATE usuarios SET password = '$2a$10$9SsVKXNUqwVroWqcoma8XeRfa1hytQzN5jRAAiqqdP1FZxhb51xD2' WHERE email = 'admin@hotel.com';
