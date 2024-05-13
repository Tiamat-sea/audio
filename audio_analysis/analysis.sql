-- Create the User table
CREATE TABLE User (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    name VARCHAR(255) COMMENT '昵称',
    password VARCHAR(255) COMMENT '密码',
    email VARCHAR(255) COMMENT '邮箱',
    registration_time DATETIME COMMENT '注册时间',
    music_count INT COMMENT '音乐数',
    analysis_count INT COMMENT '分析记录数',
    view_count INT COMMENT '查看次数',
    bio TEXT COMMENT '个人简介'
);

-- Create the Music table
CREATE TABLE Music (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '音乐ID',
    name VARCHAR(255) COMMENT '名称',
    author VARCHAR(255) COMMENT '作者',
    description TEXT COMMENT '内容介绍',
    upload_user_id INT COMMENT '上传用户ID',
    upload_time DATETIME COMMENT '上传时间',
    is_private BOOLEAN COMMENT '是否私有',
    file_path VARCHAR(255) COMMENT '存放路径',
    FOREIGN KEY (upload_user_id) REFERENCES User(id)
);

-- Create the AnalysisRecord table
CREATE TABLE AnalysisRecord (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '分析记录ID',
    name VARCHAR(255) COMMENT '名称',
    author_id INT COMMENT '作者ID',
    description TEXT COMMENT '内容介绍',
    analyzed_music_id INT COMMENT '所分析的音乐ID',
    analysis_time DATETIME COMMENT '分析时间',
    is_private BOOLEAN COMMENT '是否私有',
    file_path VARCHAR(255) COMMENT '存放路径',
    FOREIGN KEY (author_id) REFERENCES User(id),
    FOREIGN KEY (analyzed_music_id) REFERENCES Music(id)
);


-- Insert test data into User table
INSERT INTO User (name, password, email, registration_time, music_count, analysis_count, view_count, bio)
VALUES ('User1', 'password1', 'user1@example.com', NOW(), 3, 0, 0, 'User 1 bio'),
       ('User2', 'password2', 'user2@example.com', NOW(), 5, 0, 0, 'User 2 bio'),
       ('User3', 'password3', 'user3@example.com', NOW(), 7, 0, 0, 'User 3 bio');

-- Insert test data into Music table
INSERT INTO Music (name, author, description, upload_user_id, upload_time, is_private, file_path)
VALUES ('Music1', 'Author1', 'Music 1 description', 1, NOW(), FALSE, '/path/to/music1.mp3'),
       ('Music2', 'Author2', 'Music 2 description', 1, NOW(), FALSE, '/path/to/music2.mp3'),
       ('Music3', 'Author3', 'Music 3 description', 2, NOW(), FALSE, '/path/to/music3.mp3'),
       ('Music4', 'Author4', 'Music 4 description', 2, NOW(), FALSE, '/path/to/music4.mp3'),
       ('Music5', 'Author5', 'Music 5 description', 3, NOW(), FALSE, '/path/to/music5.mp3');

-- Insert test data into AnalysisRecord table
INSERT INTO AnalysisRecord (name, author_id, description, analyzed_music_id, analysis_time, is_private, file_path)
VALUES ('Analysis1', 1, 'Analysis 1 description', 1, NOW(), FALSE, '/path/to/analysis1.txt'),
       ('Analysis2', 2, 'Analysis 2 description', 2, NOW(), FALSE, '/path/to/analysis2.txt'),
       ('Analysis3', 3, 'Analysis 3 description', 3, NOW(), FALSE, '/path/to/analysis3.txt');
