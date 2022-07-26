for d in fsroots/*/ ; do
    IPFSHASH=`ipfs --api="/dns/$IPFS_HOST/tcp/5001" add -r $d -Q`
    DIR=`basename $d`
    echo $IPFSHASH > services/orchestrator/fsroots/$DIR.ipfs
    echo "$DIR"
done
