# 🚀 Highly Available AWS Multi-Tier Web Application

> **A production-style AWS & DevOps learning project demonstrating a highly available, secure, and containerized three-tier web application architecture.**

This project started as a simple **Student Entry application** and was progressively transformed into a distributed AWS deployment using **Amazon VPC, EC2, Application Load Balancers, Docker, Docker Compose, Nginx, FastAPI, PostgreSQL, Amazon RDS, NAT Gateway, Route Tables, Security Groups, GitHub, and DNS**.

---

## 📌 Project Overview

The application allows users to:

- Enter Student Name
- Enter Class
- Enter Subject
- Submit student information
- Retrieve previously stored student records

The final AWS architecture separates the application into three logical tiers:

```text
                    🌍 INTERNET
                         │
                         ▼
                  🌐 DNS / ROUTE 53
                         │
                         ▼
               ⚖️ EXTERNAL ALB
                  PUBLIC SUBNETS
                         │
                         ▼
              🖥️ WEB TIER - EC2 ×2
                  Nginx / Reverse Proxy
                         │
                         ▼
               ⚖️ INTERNAL ALB
                 PRIVATE SUBNETS
                         │
                         ▼
             🐳 APPLICATION TIER
                 EC2 ×2
              Docker Compose
              Angular + FastAPI
                         │
                         ▼
                 🗄️ RDS PostgreSQL
                  PRIVATE DB TIER
```

---

# 🏗️ Architecture

## High-Level Architecture

```text
                                      🌍 USER
                                        │
                                        │ HTTP / HTTPS
                                        ▼
                              ┌────────────────────┐
                              │    Route 53 / DNS  │
                              └─────────┬──────────┘
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │       EXTERNAL ALB       │
                         │      Internet-Facing     │
                         │      Public Subnets      │
                         └────────────┬─────────────┘
                                      │
                                  HTTP :80
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          ┌──────────────────┐                 ┌──────────────────┐
          │  student-web-01  │                 │  student-web-02  │
          │      Nginx       │                 │      Nginx       │
          │    Public EC2    │                 │    Public EC2    │
          └────────┬─────────┘                 └────────┬─────────┘
                   │                                    │
                   └────────────────┬───────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────────┐
                         │       INTERNAL ALB       │
                         │       Private ALB        │
                         │    Private App Subnets   │
                         └────────────┬─────────────┘
                                      │
                                  HTTP :80
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          ┌──────────────────┐                 ┌──────────────────┐
          │  student-app-01  │                 │  student-app-02  │
          │                  │                 │                  │
          │ Docker Compose   │                 │ Docker Compose   │
          │ Angular/Nginx    │                 │ Angular/Nginx    │
          │ FastAPI          │                 │ FastAPI          │
          └────────┬─────────┘                 └────────┬─────────┘
                   │                                    │
                   └────────────────┬───────────────────┘
                                    │
                              TCP :5432
                                    │
                                    ▼
                         ┌──────────────────────────┐
                         │      Amazon RDS          │
                         │      PostgreSQL 18.3     │
                         │       Private DB         │
                         └──────────────────────────┘
```

---

# ☁️ AWS Infrastructure

## Region

```text
ap-south-1
```

## VPC

```text
Name: student-HiAvail-vpc
CIDR: 10.0.0.0/16
```

---

# 🌐 Network Design

The VPC is divided into **six subnets across two Availability Zones**.

```text
                         VPC
                    10.0.0.0/16
                          │
             ┌────────────┴────────────┐
             │                         │
          AZ-A                       AZ-B
             │                         │
      ┌──────┼──────┐          ┌──────┼──────┐
      │      │      │          │      │      │
    Public  App     DB       Public  App     DB
```

## Availability Zone A

```text
student-public-a
student-app-private-a
student-db-private-a
```

## Availability Zone B

```text
student-public-b
student-app-private-b
student-db-private-b
```

---

# 📦 Subnet Purpose

