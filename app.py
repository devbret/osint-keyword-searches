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
else:
    with open(json_file_path, 'r') as f:
        queries = json.load(f)
        if isinstance(queries, list) and all(isinstance(item, str) for item in queries):
            queries = [[query, 0] for query in queries]
            with open(json_file_path, 'w') as f:
                json.dump(queries, f)

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

    flat_queries = [item for sublist in new_queries for item in (sublist if isinstance(sublist, list) else [sublist])]
    unique_queries = list(set(flat_queries))

    for uq in unique_queries:
        if not any(uq == q[0] for q in queries):
            queries.append([uq, 0])

    with open(json_file_path, 'w') as f:
        json.dump(queries, f)

    return jsonify({'message': 'Queries added successfully'}), 200

@app.route('/increment_click', methods=['POST'])
def increment_click():
    query_to_increment = request.json.get('query')
    if not query_to_increment:
        return jsonify({'error': 'No query provided'}), 400

    with open(json_file_path, 'r') as f:
        queries = json.load(f)

    for q in queries:
        if q[0] == query_to_increment:
            q[1] += 1
            break
    else:
        return jsonify({'error': 'Query not found'}), 404

    with open(json_file_path, 'w') as f:
        json.dump(queries, f)

    return jsonify({'message': 'Click count incremented successfully'}), 200

if __name__ == '__main__':
    app.run(port=5501)

