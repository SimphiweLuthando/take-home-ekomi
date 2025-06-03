-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contacts table for enriched contact information
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    department VARCHAR(255),
    phone_number VARCHAR(50),
    job_title VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test users (passwords are hashed versions of 'password123' and 'password456')
INSERT INTO users (email, password_hash) VALUES 
    ('john.doe@company.com', '$2b$10$JyH42Acya55sIRDbtmtCk.e7M70euHbtCsapsgHpBu8tsZd6stLDy'),
    ('jane.smith@company.com', '$2b$10$fycoag8lRCf6cX6X0dw1z.6K10alJSng0HO927RgYVIkEoCyOECHy'),
    ('admin@company.com', '$2b$10$JyH42Acya55sIRDbtmtCk.e7M70euHbtCsapsgHpBu8tsZd6stLDy')
ON CONFLICT (email) DO NOTHING;

-- Insert sample contact data for enrichment
INSERT INTO contacts (email, full_name, department, phone_number, job_title, company, location) VALUES 
    ('john.doe@company.com', 'John Doe', 'Engineering', '+27115550101', 'Senior Software Engineer', 'Tech Corp SA', 'Johannesburg, Gauteng'),
    ('jane.smith@company.com', 'Jane Smith', 'Marketing', '+27215550102', 'Marketing Manager', 'Tech Corp SA', 'Cape Town, Western Cape'),
    ('alice.johnson@company.com', 'Alice Johnson', 'Sales', '+27315550103', 'Sales Director', 'Tech Corp SA', 'Durban, KwaZulu-Natal'),
    ('bob.wilson@company.com', 'Bob Wilson', 'HR', '+27125550104', 'HR Specialist', 'Tech Corp SA', 'Pretoria, Gauteng'),
    ('sarah.davis@company.com', 'Sarah Davis', 'Engineering', '+27115550105', 'Lead Developer', 'Tech Corp SA', 'Sandton, Gauteng'),
    ('mike.brown@company.com', 'Mike Brown', 'Operations', '+27115550106', 'Operations Manager', 'Tech Corp SA', 'Midrand, Gauteng'),
    ('emily.taylor@company.com', 'Emily Taylor', 'Design', '+27215550107', 'UX Designer', 'Tech Corp SA', 'Stellenbosch, Western Cape'),
    ('david.anderson@company.com', 'David Anderson', 'Finance', '+27115550108', 'Financial Analyst', 'Tech Corp SA', 'Rosebank, Gauteng'),
    ('lisa.garcia@company.com', 'Lisa Garcia', 'Legal', '+27315550109', 'Legal Counsel', 'Tech Corp SA', 'Umhlanga, KwaZulu-Natal'),
    ('tom.martinez@company.com', 'Tom Martinez', 'Product', '+27115550110', 'Product Manager', 'Tech Corp SA', 'Centurion, Gauteng')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 