| Subnet Type | Count | Resources |
|---|---:|---|
| Public | 2 | External ALB, Web EC2 |
| Private Application | 2 | Internal ALB, Application EC2 |
| Private Database | 2 | RDS subnet group |

This provides network-level separation between the web, application, and database layers.

---

# 🌉 Internet Gateway

Internet Gateway:

```text
my-IGW
```

The Internet Gateway is attached to the VPC.

The public route table provides internet connectivity to the public subnets.

```text
Public Subnet
      │
      ▼
Public Route Table
      │
      ▼
Internet Gateway
      │
      ▼
Internet
```

---

# 🔀 NAT Gateway

A regional NAT Gateway is used to provide outbound internet connectivity for private application servers.

```text
Private App EC2
       │
       ▼
  NAT Gateway
       │
       ▼
Internet Gateway
       │
       ▼
    Internet
```

The purpose is to allow private servers to perform tasks such as:

- Installing packages
- Installing Docker dependencies
- Updating the operating system
- Accessing required external resources

The private application EC2 instances do **not** need public inbound internet access.

---

# 🛣️ Route Tables

The project uses separate routing for public, application, and database networks.

### Public Route Table

```text
student-public-rt
```

Associated with:

```text
student-public-a
student-public-b
```

Default route:

```text
0.0.0.0/0 → Internet Gateway
```

### Private Application Route Table

```text
student-private-app-rt
```

Associated with:

```text
student-app-private-a
student-app-private-b
```

Private outbound traffic is routed through the NAT Gateway.

### Private Database Route Table

```text
student-private-db-rt
```

Associated with:

```text
student-db-private-a
student-db-private-b
```

The database tier remains private.

---

# ⚖️ Load Balancing

The architecture uses **two Application Load Balancers**.

## 1. External ALB

The External ALB is:

- Internet-facing
- Located in public subnets
- The main public entry point
- Responsible for distributing traffic to the web tier

```text
Internet
   │
   ▼
External ALB
   │
   ├── Web EC2-01
   │
   └── Web EC2-02
```

---

## 2. Internal ALB

The Internal ALB is:

- Internal/private
- Located across private application subnets
- Not directly accessible from the internet
- Responsible for distributing traffic to application servers

```text
Web Tier
   │
   ▼
Internal ALB
   │
   ├── App EC2-01
   │
   └── App EC2-02
```

The application target group ultimately showed:

```text
student-app-01 : 80 → Healthy
student-app-02 : 80 → Healthy
```

---

# 🖥️ Web Tier

Two EC2 instances are used:

```text
student-web-01
student-web-02
```

Both run:

```text
Nginx
```

Nginx acts as the web/reverse-proxy layer.

The instances are placed in separate Availability Zones.

Traffic flow:

```text
External ALB
     │
     ├─────────────┐
     ▼             ▼
 Web-01          Web-02
  Nginx           Nginx
     │             │
     └──────┬──────┘
            ▼
       Internal ALB
```

---

# 🐳 Application Tier

Two private EC2 instances:

```text
student-app-01
student-app-02
```

Each runs Docker Compose.

Each application server contains:

