#!/bin/sh
if [ $# -eq 0 ]; then
	>&2 echo "Usage: $0 [-d|-p] <api> [data]"
	exit 1
fi
if [ $# -eq 1 ]; then
	curl "http://localhost:3000/api/$1"
else
	case "$1" in
		-d)
			curl -X DELETE "http://localhost:3000/api/$2"
			;;
		-p)
			curl -H 'Content-Type: application/json' \
				-X PUT "http://localhost:3000/api/$2" \
				-d "$3"
			;;
		*)
			curl -H 'Content-Type: application/json' \
				"http://localhost:3000/api/$1" -d "$2"
	esac
fi
