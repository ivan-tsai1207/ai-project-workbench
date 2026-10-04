import test from 'node:test';
import assert from 'node:assert/strict';
import { hash } from '../risk/fixtures.mjs';
import { gateFixture } from './fixtures.mjs';
const time='2026-10-04T14:00:00Z';
test('deterministic deeply immutable artifact and definition bound result',()=>{const f=gateFixture();const a=f.runner.runGate('IMPLEMENTATION_GATE',f.id,time);assert.deepEqual(a,f.runner.runGate('IMPLEMENTATION_GATE',f.id,time));assert.equal(a.status,'PASS');assert.equal(a.artifact_hashes.length,2);assert(Object.isFrozen(a));assert(Object.isFrozen(a.evidence));});
for (const [name,mutate] of [
 ['missing review',f=>f.admission.reviews.pop()],
 ['stale review hash',f=>f.admission.reviews[0].artifact_hashes=[hash('stale')]],
 ['unassigned profile',f=>f.admission.reviews[0].review_profile='SPEC_REVIEWER'],
 ['same execution',f=>f.admission.reviews[0].execution_id='maker'],
 ['duplicate execution',f=>f.admission.reviews[1].execution_id=f.admission.reviews[0].execution_id],
 ['review REQUEST_CHANGES',f=>f.admission.reviews[0].result='REQUEST_CHANGES'],
 ['missing required check',f=>f.admission.reviews[0].checks_performed=[]],
 ['failed criterion',f=>f.admission.criteria[0].status='FAILED'],
]) test(name+' prevents PASS',()=>{const f=gateFixture();mutate(f);assert.equal(f.runner.runGate('IMPLEMENTATION_GATE',f.id,time).status,'FAILED');});
test('blocking finding prevents PASS',()=>{const f=gateFixture();f.admission.findings.push({schema_version:'harness.finding/v1',finding_id:'blocking',review_profile:'TECH_REVIEWER',owner_role:'IMPLEMENTER',work_item_id:f.id,artifact_ref:f.artifact,artifact_hash:hash('artifact'),requirement_references:[],description:'blocking',severity:'BLOCKING',evidence_references:[],required_action:'fix',status:'OPEN'});assert.equal(f.runner.runGate('IMPLEMENTATION_GATE',f.id,time).status,'FAILED');});
test('clarification is separate Gate decision',()=>{const f=gateFixture();f.admission.criteria[0].status='NEEDS_CLARIFICATION';assert.equal(f.runner.runGate('IMPLEMENTATION_GATE',f.id,time).status,'NEEDS_CLARIFICATION');});
test('mandatory gate cannot be removed',()=>{const f=gateFixture();f.admission.required_gates=[];assert.throws(()=>f.runner.resolveRequiredGates(f.id,'IMPLEMENTATION_GATE'));f.admission.required_gates=['IMPLEMENTATION_GATE'];assert.deepEqual(f.runner.resolveRequiredGates(f.id,'IMPLEMENTATION_GATE'),['IMPLEMENTATION_GATE']);});
test('wrong definition hash and missing canonical criteria reject',()=>{const f=gateFixture();f.admission.definition.hash=hash('wrong');assert.throws(()=>f.runner.runGate('IMPLEMENTATION_GATE',f.id,time));const g=gateFixture();g.admission.criteria.pop();assert.throws(()=>g.runner.runGate('IMPLEMENTATION_GATE',g.id,time));});
test('Release execution remains out of scope',()=>{const f=gateFixture();assert.throws(()=>f.runner.runGate('RELEASE_GATE',f.id,time));});
