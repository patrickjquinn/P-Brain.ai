CREATE TABLE IF NOT EXISTS `global_settings` (
  `name` varchar(64) NOT NULL,
  `value` text,
  PRIMARY KEY (`name`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `password` text NOT NULL,
  `is_admin` INTEGER DEFAULT 0,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tokens` (
  `token` varchar(256) NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `user_id` int(11) DEFAULT NULL,
  `name` TEXT DEFAULT NULL,
  PRIMARY KEY (`token`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `queries` (
  `query_id` int(11) NOT NULL AUTO_INCREMENT,
  `query` text NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `user_id` int(11) NOT NULL,
  `token` VARCHAR(256),
  PRIMARY KEY (`query_id`),
  FOREIGN KEY (`token`) REFERENCES `tokens` (`token`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `responses` (
  `query_id` int(11) NOT NULL,
  `response` text NOT NULL,
  `skill` text NOT NULL,
  PRIMARY KEY (`query_id`),
  FOREIGN KEY (`query_id`) REFERENCES `queries` (`query_id`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `skill_settings` (
  `skill` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `value` text,
  PRIMARY KEY (`skill`,`name`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` int(11) NOT NULL,
  `skill` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `value` text,
  PRIMARY KEY (`user_id`,`skill`,`name`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `version` (
  `version` int(11) NOT NULL,
  PRIMARY KEY (`version`)
);
INSERT IGNORE INTO version (version) VALUES (2);