```text
┌──────────────────────────────┐
│       Docker Compose         │
│                              │
│  ┌────────────────────────┐  │
│  │ Frontend Container     │  │
│  │ Angular + Nginx        │  │
│  │ Port 80                │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ Backend Container      │  │
│  │ FastAPI / Uvicorn      │  │
│  │ Port 8000              │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

The frontend is published on:

```text
EC2 host :80
```

The FastAPI backend listens internally on:

```text
:8000
```

---

# 🗄️ Database Tier

The application uses Amazon RDS PostgreSQL instead of running PostgreSQL directly inside Docker in AWS.

Current database configuration:

```text
DB Instance: student-rds
Engine: PostgreSQL
Version: 18.3
Instance Class: db.t4g.micro
Storage: 20 GiB
Port: 5432
Public Access: Disabled
```

The database is placed in private database subnets through an RDS DB subnet group.

The application connects using:

```text
DATABASE_URL
```

The actual password and endpoint are stored outside the Git repository.

---

# 🔐 Security Groups

One of the core design principles of this project is **tier-specific Security Groups**.

There are **five logical Security Groups**:

```text
1. student-alb-sg
2. student-web-sg
3. student-internal-alb-sg
4. student-app-sg
5. student-rds-sg
```

---

## 🔗 Security Group Attachment Map

```text
                         INTERNET
                            │
                            ▼
                    ┌───────────────┐
                    │student-alb-sg │
                    └───────┬───────┘
                            │
                            ▼
                     EXTERNAL ALB
                            │
                            │ HTTP :80
                            ▼
                    ┌───────────────┐
                    │student-web-sg │
                    └───────┬───────┘
                            │
                            ▼
                     WEB EC2 × 2
                            │
                            │ HTTP :80
                            ▼
              ┌──────────────────────────┐
              │student-internal-alb-sg   │
              └────────────┬─────────────┘
                           │
                           ▼
                    INTERNAL ALB
                           │
                           │ HTTP :80
                           ▼
                    ┌───────────────┐
                    │student-app-sg │
                    └───────┬───────┘
                            │
                            │ PostgreSQL :5432
                            ▼
                    ┌───────────────┐
                    │student-rds-sg │
                    └───────┬───────┘
                            │
                            ▼
                         RDS DB
```

---

## 🔐 Security Group Responsibilities

| Security Group | Attached To | Purpose |
|---|---|---|
| `student-alb-sg` | External ALB | Public HTTP/HTTPS entry |
| `student-web-sg` | Web EC2-01/02 | Allows traffic from External ALB |
| `student-internal-alb-sg` | Internal ALB | Allows traffic from Web tier |
| `student-app-sg` | App EC2-01/02 | Allows traffic from Internal ALB |
| `student-rds-sg` | RDS | Allows PostgreSQL from App tier |

---

## `student-alb-sg`

Attached to:

```text
External ALB
```

Public users access the ALB through HTTP/HTTPS.

---

## `student-web-sg`

Attached to:

```text
student-web-01
student-web-02
```

Conceptually allows:

```text
HTTP :80 ← External ALB
SSH  :22 ← Trusted administration source
```

---

## `student-internal-alb-sg`

Attached to:

```text
Internal ALB
```

Allows:

```text
HTTP :80 ← Web tier
```

The Internal ALB is not internet-facing.

---

## `student-app-sg`

Attached to:

```text
student-app-01
student-app-02
```

Allows:

```text
HTTP :80 ← Internal ALB
SSH  :22 ← Web/jump-host access
```

The application servers remain in private subnets.

---

## `student-rds-sg`

Attached to:

```text
student-rds
```

Allows:

```text
TCP :5432 ← student-app-sg
```

The database is therefore not open to the public internet.

---

# 🔑 SSH / Jump Host Architecture

Private application EC2 instances are administered through a controlled SSH path.

```text
Administrator
      │
      │ SSH :22
      ▼
 Web EC2
      │
      │ SSH :22
      ▼
Private App EC2
```

This avoids exposing the private application servers directly to the internet.

---

# 🔄 Complete Application Traffic Flow

When a user submits a student record:

```text
1. Browser
     │
     ▼
2. Route 53 / DNS
     │
     ▼
3. External ALB
     │
     ▼
4. Web EC2 / Nginx
     │
     ▼
5. Internal ALB
     │
     ▼
6. Private App EC2
     │
     ▼
7. Frontend / FastAPI
     │
     ▼
8. PostgreSQL connection :5432
     │
     ▼
9. Amazon RDS
```

For a database write:

```text
Student Form
     │
     ▼
POST /students
     │
     ▼
FastAPI
     │
     ▼
SQLAlchemy
     │
     ▼
PostgreSQL
     │
     ▼
students table
```

For reading records:

```text
GET /students
     │
     ▼
FastAPI
     │
     ▼
RDS PostgreSQL
     │
     ▼
Student records
     │
     ▼
