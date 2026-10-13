import test from 'node:test';
import assert from 'node:assert/strict';
import {newActivationToken,digestToken,validActivationToken,validActivationRequest} from '../src/lib/activation.ts';
test('token is random and hashed before database storage',()=>{const a=newActivationToken(),b=newActivationToken();assert.notEqual(a,b);assert.equal(validActivationToken(a),true);assert.equal(digestToken(a).length,64);assert.notEqual(a,digestToken(a))});
test('invalid tokens and activation requests are rejected',()=>{assert.equal(validActivationToken('123'),false);assert.equal(validActivationRequest({organization:'vinca-uat',email:'owner@example.com'}),true);assert.equal(validActivationRequest({organization:'../../production',email:'owner@example.com'}),false)});
