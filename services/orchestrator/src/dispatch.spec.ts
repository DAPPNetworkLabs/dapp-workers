import mocha from 'mocha';
import { dispatch } from '../src/dispatch';
import { assert, expect } from "chai"

describe('test dapp workers', () => {
    before(done => {
        (async () => {
            try {
                done();
            } catch(e) {
                done(e)
            }
        })();
    });

    it('set image', done => {
        try {
            done()
        } catch(e) {
            done(e)
        }
    })

    it('register dsp', done => {
        done();
    })

    it('approve image', done => {
        done();
    })

    it('run job', done => {
        done();
    })
});