Frontend
```

---

# 📁 Repository Structure

```text
Highly-Available-AWS-Multi-Tier-Web-Application/
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
│
├── docker-compose.yml
├── docker-compose.aws.yml
├── .gitignore
└── README.md
```

---

# 👨‍💻 Contributor Setup

This section explains how to set up the project locally before making changes.

## Prerequisites

Install the following tools:

- Git
- Docker
- Docker Compose
- Node.js / npm
- Angular CLI *(optional if using Docker for the frontend)*
- Python 3.x *(optional if running the backend outside Docker)*

Verify the main tools:

```bash
git --version
docker --version
docker compose version
node --version
npm --version
```

---

## 1. Fork the Repository

Create your own fork of the GitHub repository.

Then clone your fork:

```bash
git clone https://github.com/<your-username>/Highly-Available-AWS-Multi-Tier-Web-Application.git
```

Move into the project:

```bash
cd Highly-Available-AWS-Multi-Tier-Web-Application
```

---

## 2. Create Your Environment File

Create a local `.env` file if the local Docker Compose configuration requires environment variables.

Example:

```text
DATABASE_URL=postgresql+psycopg://studentadmin:<PASSWORD>@<DATABASE-HOST>:5432/postgres
```

For local development, use your own local database credentials rather than production AWS credentials.

> **Never commit `.env` files or production credentials.**

Check that Git is ignoring the file:

```bash
git status
```

---

## 3. Start the Application Locally

Build and start the local application:

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker ps
```

Check logs if required:

```bash
docker compose logs
```

Or inspect individual services:

```bash
docker compose logs frontend
docker compose logs backend
```

---

## 4. Test the Application

Check the frontend:

```bash
curl -I http://localhost
```

Check the backend API:

```bash
curl http://localhost:8000/
```

Student API:

```bash
curl http://localhost:8000/students
```

The application should also be accessible through a browser using the local frontend address configured by the Compose setup.

---

## 5. Make Changes

Create a feature branch instead of working directly on `main`:

```bash
git checkout -b feature/<short-description>
```

Examples:

```bash
git checkout -b feature/student-validation
git checkout -b fix/api-error-handling
git checkout -b docs/update-deployment-guide
```

Make your changes and test them locally.

---

## 6. Validate Before Committing

Check the Git working tree:

```bash
git status
```

Review your changes:

```bash
git diff
```

If Docker configuration was changed, validate it:

```bash
docker compose config
```

Rebuild the application when appropriate:

```bash
docker compose up -d --build
```

Check the containers:

```bash
docker ps
```

---

## 7. Commit Your Changes

Use a clear commit message:

```bash
git add .
git commit -m "Add student input validation"
```

Examples of useful commit messages:

```text
Add student validation
Fix backend API response
Update Docker configuration
Improve Nginx configuration
Update AWS deployment documentation
Fix database connection handling
```

---

## 8. Push Your Branch

```bash
git push origin feature/<short-description>
```

Then open a Pull Request on GitHub.

The Pull Request should explain:

- What was changed
- Why it was changed
- How it was tested
- Whether Docker configuration changed
- Whether AWS infrastructure is affected

---

## 9. AWS Contribution Guidelines

Changes to the AWS infrastructure should be treated separately from normal application changes.

Before changing:

```text
VPC
Subnets
Route Tables
Security Groups
ALBs
EC2
RDS
NAT Gateway
DNS
```

document the intended change first.

Do **not** commit:

```text
.env
AWS passwords
RDS passwords
Private SSH keys
.pem files
Access keys
Secret tokens
```

AWS resources should follow the existing tier model:

```text
Internet
   ↓
External ALB
   ↓
Web Tier
   ↓
Internal ALB
   ↓
Application Tier
   ↓
RDS
```

Security Group rules should follow least-privilege communication between tiers rather than opening ports broadly to `0.0.0.0/0`.

---

## 10. Contributor Testing Checklist

Before submitting a Pull Request:

