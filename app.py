import logging
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import csv

app = Flask(__name__)
CORS(app)

json_file_path = 'search_queries.json'
log_file_path = 'activity_log.csv'

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

if not os.path.exists(log_file_path):
    with open(log_file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['date and time', 'type of action', 'specific action taken'])

logger = logging.getLogger('activity_logger')
logger.setLevel(logging.INFO)

class CsvFormatter(logging.Formatter):
    def __init__(self):
        super().__init__()
        self.datefmt = '%Y-%m-%d %H:%M:%S'

    def format(self, record):
        record.asctime = self.formatTime(record, self.datefmt)
        return f'{record.asctime},{record.action_type},{record.action_details}'

handler = logging.FileHandler(log_file_path)
handler.setFormatter(CsvFormatter())
logger.addHandler(handler)

def log_action(action_type, action_details):
    logger.info('', extra={'action_type': action_type, 'action_details': action_details})

@app.route('/get_queries', methods=['GET'])
def get_queries():
    with open(json_file_path, 'r') as f:
        queries = json.load(f)
    log_action('get_queries', 'Retrieved queries')
    return jsonify(queries)

@app.route('/update_queries', methods=['POST'])
def update_queries():
    new_queries = request.json.get('query')
    if not new_queries:
        log_action('update_queries', 'No query provided')
        return jsonify({'error': 'No query provided'}), 400

    with open(json_file_path, 'r') as f:
        queries = json.load(f)

    flat_queries = [item for sublist in new_queries for item in (sublist if isinstance(sublist, list) else [sublist])]
    unique_queries = list(set(flat_queries))

    added_queries = []
    for uq in unique_queries:
        if not any(uq == q[0] for q in queries):
            queries.append([uq, 0])
            added_queries.append(uq)

    with open(json_file_path, 'w') as f:
        json.dump(queries, f)

    log_action('update_queries', f'"{added_queries}"')
    return jsonify({'message': 'Queries added successfully'}), 200

@app.route('/delete_query', methods=['DELETE'])
def delete_query():
    keyword_to_delete = request.json.get('query')
    if not keyword_to_delete:
        log_action('delete_query', 'No query provided')
        return jsonify({'error': 'No query provided'}), 400

    try:
        with open(json_file_path, 'r') as f:
            queries = json.load(f)

        queries = [q for q in queries if q[0] != keyword_to_delete]

        with open(json_file_path, 'w') as f:
            json.dump(queries, f)

        log_action('delete_query', f'Deleted query: {keyword_to_delete}')
        return jsonify({'message': f'Query "{keyword_to_delete}" deleted successfully'}), 200

    except FileNotFoundError:
        log_action('delete_query', 'JSON file not found')
        return jsonify({'error': 'JSON file not found'}), 500
    except json.JSONDecodeError:
        log_action('delete_query', 'Error decoding JSON file')
        return jsonify({'error': 'Error decoding JSON file'}), 500

@app.route('/increment_click', methods=['POST'])
def increment_click():
    data = request.json
    query_to_increment = data.get('query')
    platform = data.get('platform')

    if not query_to_increment:
        log_action('increment_click', 'No query provided')
        return jsonify({'error': 'No query provided'}), 400

    if not platform:
        log_action('increment_click', f'No platform provided for query: {query_to_increment}')
        return jsonify({'error': 'No platform provided'}), 400

    with open(json_file_path, 'r') as f:
        queries = json.load(f)

    for q in queries:
        if q[0] == query_to_increment:
            q[1] += 1
            break
    else:
        log_action('increment_click', f'Query not found: {query_to_increment} on platform: {platform}')
        return jsonify({'error': 'Query not found'}), 404

    with open(json_file_path, 'w') as f:
        json.dump(queries, f)

    log_action('increment_click', f'Incremented click count for: {query_to_increment} on platform: {platform}')
    return jsonify({'message': 'Click count incremented successfully'}), 200

@app.route('/get_logs', methods=['GET'])
def get_logs():
    try:
        if not os.path.exists(log_file_path):
            log_action('get_logs', 'Log file not found')
            return jsonify({'error': 'Log file not found'}), 404

        with open(log_file_path, 'r') as f:
            csv_data = f.read()

        log_action('get_logs', 'Log file retrieved successfully')
        return jsonify({'log_data': csv_data}), 200
    except Exception as e:
        log_action('get_logs', f'Error retrieving log file: {str(e)}')
        return jsonify({'error': 'Error retrieving log file'}), 500

if __name__ == '__main__':
    app.run(port=5501)
