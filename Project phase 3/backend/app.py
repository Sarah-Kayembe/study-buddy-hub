from flask import Flask
from flask_cors import CORS

#add other routes as needed
from routes.studygroup_routes import studygroup_bp

app = Flask(__name__)
CORS(app)

# registering blueprints
app.register_blueprint(studygroup_bp)

@app.route("/")
def health():
    return {"status": "backend running"}

if __name__ == "__main__":
    app.run(debug=True)

#feel free to change 
