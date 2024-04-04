import { createActor } from 'xstate';
import machine from './machine.js';

const actor = createActor(machine, {
  input: { moduleId: 1 }
});

actor.subscribe((snapshot) => {
  console.log(snapshot.context);
});

actor.start();

actor.send({ type: 'INIT'});

actor.send({ type: 'NAVIGATE', data: { moduleId: 2, stepId: 0 } });

actor.send({ type: 'SAVE_OUTPUT', data: { test1: true, test2: false } });

actor.send({ type: 'NAVIGATE', data: { moduleId: 3, stepId: 1 } });

actor.send({ type: 'SAVE_OUTPUT', data: { blahblah: "BLAHBLAH" } });

actor.send({ type: 'COMPLETE'});