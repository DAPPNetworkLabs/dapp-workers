SCRIPT_DIR="$( dirname $0 )"

$SCRIPT_DIR/deploy-roots.sh
$SCRIPT_DIR/build-dockers.sh
$SCRIPT_DIR/run-local.sh