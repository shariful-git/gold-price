import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-xxxx-production'

# MySQL Database Configuration
# Update these values with your MySQL credentials
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost/bajus_prices'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class GoldPrice(db.Model):
    __tablename__ = 'gold_prices'
    id = db.Column(db.Integer, primary_key=True)
    karat = db.Column(db.String(20), nullable=False, unique=True)
    price = db.Column(db.Integer, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SilverPrice(db.Model):
    __tablename__ = 'silver_prices'
    id = db.Column(db.Integer, primary_key=True)
    karat = db.Column(db.String(20), nullable=False, unique=True)
    price = db.Column(db.Integer, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Initialize database
with app.app_context():
    # db.drop_all()
    db.create_all()
    
    # Create default admin user if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            password=generate_password_hash('admin#123'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print("Default admin user created: username='admin', password='admin#123'")
    
    # Add default prices if not exists
    if GoldPrice.query.count() == 0:
        default_gold = [
            GoldPrice(karat='22', price=0),
            GoldPrice(karat='21', price=0),
            GoldPrice(karat='18', price=0),
            GoldPrice(karat='সনাতন', price=0)
        ]
        db.session.add_all(default_gold)
        db.session.commit()
    
    if SilverPrice.query.count() == 0:
        default_silver = [
            SilverPrice(karat='সনাতন', price=0)
        ]
        db.session.add_all(default_silver)
        db.session.commit()

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Admin required decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            flash('অ্যাক্সেস অস্বীকৃত। শুধুমাত্র অ্যাডমিনরা এই পেজ দেখতে পারবেন।', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('admin_panel'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['is_admin'] = user.is_admin
            session.permanent = True
            flash('সফলভাবে লগইন হয়েছে!', 'success')
            return redirect(url_for('admin_panel'))
        else:
            flash('ভুল ইউজারনেম বা পাসওয়ার্ড!', 'error')
    
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    flash('সফলভাবে লগআউট হয়েছে!', 'success')
    return redirect(url_for('index'))

@app.route("/admin")
@admin_required
def admin_panel():
    gold_prices = GoldPrice.query.all()
    silver_prices = SilverPrice.query.all()
    return render_template("admin.html", gold_prices=gold_prices, silver_prices=silver_prices)

@app.route("/admin/update-gold", methods=['POST'])
@admin_required
def update_gold():
    try:
        data = request.get_json()
        for karat, price in data.items():
            gold = GoldPrice.query.filter_by(karat=karat).first()
            if gold:
                gold.price = int(price)
                gold.updated_at = datetime.utcnow()
            else:
                gold = GoldPrice(karat=karat, price=int(price))
                db.session.add(gold)
        
        db.session.commit()
        return jsonify({"success": True, "message": "স্বর্ণের দাম আপডেট হয়েছে"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/admin/update-silver", methods=['POST'])
@admin_required
def update_silver():
    try:
        data = request.get_json()
        for karat, price in data.items():
            silver = SilverPrice.query.filter_by(karat=karat).first()
            if silver:
                silver.price = int(price)
                silver.updated_at = datetime.utcnow()
            else:
                silver = SilverPrice(karat=karat, price=int(price))
                db.session.add(silver)
        
        db.session.commit()
        return jsonify({"success": True, "message": "রূপার দাম আপডেট হয়েছে"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/prices")
def prices():
    try:
        gold_prices = GoldPrice.query.all()
        silver_prices = SilverPrice.query.all()
        
        prices = {
            "gold": {g.karat: g.price for g in gold_prices},
            "silver": {s.karat: s.price for s in silver_prices}
        }
        
        return jsonify(prices)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)