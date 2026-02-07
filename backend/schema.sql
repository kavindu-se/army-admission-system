CREATE DATABASE IF NOT EXISTS army_admission;
USE army_admission;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_no VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  roles VARCHAR(255) NOT NULL,
  regiment VARCHAR(100) NULL,
  unit_no VARCHAR(50) NULL,
  unit_id INT NULL,
  rhq_id INT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  auth_provider VARCHAR(50) DEFAULT 'demo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rhq_id INT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_no VARCHAR(50) NOT NULL UNIQUE,
  applicant_id INT NOT NULL,
  unit_id INT NOT NULL,
  rhq_id INT NOT NULL,
  regiment_name VARCHAR(100) NULL,
  unit_no VARCHAR(50) NULL,
  academic_year VARCHAR(10) NOT NULL,
  status VARCHAR(30) NOT NULL,
  current_stage VARCHAR(30) NOT NULL,
  cc_approved TINYINT(1) DEFAULT 0,
  gso1_approved TINYINT(1) DEFAULT 0,
  form_a_json JSON NOT NULL,
  form_b_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  level VARCHAR(30) NOT NULL,
  actor_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  comment VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

INSERT INTO users (service_no, name, roles, unit_id, rhq_id) VALUES
  ('A1001', 'Applicant Demo', 'Applicant', 1, 1),
  ('U2001', 'Unit Clerk Demo', 'UnitSubjectClerk', 1, 1),
  ('U2002', 'Adjutant Demo', 'UnitAdjutant', 1, 1),
  ('U2003', 'CO Demo', 'UnitCO', 1, 1),
  ('R3001', 'RHQ Clerk Demo', 'RHQSubjectClerk', 1, 1),
  ('C4001', 'Centre Commandant Demo', 'CentreCommandant', 1, 1),
  ('G4002', 'GSO1 Demo', 'GSO1', 1, 1),
  ('D5001', 'Dte Welfare Clerk Demo', 'DteWelfareClerk', NULL, NULL),
  ('D5002', 'Dte Welfare GSO2 Demo', 'DteWelfareGSO2', NULL, NULL);