```text
[ ] Application builds successfully
[ ] Docker containers start successfully
[ ] Frontend loads
[ ] Backend API responds
[ ] Student records can be retrieved
[ ] Student records can be submitted
[ ] Database connectivity works
[ ] No secrets were committed
[ ] docker compose config passes
[ ] git diff was reviewed
[ ] Commit message is descriptive
[ ] README/documentation updated if necessary
```

---

## 🔄 Recommended Contribution Flow

```text
Fork Repository
       │
       ▼
Clone Repository
       │
       ▼
Create Feature Branch
       │
       ▼
Make Changes
       │
       ▼
Run Local Tests
       │
       ▼
Review git diff
       │
       ▼
Commit Changes
       │
       ▼
Push Branch
       │
       ▼
Open Pull Request
       │
       ▼
Code Review
       │
       ▼
Merge
```

---

# 🧩 Application Components

## Frontend

```text
Angular
```

Responsible for:

- Student form
- Input handling
- API requests
- Displaying student records

---

## Backend

```text
FastAPI
```

Responsible for:

- REST API
- Request validation
- Database operations
- Student record retrieval

Endpoints:

```text
GET  /students
POST /students
GET  /
```

---

# 🐳 AWS Docker Compose

The AWS-specific Compose file is:

```text
docker-compose.aws.yml
```

It runs:

```text
frontend
backend
```

The frontend publishes:

```text
80:80
```

The backend exposes:

```text
8000
```

internally.

The database connection is injected through:

```text
DATABASE_URL
```

---

# 🔐 Environment and Secrets

Sensitive configuration is intentionally kept outside GitHub.

The `.env` file is ignored through `.gitignore`.

Example structure:

```text
DATABASE_URL=postgresql+psycopg://studentadmin:<PASSWORD>@<RDS-ENDPOINT>:5432/postgres
```

> **Never commit the real `.env`, database password, RDS endpoint, private keys, or other secrets to GitHub.**

If the database password contains URL-reserved characters such as:

```text
@ : / # ? %
```

they must be URL-encoded when used inside the connection string.

---

# 🚀 Deployment Process

The overall deployment process was:

```text
Local Development
       │
       ▼
Angular + FastAPI + PostgreSQL
       │
       ▼
Dockerize Application
       │
       ▼
Git Repository
       │
       ▼
GitHub
       │
       ▼
AWS VPC
       │
       ├── Public Subnets
       │      └── Web EC2 + External ALB
       │
       ├── Private App Subnets
       │      └── App EC2 + Internal ALB
       │
       └── Private DB Subnets
              └── RDS PostgreSQL
```

---

# 🛠️ Application Deployment on EC2

After cloning the GitHub repository onto the private application server:

```bash
cd ~/Highly-Available-AWS-Multi-Tier-Web-Application
```

The AWS Compose configuration was checked using:

```bash
docker compose -f docker-compose.aws.yml config
```

Successful validation produced:

```text
Compose config OK
```

The application was then built and started with:

```bash
docker compose -f docker-compose.aws.yml up -d --build
```

Running containers were checked with:

```bash
docker ps
```

---

# 🧪 Validation and Troubleshooting

Several layers were tested independently.

## Nginx

```bash
curl -I http://localhost
```

A successful response:

```text
HTTP/1.1 200 OK
```

confirmed that Nginx was running.

---

## Frontend Container

```bash
curl -I http://localhost:80
```

Expected:

```text
HTTP/1.1 200 OK
```

---

## Docker

```bash
docker ps
```

Expected containers:

```text
student-aws-frontend
student-aws-backend
```

---

## Backend Logs

```bash
docker logs student-aws-backend --tail 50
```

Successful logs included:

```text
Application startup complete
GET /students 200 OK
POST /students 200 OK
```

This confirmed that the FastAPI application was running and handling requests.

---

# ❤️ ALB Health Checks

The application target group initially showed an unhealthy application server because the Docker containers were not running on that server.

Troubleshooting included:

```bash
sudo ss -tlnp | grep :80
```

and:

```bash
curl -I http://localhost:80
```

After starting the AWS Docker Compose deployment, the frontend container published:

```text
0.0.0.0:80 → 80
```

The local health check returned:

