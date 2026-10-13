import test from 'node:test';
import assert from 'node:assert/strict';
import {isTrustedOrigin,redactHeaders} from '../src/lib/security.ts';
test('same-origin mutation accepted over HTTPS',()=>assert.equal(isTrustedOrigin('https://eo.example.com','https://eo.example.com/api/invoices',true),true));
test('cross-origin and downgraded protocols rejected',()=>{assert.equal(isTrustedOrigin('https://bad.example.com','https://eo.example.com/api',true),false);assert.equal(isTrustedOrigin('http://eo.example.com','https://eo.example.com/api',true),false)});
test('origin missing denied in production, allowed for local development',()=>{assert.equal(isTrustedOrigin(null,'https://eo.example.com/api',true),false);assert.equal(isTrustedOrigin(null,'http://localhost:3000/api',false),true)});
test('malformed origin denied',()=>assert.equal(isTrustedOrigin('garbage','https://eo.example.com/api',true),false));
test('sensitive headers redacted',()=>assert.deepEqual(redactHeaders({authorization:'Bearer 123',cookie:'token=abc',accept:'application/json'}),{authorization:'[REDACTED]',cookie:'[REDACTED]',accept:'application/json'}));
