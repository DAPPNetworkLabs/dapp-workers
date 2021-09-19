IPFSHASH=`ipfs --api="/dns/ipfs.liquidapps.io/tcp/5001" add -r fsroots/pngWriterTest -Q`
echo $IPFSHASH > fsroots/pngWriterTest.ipfs
