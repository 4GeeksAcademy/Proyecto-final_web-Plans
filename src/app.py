"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from datetime import datetime, timedelta
from pytz import timezone
from flask import Flask, request, jsonify, url_for, send_from_directory, render_template
from flask_migrate import Migrate
from flask_swagger import swagger
from api.utils import APIException, generate_sitemap
from api.models import db, User, Plan, Categories, UserPlan, AssistantPlan
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_cors import CORS

from flask_jwt_extended import create_access_token
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required
from flask_jwt_extended import JWTManager

from flask_mail import Mail, Message

from flask_bcrypt import Bcrypt

# from models import Person

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../public/')
app = Flask(__name__)

app.config.update(dict(
    DEBUG = False,
    MAIL_SERVER = 'smtp.gmail.com',
    MAIL_PORT = 587, 
    MAIL_USE_TLS = True,
    MAIL_USE_SSL = False,
    MAIL_USERNAME = 'bplan4geeks@gmail.com',
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD'),
    MAIL_DEFAULT_SENDER = 'bplan4geeks@gmail.com'
))

mail = Mail(app)
app.url_map.strict_slashes = False

app.config["JWT_SECRET_KEY"] = os.getenv("JWT-KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
jwt = JWTManager(app)

bcrypt = Bcrypt(app)

CORS(app)
# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# add the admin
setup_admin(app)

# add the admin
setup_commands(app)

# Add all endpoints form the API with a "api" prefix
app.register_blueprint(api, url_prefix='/api')

# Handle/serialize errors like a JSON object


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# any other endpoint will try to serve it like a static file
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response

@app.route('/register', methods=['POST'])
def register():
    body = request.get_json(silent=True)
    if body == None:
        return jsonify({'msg': 'Debes enviar la información en el body: email y password'}), 400
    if 'email' not in body:
        return jsonify({'msg': 'El campo email es obligatorio'}), 400
    if 'password' not in body:
        return jsonify({'msg': 'El campo password es obligatorio'}), 400
    if 'name' not in body:
        return jsonify({'msg': 'El campo name es obligatorio'}), 400
    user = User.query.filter_by(email=body['email']).first()
    if user is not None:
        return jsonify({'msg': f'El correo {body["email"]} ya ha sido registrado'}), 401
    new_user = User()
    new_user.email = body['email']
    new_user.password = bcrypt.generate_password_hash(body['password']).decode('utf-8')
    new_user.name = body['name']
    db.session.add(new_user)
    db.session.commit()
    access_token = create_access_token(identity=new_user.email)
    return jsonify({'msg': 'Nuevo usuario creado con éxito', 'token': access_token}), 201


    html_content = render_template('emails/welcome_email.html', name=body['name'])
    msg = Message(
        subject='Bienvenido a B PLAN',
        sender='bplan4geeks@gmail.com',
        recipients=[body['email']],
    )
    msg.replay_to = 'bplan4geeks@gmail.com'
    msg.html = html_content
    mail.send(msg)
    return jsonify({'msg': 'Nuevo usuario creado con éxito y correo de bienvenida enviado'}), 200

@app.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body: email y password'}), 400
    if 'email' not in body:
        return jsonify({'msg': 'El campo email es obligatorio'}), 400
    if 'password' not in body:
        return jsonify({'msg': 'El campo password es obligatorio'}), 400
    user = User.query.filter_by(email=body['email']).first()
    if user is None or not bcrypt.check_password_hash(user.password, body['password']):
        return jsonify({'msg': 'Correo o contraseña inválidos'}), 401
    access_token = create_access_token(identity=user.email)
    return jsonify({'token': access_token}), 200

@app.route('/private', methods=["GET"])
@jwt_required()
def protected():
    
    current_user = get_jwt_identity()
    return jsonify({'msg': 'ok', 'user': current_user}), 200

@app.route('/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    return jsonify({'msg': 'ok', 'user': {'id': user.id, 'email': user.email, 'name': user.name}}), 200

@app.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    data = request.get_json()
    if 'name' in data: 
        user.name = data['name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'description' in data:
        user.description = data['description']
    if 'address' in data:
        user.address = data['address']
    if 'birth' in data:
        user.birth = data['birth']
    if 'interests' in data:
        user.interests = data['interests']
    if 'image' in data:
        user.image = data['image']

    db.session.commit()

    return jsonify({'msg': 'ok', 'user': {'id': user.id, 
                                          'email': user.email, 
                                          'name': user.name, 
                                          'phone': user.phone,
                                          'description': user.description, 
                                          'address': user.address, 
                                          'birth': user.birth.isoformat() if user.birth else None,
                                          'interests': user.interests, 
                                          'image': user.image, 
                                          'subscription_date': user.subscription_date.isoformat() if user.subscription_date else None}}), 200

@app.route('/user/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    
    
    AssistantPlan.query.filter_by(user_id=user.id).delete()
    
   
    UserPlan.query.filter_by(user_id=user.id).delete()
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'msg': 'Usuario eliminado'}), 200

@app.route('/plans', methods=['POST'])
@jwt_required()
def create_plan():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes añadir información para el plan'}), 400
    if 'name' not in body:
        return jsonify({'msg': 'El campo name es obligatorio'}), 400
    if 'people' not in body:
        return jsonify({'msg': 'El campo people es obligatorio'}), 400
    if 'date' not in body:
        return jsonify({'msg': 'El campo date es obligatorio'}), 400
    if 'start_time' not in body:
        return jsonify({'msg': 'El campo start_time es obligatorio'}), 400
    if 'end_time' not in body:
        return jsonify({'msg': 'El campo end_time es obligatorio'}), 400
    if 'category_id' not in body:
        return jsonify({'msg': 'El campo category_id es obligatorio'}), 400
    new_plan = Plan(
        name=body['name'],
        people=body['people'],
        date=body['date'],
        start_time=body['start_time'],
        end_time=body['end_time'],
        longitude=body.get('longitude'),
        latitude=body.get('latitude'),
        category_id=body['category_id'],
        image=body.get('image'),
        status="open",
        user_id=user.id)
    db.session.add(new_plan)
    db.session.commit()
    return jsonify({'msg': 'Nuevo plan creado con éxito', 'plan': new_plan.serialize()}), 200

@app.route('/plans', methods=['GET'])
def get_plans():
    plans = Plan.query.all()
    return jsonify([plan.serialize() for plan in plans]), 200

@app.route('/plans/<int:plan_id>', methods=['GET'])
def get_single_plan(plan_id):
    plan = Plan.query.get(plan_id)
    if plan is None:
        return jsonify({'msg': f'El plan con id {plan_id} no existe'}), 404
    plan_serialized = plan.serialize()
    plan_serialized['assistants'] = [assistant_plan.assistant.serialize() for assistant_plan in plan.assistant_plans]
    return jsonify({'msg': 'ok', 'data': plan_serialized}), 200

@app.route('/plans/<int:plan_id>', methods=['PUT'])
def put_plan(plan_id):
    plan = Plan.query.get(plan_id)
    if plan is None:
        return jsonify({'msg': f'El plan con id {plan_id} no existe'}), 404
    data = request.get_json()
    if 'name' in data: 
        plan.name = data['name']
    
    if 'people' in data:
        active_users = plan.people_active
        if data['people'] < active_users:
            return jsonify({'msg': f'No puedes reducir la capacidad a menos de {active_users} personas porque ya hay {active_users} apuntadas.'}), 400
        plan.people = data['people']
    db.session.commit()
    plan_serialized = plan.serialize()
    plan_serialized['assistants'] = [assistant_plan.assistant.serialize() for assistant_plan in plan.assistant_plans]
    return jsonify({'msg': 'ok', 'data': plan_serialized}), 200

@app.route('/plans/<int:plan_id>', methods=['DELETE'])
def delete_plan(plan_id):
    plan = Plan.query.get(plan_id)
    if plan is None:
        return jsonify({'msg': f'El plan con id {plan_id} no existe'}), 404
    db.session.delete(plan)
    db.session.commit()
    return jsonify({'msg': 'Plan eliminado'}), 200

@app.route('/plans/active', methods=['GET'])
@jwt_required()
def get_active_plans():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    today = datetime.date.today()
    upcoming_plans = db.session.query(Plan).join(UserPlan).filter(UserPlan.user_id == user.id, Plan.date > today).all()
    if not upcoming_plans:
        return jsonify({'msg': 'El usuario no tiene planes activos'}), 404
    return jsonify({'msg': 'ok', 'upcoming_plans': [plan.serialize() for plan in upcoming_plans]}), 200

@app.route('/plans/<int:plan_id>/join', methods=['POST'])
@jwt_required()
def join_plan(plan_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    plan = Plan.query.get(plan_id)
    if plan is None:
        return jsonify({'msg': f'El plan con id {plan_id} no existe'}), 404
    if plan.status == "closed":
        return jsonify({'msg': 'No puedes unirte a un plan que está cerrado'}), 400
    existing_join = UserPlan.query.filter_by(user_id=user.id, plan_id=plan.id).first()
    if existing_join is not None:
        return jsonify({'msg': 'Ya estás unido a este plan'}), 400
    if plan.people_active >= plan.people:
        return jsonify({'msg': 'El plan ya está lleno'}), 400
    new_join = UserPlan(user_id=user.id, plan_id=plan.id)
    db.session.add(new_join)
    plan.people_active += 1
    if plan.people_active >= plan.people:
        plan.status = "full"
    db.session.commit()
    plan_creator = User.query.get(plan.user_id)
    if plan_creator and plan_creator.email != user_email:
        html_content = render_template('emails/join_plan.html', plan_name=plan.name, joiner_name=user.email)
        msg = Message(
            subject=f'Alguien se ha unido a tu plan: {plan.name}',
            sender='bplan4geeks@gmail.com',
            recipients=[plan_creator.email],
        )
        msg.html = html_content
        mail.send(msg)
    return jsonify({'msg': 'Te has unido al plan con éxito', 'plan': plan.serialize()}), 200

@app.route('/plans/<int:plan_id>/leave', methods=['POST'])
@jwt_required()
def leave_plan(plan_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    plan = Plan.query.get(plan_id)
    if plan is None:
        return jsonify({'msg': f'El plan con id {plan_id} no existe'}), 404
    user_plan = UserPlan.query.filter_by(user_id=user.id, plan_id=plan.id).first()
    if user_plan is None:
        return jsonify({'msg': 'No estás unido a este plan'}), 400
    db.session.delete(user_plan)
    plan.people_active -= 1
    if plan.status == "full" and plan.people_active < plan.people:
        plan.status = "open"
    db.session.commit()
    return jsonify({'msg': 'Has salido del plan:', 'plan': plan.serialize()}), 200

spain_tz = timezone('Europe/Madrid')

@app.route('/plans/<int:plan_id>/status', methods=['PUT'])
@jwt_required()
def status_plan(plan_id):
    plan = Plan.query.get(plan_id)
    if plan is None:
        return jsonify({'msg': f'El plan con id {plan_id} no existe'}), 404
    current_time = datetime.now(spain_tz).time()
    if plan.end_time <= current_time:
        plan.status = "closed"
    elif plan.people_active >= plan.people:
        plan.status = "full"
    else:
        plan.status = "open"
    db.session.commit()
    return jsonify({'msg': f'El estado del plan con id {plan_id} ahora esta {plan.status}'}), 200

@app.route('/plans/history', methods=['GET'])
@jwt_required()
def plan_history():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    plans = Plan.query.join(UserPlan).filter(UserPlan.user_id == user.id, Plan.status == "closed").all()
    if not plans:
        return jsonify({'msg': 'No hay planes cerrados en el historial del usuario'}), 404
    return jsonify({'msg': 'ok', 'plans': [plan.serialize() for plan in plans]}), 200

@app.route('/categories', methods=['GET'])
def get_categories():
    categories = Categories.query.all()
    return jsonify([category.serialize() for category in categories]), 200

@app.route('/categories/<int:categories_id>', methods=['GET'])
def get_categories_id(categories_id):
    category = Categories.query.get(categories_id)
    if category is None:
        return jsonify({'msg': f'La categoria con id {categories_id} no existe'}), 404
    return jsonify({'category': category.serialize()}), 200

@app.route('/send_mail', methods={'GET'})
def send_mail():
    msg = Message(
        subject='Test mail',
        sender='bplan4geeks@gmail.com',
        recipients={'bplan4geeks@gmail.com'},
    )
    msg.html = "<h1>Te envié este correo desde flask</h1>"
    mail.send(msg)
    return jsonify({'msg': 'Correo enviado!!!'})

from flask import request, jsonify
from werkzeug.utils import secure_filename
import os

@app.route('/api/uploadProfileImage', methods=['POST'])
@jwt_required()
def upload_profile_image():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404

    # Verificar si la solicitud tiene un archivo
    if 'file' not in request.files:
        return jsonify({'msg': 'No se adjuntó ninguna imagen'}), 400

    file = request.files['file']
    
    # Si no hay archivo, se retorna un error
    if file.filename == '':
        return jsonify({'msg': 'No se adjuntó ninguna imagen'}), 400

    # Guardar la imagen con un nombre seguro
    filename = secure_filename(file.filename)
    filepath = os.path.join('uploads', filename)
    
    file.save(filepath)
    
    # Actualizar la imagen de perfil del usuario
    user.image = filepath
    db.session.commit()

    return jsonify({'msg': 'Imagen subida correctamente', 'image_url': filepath}), 200


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
