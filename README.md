# Outlook Add-in for Contact Enrichment with Secure API Access

## Overview

This project implements a secure Outlook add-in that enriches email reading experience by displaying additional contact information for email senders. The solution includes:

- **Frontend**: Outlook add-in UI with authentication and contact display
- **Backend**: Express.js API with JWT authentication and contact enrichment
- **Database**: PostgreSQL for storing user credentials and contact data
- **Containerization**: Docker Compose setup for easy deployment

## Architecture

The solution consists of three main services:

1. **Frontend Service**: Serves the Outlook add-in static files
2. **Backend API**: Express.js server handling authentication and contact enrichment
3. **Database**: PostgreSQL database for user and contact data storage

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Office.js
- **Backend**: Node.js, Express.js, JWT authentication
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose
- **Security**: bcrypt for password hashing, JWT tokens for API access

## Prerequisites

### Installing Docker and Docker Compose

#### On Windows (WSL2 recommended)
1. Install Docker Desktop from [Docker's official website](https://docs.docker.com/desktop/install/windows/)
2. Docker Compose is included with Docker Desktop

#### On macOS
1. Install Docker Desktop from [Docker's official website](https://docs.docker.com/desktop/install/mac/)
2. Docker Compose is included with Docker Desktop

#### On Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker.io

# Install Docker Compose
sudo apt-get install docker-compose

# Add user to docker group (optional, avoids using sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd take-home-ekomi
   ```

2. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend (Add-in UI): http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

## Authentication Flow

1. **User Login**: User enters email and password in the add-in interface
2. **Credential Verification**: Backend verifies credentials against PostgreSQL database
3. **JWT Token Issuance**: Upon successful authentication, server issues a JWT token
4. **API Access**: Client uses JWT token in Authorization header for protected API calls
5. **Contact Enrichment**: Authenticated users can fetch enriched contact information

## Default Test Credentials

The system comes with pre-seeded test users:

- **Email**: `john.doe@company.com` **Password**: `password123`
- **Email**: `jane.smith@company.com` **Password**: `password456`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)
- `POST /api/auth/register` - User registration

### Contact Enrichment (Protected)
- `GET /api/contacts/enrich?email=<email>` - Get enriched contact data
- Requires `Authorization: Bearer <jwt_token>` header

## Testing the Solution

### 1. Test Authentication
```bash
# Login request
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@company.com","password":"password123"}'
```

### 2. Test Contact Enrichment
```bash
# Replace <token> with the JWT token from login response
curl -X GET "http://localhost:3001/api/contacts/enrich?email=jane.smith@company.com" \
  -H "Authorization: Bearer <token>"
```

### 3. Test Add-in Interface
1. Open http://localhost:3000 in your browser
2. Log in with test credentials
3. Enter an email address to get enriched contact information

## Simulating Outlook Context

Since we don't have access to Office 365 developer accounts, the add-in simulates the Outlook context by:

1. Providing a mock email input field
2. Simulating the Office.js environment
3. Using sample sender emails for testing contact enrichment

## Development Notes

### Security Features
- Password hashing using bcrypt
- JWT tokens with expiration (24 hours)
- Protected API endpoints
- Input validation and sanitization

### Database Schema
- **users**: Stores user credentials (email, hashed password)
- **contacts**: Stores enriched contact information

### Docker Services
- **frontend**: Nginx serving static files
- **backend**: Node.js Express application
- **database**: PostgreSQL database

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. **Database connection issues**
   ```bash
   docker-compose logs database
   ```

3. **Backend API not responding**
   ```bash
   docker-compose logs backend
   ```

### Checking Service Status
```bash
docker-compose ps
```

### Viewing Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

## File Structure

```
take-home-ekomi/
├── frontend/                 # Outlook add-in static files
│   ├── index.html           # Main add-in interface
│   ├── manifest.xml         # Office add-in manifest
│   ├── css/                 # Stylesheets
│   └── js/                  # JavaScript files
├── backend/                 # Express.js API server
│   ├── src/                 # Source code
│   ├── package.json         # Node.js dependencies
│   └── Dockerfile          # Backend container config
├── database/               # Database initialization
│   └── init.sql            # Database schema and seed data
├── docker-compose.yml      # Multi-service orchestration
└── README.md              # This file
```

## Research Resources

During development, the following resources were consulted:

1. [Office Add-ins Documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/)
2. [Express.js JWT Authentication Guide](https://expressjs.com/)
3. [Docker Compose Documentation](https://docs.docker.com/compose/)
4. [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
5. [bcrypt Security Best Practices](https://www.npmjs.com/package/bcrypt)

## Future Enhancements

- Real Office 365 integration when developer account is available
- Additional contact data sources (LinkedIn, company directory)
- Enhanced security with refresh tokens
- Role-based access control
- Audit logging for API access

## Support

For any issues or questions, please check the troubleshooting section above or create an issue in the repository. 