```text
HTTP/1.1 200 OK
```

The Internal ALB subsequently reported:

```text
student-app-01 → Healthy
student-app-02 → Healthy
```

This demonstrated successful connectivity between the Internal ALB and both application servers.

---

# 🗄️ Database Verification

The database can be checked from the private application tier using PostgreSQL tools.

Example:

```bash
psql "postgresql://studentadmin@<RDS-ENDPOINT>:5432/postgres"
```

Student records can then be checked using:

```sql
SELECT * FROM students;
```

or:

```sql
SELECT id, name, student_class, subject
FROM students
ORDER BY id;
```

Record count:

```sql
SELECT COUNT(*) FROM students;
```

This verifies that data submitted through the application is actually stored in Amazon RDS.

---

# ⚠️ PostgreSQL Client Compatibility

During database administration, the EC2 server had:

```text
psql client: PostgreSQL 16.15
RDS server: PostgreSQL 18.3
```

This produced a warning about the major-version mismatch.

The connection itself was successful and used:

```text
TLSv1.3
```

Some `psql` meta-commands, such as:

```sql
\l
```

may encounter compatibility problems when an older client is used with a newer PostgreSQL server.

This does **not** indicate that the RDS connection is broken.

---

# ♻️ High Availability Design

The web and application tiers are distributed across two Availability Zones.

```text
             ap-south-1
                  │
       ┌──────────┴──────────┐
       │                     │
    AZ-A                  AZ-B
       │                     │
       ▼                     ▼
   Web-01                 Web-02
       │                     │
       └─────────┬───────────┘
                 │
            External ALB
                 │
                 ▼
            Internal ALB
                 │
       ┌─────────┴─────────┐
       │                   │
       ▼                   ▼
    App-01              App-02
```

The load balancers use health checks to determine whether targets are available.

If a target becomes unhealthy, the ALB can stop routing traffic to it.

### Important limitation

The RDS deployment is currently:

```text
Single-AZ
```

Therefore, the project demonstrates redundancy primarily at the:

```text
Web Tier
Application Tier
```

The database tier uses managed private RDS but is not currently configured as Multi-AZ.

---

# 🔒 Security Principles

The architecture follows several important security principles:

### ✅ Network segmentation

Public, application, and database resources are separated into different subnet groups.

### ✅ Private application servers

Application EC2 instances are deployed in private subnets.

### ✅ Private database

RDS has public access disabled.

### ✅ Security Group chaining

Each tier accepts traffic from the tier that needs to communicate with it.

### ✅ Restricted database access

RDS accepts PostgreSQL traffic from the application tier on port `5432`.

### ✅ Restricted SSH

SSH access is controlled rather than broadly exposed to the internet.

### ✅ Secrets outside Git

Database credentials are stored in `.env` and excluded from Git.

### ✅ Load-balanced entry point

Users access the application through the External ALB rather than relying on direct EC2 access.

---

# 📊 Infrastructure Inventory

| Component | Configuration |
|---|---|
| AWS Region | `ap-south-1` |
| VPC | `student-HiAvail-vpc` |
| CIDR | `10.0.0.0/16` |
| Availability Zones | 2 |
| Total Subnets | 6 |
| Public Subnets | 2 |
| Private App Subnets | 2 |
| Private DB Subnets | 2 |
| Internet Gateway | `my-IGW` |
| NAT Gateway | Regional NAT |
| Route Tables | Public + Private App + Private DB |
| External ALB | Internet-facing |
| Internal ALB | Internal |
| Web EC2 | 2 |
| App EC2 | 2 |
| RDS | `student-rds` |
| Database | PostgreSQL 18.3 |
| RDS Class | `db.t4g.micro` |
| RDS Storage | 20 GiB |
| RDS Port | `5432` |
| RDS Public Access | Disabled |
| Security Groups | 5 |
| Containers per App EC2 | 2 |
| Frontend | Angular + Nginx |
| Backend | FastAPI |
| Database | PostgreSQL / Amazon RDS |
| Containerization | Docker + Docker Compose |
| Source Control | GitHub |

