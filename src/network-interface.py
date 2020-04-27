import drs_prot as drs
import io

from flask import Flask, render_template, request, json, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config["JSON_AS_ASCII"] = False
@app.route('/point_matrix', methods=['POST'])


def set_data():
	text = request.form.get('text_in')
	target = int(request.form.get('target'))
	matrix, matrix_lavel, raw_paragraph, arr_content = drs.Point_matrix(text, target)
	data = {
			"matrix": matrix,
			"matrix-label": matrix_lavel,
			"paragraph": raw_paragraph,
			"content": arr_content
			}
	s = json.dumps(data)
	mem = io.BytesIO()
	mem.write( s.encode('utf-8'))
	mem.seek(0)

	ret = send_file( mem, mimetype='application/json', as_attachment=True, attachment_filename='matrix.json')
	return ret


@app.route('/hello')
def hello():
    return 'hello world!'

if __name__ == '__main__':
	app.run()