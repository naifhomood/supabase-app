from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket

class MyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def run(port=8000):
    ip = get_ip()
    server_address = ('', port)
    httpd = HTTPServer(server_address, MyHandler)
    print(f'Server running at:')
    print(f'- Local: http://localhost:{port}')
    print(f'- Network: http://{ip}:{port}')
    httpd.serve_forever()

if __name__ == '__main__':
    run(9000)
