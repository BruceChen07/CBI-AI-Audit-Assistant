#!/bin/bash

# Set default values
FILE_LEVEL="INFO"
CONSOLE_LEVEL="INFO"

# Process command line arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [file_level] [console_level]"
    echo "Example: $0 INFO WARNING"
    echo "Current settings: File log level=$FILE_LEVEL, Console log level=$CONSOLE_LEVEL"
    exit 0
fi

if [ $# -ge 1 ]; then
    FILE_LEVEL=$1
fi

if [ $# -ge 2 ]; then
    CONSOLE_LEVEL=$2
fi

echo "Updating log levels..."
echo "File log level: $FILE_LEVEL"
echo "Console log level: $CONSOLE_LEVEL"

# Create temporary file and update configuration
sed -e "s/file_handler\.setLevel(logging\.[A-Z]\+)/file_handler.setLevel(logging.$FILE_LEVEL)/" \
    -e "s/console_handler\.setLevel(logging\.[A-Z]\+)/console_handler.setLevel(logging.$CONSOLE_LEVEL)/" \
    src/config.py > temp_config.py

# Replace original file
mv temp_config.py src/config.py

echo "Log levels have been updated"