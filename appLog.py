import logging
import os
import logging.config
from logging.handlers import SocketHandler
import pythonjsonlogger.jsonlogger
from src import logcolor

if not os.path.exists('./src/logs'):
    os.makedirs('./src/logs', exist_ok=True)
try:
    logging.config.fileConfig("src/logging.ini", disable_existing_loggers=True)
except FileNotFoundError:
    # If logging.ini doesn't exist, use basic configuration
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)
try:
    socket_handler = SocketHandler("127.0.0.1", 19996)
except:
    pass
log.addHandler(socket_handler)
