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
-- password123 -> $2b$10$JyH42Acya55sIRDbtmtCk.e7M70euHbtCsapsgHpBu8tsZd6stLDy
-- password456 -> $2b$10$fycoag8lRCf6cX6X0dw1z.6K10alJSng0HO927RgYVIkEoCyOECHy
INSERT INTO users (email, password_hash) VALUES 
    ('john.doe@company.com', '$2b$10$JyH42Acya55sIRDbtmtCk.e7M70euHbtCsapsgHpBu8tsZd6stLDy'),
    ('jane.smith@company.com', '$2b$10$fycoag8lRCf6cX6X0dw1z.6K10alJSng0HO927RgYVIkEoCyOECHy'),
    ('admin@company.com', '$2b$10$JyH42Acya55sIRDbtmtCk.e7M70euHbtCsapsgHpBu8tsZd6stLDy')
ON CONFLICT (email) DO NOTHING;

-- Insert sample contact data for enrichment
INSERT INTO contacts (email, full_name, department, phone_number, job_title, company, location) VALUES 
    ('john.doe@company.com', 'John Doe', 'Engineering', '+1-555-0101', 'Senior Software Engineer', 'Tech Corp', 'San Francisco, CA'),
    ('jane.smith@company.com', 'Jane Smith', 'Marketing', '+1-555-0102', 'Marketing Manager', 'Tech Corp', 'New York, NY'),
    ('alice.johnson@company.com', 'Alice Johnson', 'Sales', '+1-555-0103', 'Sales Director', 'Tech Corp', 'Chicago, IL'),
    ('bob.wilson@company.com', 'Bob Wilson', 'HR', '+1-555-0104', 'HR Specialist', 'Tech Corp', 'Austin, TX'),
    ('sarah.davis@company.com', 'Sarah Davis', 'Engineering', '+1-555-0105', 'Lead Developer', 'Tech Corp', 'Seattle, WA'),
    ('mike.brown@company.com', 'Mike Brown', 'Operations', '+1-555-0106', 'Operations Manager', 'Tech Corp', 'Denver, CO'),
    ('emily.taylor@company.com', 'Emily Taylor', 'Design', '+1-555-0107', 'UX Designer', 'Tech Corp', 'Los Angeles, CA'),
    ('david.anderson@company.com', 'David Anderson', 'Finance', '+1-555-0108', 'Financial Analyst', 'Tech Corp', 'Boston, MA'),
    ('lisa.garcia@company.com', 'Lisa Garcia', 'Legal', '+1-555-0109', 'Legal Counsel', 'Tech Corp', 'Miami, FL'),
    ('tom.martinez@company.com', 'Tom Martinez', 'Product', '+1-555-0110', 'Product Manager', 'Tech Corp', 'Portland, OR')
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