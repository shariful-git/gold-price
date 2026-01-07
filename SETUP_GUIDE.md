# MySQL Database Setup Guide for Bajus Price Tracker

## Prerequisites
- MySQL Server installed (5.7+ or 8.0+)
- Python 3.8+
- pip (Python package manager)

## Step 1: Install MySQL Server

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### On Windows:
Download and install from: https://dev.mysql.com/downloads/mysql/

### On macOS:
```bash
brew install mysql
brew services start mysql
```

## Step 2: Create MySQL Database and User

Login to MySQL:
```bash
mysql -u root -p
```

Run these commands in MySQL:
```sql
-- Create database
CREATE DATABASE bajus_prices CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (change 'your_password' to a strong password)
CREATE USER 'bajus_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON bajus_prices.* TO 'bajus_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

## Step 3: Run the Setup SQL Script

Option A - Using command line:
```bash
mysql -u bajus_user -p bajus_prices < setup_database.sql
```

Option B - Using MySQL Workbench or phpMyAdmin:
1. Open the `setup_database.sql` file
2. Execute the script

## Step 4: Update Flask Configuration

Open `app.py` and update the database connection string:

```python
# Find this line (around line 13):
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://username:password@localhost/bajus_prices'

# Replace with your actual credentials:
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://bajus_user:your_password@localhost/bajus_prices'
```

**Connection String Format:**
```
mysql+pymysql://username:password@host:port/database_name
```

**Examples:**
- Local: `mysql+pymysql://bajus_user:mypass123@localhost/bajus_prices`
- Remote: `mysql+pymysql://bajus_user:mypass123@192.168.1.100:3306/bajus_prices`
- Custom Port: `mysql+pymysql://bajus_user:mypass123@localhost:3307/bajus_prices`

## Step 5: Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Step 6: Run the Application

```bash
python app.py
```

The application will:
1. Connect to MySQL database
2. Create tables automatically (if using Flask-SQLAlchemy auto-create)
3. Insert default admin user and prices
4. Start the Flask server

## Step 7: Access the Application

- **Home Page:** http://localhost:5000/
- **Login Page:** http://localhost:5000/login
- **Admin Panel:** http://localhost:5000/admin

### Default Login Credentials:
- **Username:** admin
- **Password:** admin123

⚠️ **IMPORTANT:** Change the default admin password after first login!

## Troubleshooting

### Error: "Access denied for user"
- Check username and password in connection string
- Verify user has been created: `mysql -u bajus_user -p`

### Error: "Unknown database 'bajus_prices'"
- Make sure database was created: `SHOW DATABASES;`
- Run the setup_database.sql script again

### Error: "Can't connect to MySQL server"
- Check if MySQL is running: `sudo systemctl status mysql`
- Start MySQL: `sudo systemctl start mysql`

### Error: "No module named 'pymysql'"
- Install dependencies: `pip install -r requirements.txt`

### Character encoding issues with Bangla text
- Ensure database uses utf8mb4: 
```sql
ALTER DATABASE bajus_prices CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Production Deployment Tips

1. **Change Secret Key:**
   ```python
   app.config['SECRET_KEY'] = 'generate-a-strong-random-key-here'
   ```

2. **Use Environment Variables:**
   ```python
   import os
   app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
   ```

3. **Enable SSL for MySQL:**
   ```python
   app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://user:pass@host/db?ssl_ca=/path/to/ca.pem'
   ```

4. **Set Debug to False:**
   ```python
   if __name__ == "__main__":
       app.run(debug=False, host='0.0.0.0', port=5000)
   ```

5. **Use a Production Server:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

## Database Backup

### Backup:
```bash
mysqldump -u bajus_user -p bajus_prices > bajus_backup.sql
```

### Restore:
```bash
mysql -u bajus_user -p bajus_prices < bajus_backup.sql
```

## Verify Installation

Check if tables were created:
```bash
mysql -u bajus_user -p bajus_prices -e "SHOW TABLES;"
```

You should see:
```
+------------------------+
| Tables_in_bajus_prices |
+------------------------+
| gold_prices            |
| silver_prices          |
| users                  |
+------------------------+
```