---

# 🧠 Key DevOps Concepts Demonstrated

## AWS

- Amazon VPC
- CIDR planning
- Public/private subnet design
- Availability Zones
- Internet Gateway
- NAT Gateway
- Route Tables
- EC2
- Application Load Balancer
- Internal Load Balancer
- Amazon RDS
- Security Groups
- Route 53 / DNS

## Linux

- Ubuntu
- SSH
- Jump-host administration
- Nginx
- systemd
- Package management
- Network troubleshooting
- Port checking
- Service validation

## Containers

- Docker
- Dockerfiles
- Docker Compose
- Multi-container applications
- Container networking
- Container troubleshooting

## Application

- Angular
- FastAPI
- REST API
- SQLAlchemy
- PostgreSQL
- Nginx

## DevOps

- Git
- GitHub
- Environment variables
- Secret management
- Application deployment
- Health checks
- Load balancing
- Infrastructure troubleshooting
- High-availability design

---

# 🏆 Final Architecture

```text
                              🌍 INTERNET
                                   │
                                   ▼
                            🌐 ROUTE 53 / DNS
                                   │
                                   ▼
                      ⚖️ EXTERNAL APPLICATION ALB
                           [student-alb-sg]
                                   │
                              HTTP/HTTPS
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
              🖥️ student-web-01          🖥️ student-web-02
                   Nginx                       Nginx
              [student-web-sg]           [student-web-sg]
                     │                           │
                     └─────────────┬─────────────┘
                                   │
                                HTTP :80
                                   │
                                   ▼
                       ⚖️ INTERNAL APPLICATION ALB
                       [student-internal-alb-sg]
                                   │
                                HTTP :80
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
              🐳 student-app-01           🐳 student-app-02
              [student-app-sg]            [student-app-sg]
                     │                           │
              ┌──────┴──────┐             ┌──────┴──────┐
              │             │             │             │
          Angular       FastAPI        Angular       FastAPI
          + Nginx        :8000         + Nginx        :8000
              │             │             │             │
              └─────────────┴─────────────┴─────────────┘
                                   │
                              TCP :5432
                                   │
                                   ▼
                         🗄️ AMAZON RDS
                         PostgreSQL 18.3
                         [student-rds-sg]
                         PRIVATE DB TIER
```

---

# 🔐 Security Group Chain

```text
Internet
   │
   ▼
student-alb-sg
   │
   ▼
External ALB
   │
   ▼
student-web-sg
   │
   ▼
Web EC2 ×2
   │
   ▼
student-internal-alb-sg
   │
   ▼
Internal ALB
   │
   ▼
student-app-sg
   │
   ▼
App EC2 ×2
   │
   ▼
student-rds-sg
   │
   ▼
RDS PostgreSQL
```

---

# 🎓 Project Outcome

This project demonstrates the progression from a basic local web application to a structured AWS deployment:

```text
Simple Application
       ↓
Angular + FastAPI
       ↓
PostgreSQL
       ↓
Docker
       ↓
Docker Compose
       ↓
GitHub
       ↓
AWS VPC
       ↓
Public / Private Subnets
       ↓
Nginx Web Tier
       ↓
External ALB
       ↓
Internal ALB
       ↓
Private Application Tier
       ↓
Amazon RDS
       ↓
Security Group Isolation
       ↓
Multi-AZ Web & App Architecture
       ↓
End-to-End Validation
```

The final architecture demonstrates practical understanding of **AWS networking, Linux administration, load balancing, containerization, database connectivity, security-group design, private infrastructure, Git-based deployment, troubleshooting, and high-availability application design.**

---

## ⭐ Project Summary

> **Built and deployed a containerized Angular + FastAPI Student Entry application on AWS using a three-tier architecture across two Availability Zones, with public Nginx web servers, external and internal Application Load Balancers, private Dockerized application servers, private Amazon RDS PostgreSQL, NAT-based outbound connectivity, tier-specific Security Groups, GitHub-based deployment, and environment-based database secret management.**
