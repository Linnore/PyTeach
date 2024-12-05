import os
import logging


def get_logger(name: str = "pyteach"):
    # Set up logging to write to a file
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s:%(filename)s:%(lineno)d - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("app.log"),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if os.getenv(
        "PYTEACH_DEBUG", "0") == '1' else logging.INFO)
    return logger
