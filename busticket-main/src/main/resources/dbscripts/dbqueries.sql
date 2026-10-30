CREATE DATABASE `busticket` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

CREATE USER 'apexarb'@'%' IDENTIFIED BY 'Krishna@983';

GRANT SELECT, INSERT, UPDATE, DELETE
ON busticket.*
TO 'apexarb'@'%';

FLUSH PRIVILEGES;

Use busticket;

CREATE TABLE IF NOT EXISTS operators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operator_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    operator_url VARCHAR(255),
    api_key VARCHAR(255) NOT NULL,
    active VARCHAR(1) DEFAULT 'Y',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE INDEX idx_id ON operators(id);
CREATE INDEX idx_operator_id ON operators(operator_id);
CREATE INDEX idx_name ON operators(name);

INSERT INTO operators (operator_id, name, operator_url, api_key, active) VALUES
    ('5615', 'Akhila Travels', 'http://www.akhilatravels.com/', '2TIEGLJT1NNHJNPNQOSU2AR5JSGRWTC', 'Y'),
    ('3025', 'Sri Vengamamba Bus Transport (SVBT)®', 'http://www.svbt.in/', 'QJNDTDZBTFJO77XXKQXEM3KQ0MMESAD', 'Y');

CREATE TABLE IF NOT EXISTS bit_op_city_map (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operator_id VARCHAR(50) NOT NULL,
    bit_city_id BIGINT NOT NULL,
    op_city_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_operator_op_city (operator_id, op_city_id),
    KEY idx_operator_id (operator_id),
    KEY idx_bit_city_id (bit_city_id),
    KEY idx_op_city_id (op_city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS passenger_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    op_schedule_id VARCHAR(100),
    route_id VARCHAR(100),
    operator_id VARCHAR(50),
    name VARCHAR(255),
    age INT,
    gender VARCHAR(10),
    origin_id BIGINT,
    origin_name VARCHAR(255),
    destination_id BIGINT,
    destination_name VARCHAR(255),
    from_to VARCHAR(255),
    blocking_time VARCHAR(100),
    seat_fare VARCHAR(50),
    ticket_no VARCHAR(100),
    is_eticket BOOLEAN,
    booking_fare VARCHAR(50),
    phone_num VARCHAR(50),
    country_code VARCHAR(10),
    boarding_stage VARCHAR(1000),
    landmark VARCHAR(1000),
    drop_off_stage VARCHAR(1000),
    seat_no VARCHAR(50),
    booked_by VARCHAR(255),
    remarks VARCHAR(1000),
    can_cancel BOOLEAN,
    can_cancel_ticket_for_user BOOLEAN,
    can_shift_ticket BOOLEAN,
    is_temporary_phone_block BOOLEAN,
    is_phone_block BOOLEAN,
    no_of_seats INT,
    seat_numbers VARCHAR(255),
    dep_time VARCHAR(50),
    travel_date VARCHAR(50),
    booked_date VARCHAR(50),
    status INT,
    is_his_booking BOOLEAN,
    booked_by_id BIGINT,
    travel_branch_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_op_schedule_id (op_schedule_id),
    KEY idx_route_id (route_id),
    KEY idx_travel_date (travel_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS processed_routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id VARCHAR(100) NOT NULL,
    travel_date VARCHAR(50) NOT NULL,
    op_schedule_id VARCHAR(100),
    operator_id VARCHAR(50),
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_route_travel_date (route_id, travel_date),
    KEY idx_travel_date (travel_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO operators (operator_id, name, operator_url, api_key, active) VALUES
    ('4423', 'Lucky Travels', 'https://allt.alluckytravels.com/', '7HLQFAMJVXJNX2DJ273EPSY4DMPY1HAT', 'Y');

INSERT INTO operators (operator_id, name, operator_url, api_key, active) VALUES
    ('6669', 'Kaveri Tours and Travels', 'https://kvbs.kaveribuses.com/', 'B83HK8H4T2V53R7L3WRP5BCQPK287YMS', 'Y');    
INSERT INTO operators (operator_id, name, operator_url, api_key, active) VALUES
    ('1493', 'KMBT Travels', 'https://kmbt.kmbttravels.com/', '34HYCV34EJYIH4YEFVOMNC26DVQ0YGXB', 'Y');    

INSERT INTO operators (operator_id, name, operator_url, api_key, active) VALUES
    ('3445', 'CHERRY TOURS & TRAVELS', 'https://chry.cherrytoursandtravels.in/', 'KMERCVG1CCIQZ3LZQ35AHZGI0O73JCQS', 'Y');    
INSERT INTO bit_op_city_map (operator_id, bit_city_id, op_city_id, name) VALUES
(3445,18739,184,'Mangamuru rd');
INSERT INTO bit_op_city_map (operator_id, bit_city_id, op_city_id, name) VALUES
(6669,26738,252,'Pulluru');

CREATE TABLE IF NOT EXISTS redbus_op_city_map (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operator_id VARCHAR(50) NOT NULL,
    op_city_id BIGINT NOT NULL,
    red_city_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active VARCHAR(1) DEFAULT 'Y',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_operator_op_city (operator_id, op_city_id),
    KEY idx_operator_id (operator_id),
    KEY idx_op_city_id (op_city_id),
    KEY idx_red_city_id (red_city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_order_id VARCHAR(100) NOT NULL,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    block_key VARCHAR(100),
    amount BIGINT NOT NULL,
    payment_state VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_mode VARCHAR(50),
    tin VARCHAR(100),
    pnr VARCHAR(100),
    trip_id VARCHAR(100),
    source_city VARCHAR(100),
    dest_city VARCHAR(100),
    doj VARCHAR(50),
    contact_mobile VARCHAR(20),
    contact_email VARCHAR(100),
    refund_id VARCHAR(100),
    refund_amount BIGINT,
    refund_status VARCHAR(50),
    booking_payload TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_merchant_order_id (merchant_order_id),
    KEY idx_block_key (block_key),
    KEY idx_tin (tin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration for existing installations (safely add razorpay & refund columns if missing)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'booking_payments' AND column_name = 'razorpay_order_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE booking_payments ADD COLUMN razorpay_order_id VARCHAR(100) AFTER merchant_order_id', 'SELECT "Column already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist2 := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'booking_payments' AND column_name = 'razorpay_payment_id');
SET @sqlstmt2 := IF(@exist2 = 0, 'ALTER TABLE booking_payments ADD COLUMN razorpay_payment_id VARCHAR(100) AFTER razorpay_order_id', 'SELECT "Column already exists"');
PREPARE stmt2 FROM @sqlstmt2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @exist3 := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'booking_payments' AND column_name = 'refund_id');
SET @sqlstmt3 := IF(@exist3 = 0, 'ALTER TABLE booking_payments ADD COLUMN refund_id VARCHAR(100) AFTER contact_email, ADD COLUMN refund_amount BIGINT AFTER refund_id, ADD COLUMN refund_status VARCHAR(50) AFTER refund_amount', 'SELECT "Column already exists"');
PREPARE stmt3 FROM @sqlstmt3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

SET @exist4 := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'booking_payments' AND column_name = 'bus_type');
SET @sqlstmt4 := IF(@exist4 = 0, 'ALTER TABLE booking_payments ADD COLUMN bus_type VARCHAR(100) AFTER contact_email, ADD COLUMN boarding_point VARCHAR(255) AFTER bus_type, ADD COLUMN departure_time VARCHAR(50) AFTER boarding_point, ADD COLUMN seat_numbers VARCHAR(100) AFTER departure_time, ADD COLUMN whatsapp_status VARCHAR(50) AFTER refund_status, ADD COLUMN whatsapp_message_id VARCHAR(100) AFTER whatsapp_status', 'SELECT "Column already exists"');
PREPARE stmt4 FROM @sqlstmt4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;