callbacks


deploy docker images
public to github
CI
tests
lib/client:
    1. send to ipfs and run job
    2. post job

compose:
    ipfs cluster
    keys
    target chain / test

leftovers:
    job failures
    inconsistency
    stdout/stderr
    input/output dirs in dockers (/tmp1)
    verify hash of image
    gas and dapp handling:
        pricing
        verify
        compensation
    kill if takes too long
    aws kms to sign https://aws.amazon.com/blogs/database/part1-use-aws-kms-to-securely-manage-ethereum-accounts/
    change ipfs from liquidapps to dsp's
UIs:
    
    run job
    view/search jobs
    ipfs ide


dsp installation ui:
    status page
    check eth node status - wait and show progress
    kms or seed
    deposit/withdraw dsp gas
    register dsp
    approve and unapprove images
    faucet (if private chain)


