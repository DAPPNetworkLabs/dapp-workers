for d in fsroots/*/ ; do
    IPFSHASH=`ipfs --api="/dns/ipfs.liquidapps.io/tcp/5001" add -r $d -Q`
    DIR=`basename $d`
    echo $IPFSHASH > services/orchestrator/fsroots/$DIR.ipfs
    echo "$DIR"
done
