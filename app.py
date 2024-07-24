from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

json_file_path = 'search_queries.json'

if not os.path.exists(json_file_path):
    with open(json_file_path, 'w') as f:
        json.dump([], f)

@app.route('/get_queries', methods=['GET'])
def get_queries():
    with open(json_file_path, 'r') as f:
        queries = json.load(f)
    return jsonify(queries)

@app.route('/update_queries', methods=['POST'])
def update_queries():
    new_queries = request.json.get('query')
    if not new_queries:
        return jsonify({'error': 'No query provided'}), 400

    with open(json_file_path, 'r') as f:
        queries = json.load(f)

    queries = new_queries
    flat_queries = [item for sublist in queries for item in (sublist if isinstance(sublist, list) else [sublist])]
    unique_queries = list(set(flat_queries))

    with open(json_file_path, 'w') as f:
        json.dump(unique_queries, f)

    return jsonify({'message': 'Queries added successfully'}), 200

if __name__ == '__main__':
    app.run(port=5501)
